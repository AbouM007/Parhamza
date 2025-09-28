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

    const fullSub = await stripe.subscriptions.retrieve(
      session.subscription as string,
    );
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

    // ✅ upsert strict, on STOPPE en cas d’erreur
    const { error: upsertErr } = await supabaseServer
      .from("subscriptions")
      .upsert(
        {
          user_id: userId,
          plan_id: plan.id,
          status: "active", // le webhook affinera ensuite
          stripe_subscription_id: fullSub.id,
          stripe_customer_id:
            typeof session.customer === "string"
              ? session.customer
              : session.customer?.id,
          // Ligne 207-208, remplacer par :
          current_period_start: tsToIso((fullSub as any).current_period_start),
          current_period_end: tsToIso((fullSub as any).current_period_end),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "stripe_subscription_id" },
      );

    if (upsertErr) {
      console.error("❌ DB upsert failed in handle-success:", upsertErr);
      return res.status(500).json({ error: "DB insert failed" });
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

// GET /api/subscriptions/current - Récupérer l'abonnement actuel (user_id)
router.get("/current", requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id;
    const sub = await getActiveSubscriptionByUserId(userId);
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
