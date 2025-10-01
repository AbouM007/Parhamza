import { Router } from "express";
import Stripe from "stripe";
import { supabaseServer } from "../supabase";
import { requireAuth } from "../middleware/auth";
import express from "express";

const router = Router();

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("Missing required Stripe secret: STRIPE_SECRET_KEY");
}
if (!process.env.STRIPE_WEBHOOK_SECRET) {
  console.warn(
    "⚠️ STRIPE_WEBHOOK_SECRET missing (webhook will fail signature check)",
  );
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/* --------------------------------- HELPERS -------------------------------- */

async function mapPriceToPlanId(priceId: string): Promise<number | null> {
  const { data: plan, error } = await supabaseServer
    .from("subscription_plans")
    .select("id")
    .eq("stripe_price_id", priceId)
    .maybeSingle();
  if (error) {
    console.error("❌ mapPriceToPlanId error:", error);
    return null;
  }
  return plan?.id ?? null;
}

async function getActiveSubscriptionByUserId(userId: string) {
  const { data, error } = await supabaseServer
    .from("subscriptions")
    .select(
      `
      id,
      status,
      plan_id,
      cancel_at_period_end,
      current_period_end,
      subscription_plans ( name, max_listings )
    `,
    )
    .eq("user_id", userId)
    .in("status", ["active", "trialing"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) {
    console.error("❌ getActiveSubscriptionByUserId error:", error);
    return null;
  }
  return data;
}

function tsToIso(tsSec?: number | null) {
  return tsSec ? new Date(tsSec * 1000).toISOString() : null;
}

/* ---------------------------- SUBSCRIPTION PLANS --------------------------- */

// GET /api/subscription-plans - Récupérer tous les plans disponibles
router.get("/plans", async (_req, res) => {
  try {
    const { data: plans, error } = await supabaseServer
      .from("subscription_plans")
      .select("*")
      .eq("is_active", true)
      .order("price_monthly", { ascending: true });

    if (error) {
      console.error("❌ Erreur récupération plans:", error);
      return res.status(500).json({ error: "Erreur serveur" });
    }

    res.json(plans || []);
  } catch (error) {
    console.error("❌ Erreur récupération plans:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

/* --------------------------- CHECKOUT + SUCCESS ---------------------------- */

// POST /api/create-checkout-session - Créer session Stripe Checkout
// remplace la route actuelle
router.post("/create-checkout-session", requireAuth, async (req, res) => {
  try {
    const { planId, userEmail } = req.body; // userEmail optionnel (UX), NE SERT PAS À L'ID
    const userId = req.user!.id; // 🔐 source de vérité

    if (!planId) {
      return res.status(400).json({ error: "planId est requis" });
    }

    const { data: plan, error: planError } = await supabaseServer
      .from("subscription_plans")
      .select("*")
      .eq("id", planId)
      .eq("is_active", true)
      .single();

    if (planError || !plan?.stripe_price_id) {
      return res
        .status(400)
        .json({ error: "Plan invalide/inactif ou sans Stripe Price" });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "subscription",
      line_items: [{ price: plan.stripe_price_id, quantity: 1 }],
      // Email purement cosmétique (facultatif)
      customer_email: userEmail || undefined,

      // 🔑 attache toujours l'identité côté Stripe
      client_reference_id: String(userId),
      metadata: {
        user_id: String(userId),
        plan_id: String(planId),
        plan_name: plan.name,
      },
      subscription_data: {
        metadata: {
          user_id: String(userId),
          plan_id: String(planId),
          plan_name: plan.name,
        },
      },

      success_url: `${process.env.FRONTEND_URL || "https://" + req.get("host")}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL || "https://" + req.get("host")}/plans`,
    });

    return res.json({ sessionUrl: session.url });
  } catch (error) {
    console.error("❌ Erreur création session checkout:", error);
    res.status(500).json({ error: "Erreur création session de paiement" });
  }
});

// POST /api/subscriptions/handle-success - Traiter le retour de succès Stripe
// remplace intégralement le handler actuel
router.post("/handle-success", async (req, res) => {
  try {
    const { sessionId } = req.body;
    if (!sessionId)
      return res.status(400).json({ error: "Session ID manquant" });

    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["subscription", "customer"],
    });
    if (!session.subscription) {
      return res
        .status(400)
        .json({ error: "Pas d'abonnement dans la session" });
    }

    // session.subscription est déjà l'objet complet grâce à expand
    const fullSub = session.subscription as any;
    const priceObj = fullSub.items.data[0]?.price as any;
    const priceId = typeof priceObj === "string" ? priceObj : priceObj?.id;
    if (!priceId)
      return res.status(400).json({ error: "Price ID introuvable" });

    // ✅ Résolution user_id sans email
    let userId: string | null =
      (session.metadata as any)?.user_id ||
      (session.client_reference_id
        ? String(session.client_reference_id)
        : null) ||
      null;

    if (!userId) {
      const customerId =
        typeof session.customer === "string"
          ? session.customer
          : session.customer?.id;
      if (customerId) {
        const { data: found } = await supabaseServer
          .from("users")
          .select("id")
          .eq("stripe_customer_id", customerId)
          .maybeSingle();
        userId = found?.id ?? null;
      }
    }
    if (!userId) {
      return res
        .status(400)
        .json({ error: "user_id introuvable depuis la session" });
    }

    const { data: plan, error: planError } = await supabaseServer
      .from("subscription_plans")
      .select("id, name")
      .eq("stripe_price_id", priceId)
      .maybeSingle();
    if (planError || !plan) {
      console.error("❌ Plan introuvable pour price:", priceId, planError);
      return res.status(404).json({ error: "Plan introuvable" });
    }


    // ✅ update-or-insert to satisfy uniq_active_subscription_per_user
    const { data: existing, error: findErr } = await supabaseServer
      .from("subscriptions")
      .select("id, stripe_subscription_id")
      .eq("user_id", userId)
      .in("status", ["active", "trialing"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (findErr) {
      console.error("❌ DB select failed in handle-success:", findErr);
      return res.status(500).json({ error: "DB select failed" });
    }

    // Map Stripe status to our schema
    const mapStripeStatus = (stripeStatus: string): "active" | "trialing" | "pending" => {
      switch (stripeStatus) {
        case "active": return "active";
        case "trialing": return "trialing";
        default: return "pending";
      }
    };

    const payload = {
      user_id: userId,
      plan_id: plan.id,
      status: mapStripeStatus((fullSub as any).status),
      stripe_subscription_id: fullSub.id,
      current_period_start: tsToIso((fullSub as any).current_period_start),
      current_period_end: tsToIso((fullSub as any).current_period_end),
      updated_at: new Date().toISOString(),
    };

    if (existing) {
      // Idempotency: if it's already the same subscription, just refresh fields
      console.log(`🔄 UPGRADE: User ${userId} - Mise à jour abonnement existant (ID: ${existing.id})`);
      const { error: updateErr } = await supabaseServer
        .from("subscriptions")
        .update(payload)
        .eq("id", existing.id);
      if (updateErr) {
        console.error("❌ DB update failed in handle-success:", updateErr);
        return res.status(500).json({ error: "DB update failed" });
      }
    } else {
      console.log(`🆕 NOUVEAU: User ${userId} - Création premier abonnement`);
      const { error: insertErr } = await supabaseServer
        .from("subscriptions")
        .insert(payload);
      if (insertErr) {
        // ✅ IDEMPOTENCE: Vérifier si c'est une erreur de contrainte unique sur stripe_subscription_id
        if (insertErr.code === '23505' && insertErr.message?.includes('stripe_subscription_id')) {
          console.log(`♻️ IDEMPOTENCE: Détection double appel pour ${fullSub.id} - vérification...`);
          
          // Vérifier si la subscription existante est pour le même utilisateur
          const { data: existingStripeSubscription, error: stripeSubErr } = await supabaseServer
            .from("subscriptions")
            .select("id, user_id, status, plan_id")
            .eq("stripe_subscription_id", fullSub.id)
            .maybeSingle();
          
          if (stripeSubErr) {
            console.error("❌ Erreur vérification idempotence:", stripeSubErr);
            return res.status(500).json({ error: "Erreur vérification subscription" });
          }
          
          if (existingStripeSubscription && existingStripeSubscription.user_id === userId) {
            console.log(`♻️ IDEMPOTENCE: Subscription ${fullSub.id} déjà créée pour même user - succès`);
            return res.json({
              success: true,
              userId,
              subscriptionId: fullSub.id,
              planName: plan.name,
              message: "Subscription déjà traitée (appel double détecté)"
            });
          }
        }
        
        console.error("❌ DB insert failed in handle-success:", insertErr);
        return res.status(500).json({ error: "DB insert failed" });
      }
    }

    // ✅ NOUVELLE LOGIQUE : Finaliser l'onboarding professionnel après paiement réussi
    try {
      console.log(`🎯 Finalisation onboarding professionnel pour user: ${userId}`);
      
      // Mettre à jour le profil pour marquer l'onboarding comme terminé
      const { error: profileErr } = await supabaseServer
        .from("users")
        .update({
          profile_completed: true,
          onboarding_status: "completed",
        })
        .eq("id", userId);

      if (profileErr) {
        console.error("❌ Erreur finalisation profil:", profileErr);
        // Ne pas faire échouer la requête pour cette erreur, log seulement
      } else {
        console.log("✅ Onboarding professionnel finalisé avec succès");
      }
    } catch (profileError) {
      console.error("❌ Erreur lors de la finalisation de l'onboarding:", profileError);
      // Ne pas faire échouer la requête pour cette erreur
    }

    return res.json({
      success: true,
      userId,
      subscriptionId: fullSub.id,
      planName: plan.name,
    });
  } catch (error) {
    console.error("❌ Erreur handle-success:", error);
    res.status(500).json({ error: "Erreur lors du traitement succès" });
  }
});

/* --------------------------------- STATUS --------------------------------- */

// GET /api/subscriptions/status/:userId - statut simplifié pour l’UI
router.get("/status/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const sub = await getActiveSubscriptionByUserId(userId);

    const planRel = (sub as any)?.subscription_plans;
    const plan = Array.isArray(planRel) ? planRel[0] : planRel;

    const dto = {
      isActive: !!sub,
      status: sub?.status ?? "inactive",
      planId: sub?.plan_id ?? null,
      planName: plan?.name ?? "Free",
      maxListings: (plan?.max_listings ?? null) as number | null, // null = illimité
      expiresAt: sub?.current_period_end ?? null,
      cancelAtPeriodEnd: sub?.cancel_at_period_end ?? false,
    };

    res.setHeader("Cache-Control", "no-store");
    return res.json(dto);
  } catch (error) {
    console.error("❌ Erreur status:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

/* -------------------------------- CURRENT --------------------------------- */

// GET /api/subscriptions/current - Récupérer l'abonnement actuel avec détails complets du plan
router.get("/current", requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id;
    
    // Récupérer l'abonnement actif avec tous les détails du plan
    const { data: sub, error } = await supabaseServer
      .from("subscriptions")
      .select(`
        id,
        status,
        plan_id,
        cancel_at_period_end,
        current_period_end,
        stripe_subscription_id,
        subscription_plans (
          id,
          name,
          price_monthly,
          price_yearly,
          max_listings,
          features,
          stripe_product_id,
          stripe_price_id
        )
      `)
      .eq("user_id", userId)
      .in("status", ["active", "trialing"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("❌ Erreur récupération current subscription:", error);
      return res.status(500).json({ error: "Erreur serveur" });
    }

    res.setHeader("Cache-Control", "no-store");
    return res.json(sub || null);
  } catch (error) {
    console.error("❌ Erreur current:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

/* --------------------------------- CANCEL --------------------------------- */

// POST /api/subscriptions/cancel - Annuler un abonnement (facultatif)
router.post("/cancel", requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id;

    const { data: sub, error: subError } = await supabaseServer
      .from("subscriptions")
      .select("*")
      .eq("user_id", userId)
      .in("status", ["active", "trialing"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (subError || !sub) {
      return res.status(404).json({ error: "Aucun abonnement actif trouvé" });
    }

    if (sub.stripe_subscription_id) {
      await stripe.subscriptions.update(sub.stripe_subscription_id, {
        cancel_at_period_end: true,
      });
    }

    const { error: updateError } = await supabaseServer
      .from("subscriptions")
      .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
      .eq("id", sub.id);

    if (updateError) {
      console.error("❌ Erreur annulation abonnement:", updateError);
      return res.status(500).json({ error: "Erreur annulation" });
    }

    res.json({
      message: "Abonnement annulé. Actif jusqu'à la fin de la période.",
    });
  } catch (error) {
    console.error("❌ Erreur annulation:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

/* -------------------------------- MODIFY ---------------------------------- */

// POST /api/subscriptions/modify - Route unifiée pour upgrade/downgrade/cancel
router.post("/modify", requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id;
    const { action, newPlanId } = req.body as { 
      action: 'upgrade' | 'downgrade' | 'cancel'; 
      newPlanId?: number;
    };

    if (!action || !['upgrade', 'downgrade', 'cancel'].includes(action)) {
      return res.status(400).json({ error: "Action invalide. Utilisez 'upgrade', 'downgrade' ou 'cancel'" });
    }

    // 1. Récupérer l'abonnement actif
    const { data: currentSub, error: subError } = await supabaseServer
      .from("subscriptions")
      .select("*, subscription_plans(*)")
      .eq("user_id", userId)
      .in("status", ["active", "trialing"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (subError || !currentSub) {
      return res.status(404).json({ error: "Aucun abonnement actif trouvé" });
    }

    // 2. Traiter selon l'action
    if (action === 'cancel') {
      // Annulation à la fin de période
      let updatedStripeSubscription: Stripe.Subscription | null = null;
      
      if (currentSub.stripe_subscription_id) {
        // ✅ Mettre à jour Stripe et récupérer les dates de période
        updatedStripeSubscription = await stripe.subscriptions.update(currentSub.stripe_subscription_id, {
          cancel_at_period_end: true,
        });
      }

      // ✅ Persister les dates de période depuis Stripe dans notre DB
      const updatePayload: any = { 
        cancel_at_period_end: true,
        updated_at: new Date().toISOString()
      };

      if (updatedStripeSubscription) {
        updatePayload.current_period_start = tsToIso(updatedStripeSubscription.current_period_start);
        updatePayload.current_period_end = tsToIso(updatedStripeSubscription.current_period_end);
        console.log('🐞 DEBUG - Dates récupérées depuis Stripe:');
        console.log('  current_period_start (timestamp):', updatedStripeSubscription.current_period_start);
        console.log('  current_period_end (timestamp):', updatedStripeSubscription.current_period_end);
        console.log('  current_period_start (ISO):', updatePayload.current_period_start);
        console.log('  current_period_end (ISO):', updatePayload.current_period_end);
      } else {
        console.log('⚠️ WARN - updatedStripeSubscription est null, pas de dates à sauvegarder');
      }

      await supabaseServer
        .from("subscriptions")
        .update(updatePayload)
        .eq("id", currentSub.id);

      // Enregistrer dans l'historique
      await supabaseServer.from("subscription_history").insert({
        user_id: userId,
        action_type: "cancelled",
        old_plan_id: currentSub.plan_id,
        old_stripe_subscription_id: currentSub.stripe_subscription_id,
        metadata: { cancelled_at_period_end: true }
      });

      return res.json({
        success: true,
        message: "Abonnement annulé. Actif jusqu'à la fin de la période.",
        currentPeriodEnd: updatePayload.current_period_end || currentSub.current_period_end
      });
    }

    // Pour upgrade/downgrade, on a besoin du nouveau plan
    if (!newPlanId) {
      return res.status(400).json({ error: "newPlanId requis pour upgrade/downgrade" });
    }

    // 3. Récupérer le nouveau plan
    const { data: newPlan, error: planError } = await supabaseServer
      .from("subscription_plans")
      .select("*")
      .eq("id", newPlanId)
      .eq("is_active", true)
      .single();

    if (planError || !newPlan?.stripe_price_id) {
      return res.status(400).json({ error: "Plan invalide ou inactif" });
    }

    // Vérifier que ce n'est pas le même plan
    if (currentSub.plan_id === newPlanId) {
      return res.status(400).json({ error: "Vous êtes déjà sur ce plan" });
    }

    // 4. Modifier l'abonnement Stripe avec proration
    if (!currentSub.stripe_subscription_id) {
      return res.status(400).json({ error: "Pas de stripe_subscription_id" });
    }

    const stripeSubscription = await stripe.subscriptions.retrieve(currentSub.stripe_subscription_id);
    
    // Guard : vérifier qu'il y a au moins un item
    if (!stripeSubscription.items.data[0]) {
      return res.status(400).json({ error: "Abonnement Stripe invalide (aucun item)" });
    }

    const updatedSubscription = await stripe.subscriptions.update(currentSub.stripe_subscription_id, {
      items: [{
        id: stripeSubscription.items.data[0].id,
        price: newPlan.stripe_price_id,
      }],
      cancel_at_period_end: false, // ✅ Clear toute annulation programmée
      proration_behavior: 'create_prorations', // Calcul prorata automatique
      billing_cycle_anchor: 'unchanged', // Garde la même date de facturation
    }) as Stripe.Subscription;

    // 5. Mettre à jour dans la DB (clear cancel_at_period_end aussi)
    await supabaseServer
      .from("subscriptions")
      .update({
        plan_id: newPlanId,
        cancel_at_period_end: false, // ✅ Clear toute annulation programmée en DB
        updated_at: new Date().toISOString()
      })
      .eq("id", currentSub.id);

    // 6. Enregistrer dans l'historique
    const currentPlan = Array.isArray(currentSub.subscription_plans) 
      ? currentSub.subscription_plans[0] 
      : currentSub.subscription_plans;

    await supabaseServer.from("subscription_history").insert({
      user_id: userId,
      action_type: action,
      old_plan_id: currentSub.plan_id,
      new_plan_id: newPlanId,
      old_stripe_subscription_id: currentSub.stripe_subscription_id,
      new_stripe_subscription_id: updatedSubscription.id,
      metadata: {
        old_plan_name: currentPlan?.name,
        new_plan_name: newPlan.name,
        proration_applied: true
      }
    });

    const nextBillingTimestamp = (updatedSubscription as any).current_period_end as number | undefined;
    
    return res.json({
      success: true,
      message: `Abonnement modifié de ${currentPlan?.name} vers ${newPlan.name}`,
      newPlan: {
        id: newPlan.id,
        name: newPlan.name,
        priceMonthly: newPlan.price_monthly
      },
      nextBillingDate: tsToIso(nextBillingTimestamp)
    });

  } catch (error) {
    console.error("❌ Erreur modification abonnement:", error);
    res.status(500).json({ error: "Erreur lors de la modification de l'abonnement" });
  }
});

/* -------------------------------- WEBHOOK --------------------------------- */

// Webhook Stripe (requiert raw body dans Express)
router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const sig = req.headers["stripe-signature"] as string;
    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET!,
      );
    } catch (err: any) {
      console.error("❌ Webhook signature verification failed:", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Idempotency
    const { data: processed } = await supabaseServer
      .from("stripe_events_processed")
      .select("id")
      .eq("stripe_event_id", event.id)
      .maybeSingle();
    if (processed)
      return res.json({ received: true, message: "Already processed" });

    try {
      switch (event.type) {
        case "customer.subscription.created":
        case "customer.subscription.updated": {
          const s = event.data.object as any;
          const stripeSubId = s.id;

          // Compléter statut + dates
          const updates: any = {
            status:
              s.status === "active"
                ? "active"
                : s.status === "trialing"
                  ? "trialing"
                  : "pending",
            current_period_start: tsToIso(s.current_period_start),
            current_period_end: tsToIso(s.current_period_end),
            cancel_at_period_end: !!s.cancel_at_period_end,
            updated_at: new Date().toISOString(),
          };

          // Sécuriser user_id si manquant
          const { data: row } = await supabaseServer
            .from("subscriptions")
            .select("id, user_id")
            .eq("stripe_subscription_id", stripeSubId)
            .maybeSingle();

          if (!row?.user_id) {
            // 1) metadata userId
            if (s.metadata?.userId) {
              updates.user_id = s.metadata.userId;
            } else {
              // 2) fallback customer -> email -> users.id
              try {
                const customer = await stripe.customers.retrieve(
                  s.customer as string,
                );
                const email = (customer as any)?.email;
                if (email) {
                  const { data: u } = await supabaseServer
                    .from("users")
                    .select("id")
                    .eq("email", email)
                    .maybeSingle();
                  if (u?.id) updates.user_id = u.id;
                }
              } catch (e) {
                console.warn(
                  "⚠️ Webhook: unable to resolve user_id from customer",
                  e,
                );
              }
            }
          }

          // (optionnel) plan_id via price
          const priceId = s.items?.data?.[0]?.price?.id;
          if (priceId) {
            const planId = await mapPriceToPlanId(priceId);
            if (planId) updates.plan_id = planId;
          }

          await supabaseServer
            .from("subscriptions")
            .update(updates)
            .eq("stripe_subscription_id", stripeSubId);

          break;
        }

        case "customer.subscription.deleted": {
          const s = event.data.object as any;
          await supabaseServer
            .from("subscriptions")
            .update({
              status: "expired",
              cancelled_at: new Date().toISOString(),
            })
            .eq("stripe_subscription_id", s.id);
          break;
        }

        case "invoice.payment_succeeded": {
          const inv = event.data.object as any;
          console.log(
            "✅ Payment succeeded for subscription:",
            inv.subscription,
          );
          break;
        }

        case "invoice.payment_failed": {
          const inv = event.data.object as any;
          console.log("❌ Payment failed for subscription:", inv.subscription);
          break;
        }
      }

      await supabaseServer.from("stripe_events_processed").insert({
        stripe_event_id: event.id,
        processed_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error("❌ Erreur traitement webhook:", error);
      return res.status(500).json({ error: "Webhook processing error" });
    }

    res.json({ received: true });
  },
);

export { router as subscriptionsRouter };
