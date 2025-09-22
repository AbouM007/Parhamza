import { Router } from "express";
import { supabaseServer } from "../supabase";
import { requireAuth } from "../middleware/auth";

const router = Router();

/**
 * 🔹 Mettre à jour le profil utilisateur (table users uniquement)
 */
router.put("/update/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const {
      name,
      phone,
      whatsapp,
      postalCode,
      city,
      type,
      contactPreferences,
      address,
      website,
      company_logo,
      specialties,
      profileCompleted,
      companyName, // <- maintenant utilisé uniquement pour professional_accounts
      siret, // <- idem
    } = req.body;

    // 🔹 Mise à jour table users
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;
    if (whatsapp !== undefined) updateData.whatsapp = whatsapp;
    if (postalCode !== undefined) updateData.postal_code = postalCode || null;
    if (city !== undefined) updateData.city = city;
    if (type !== undefined) updateData.type = type;
    if (contactPreferences !== undefined)
      updateData.contact_preferences = contactPreferences;
    if (address !== undefined) updateData.address = address;
    if (website !== undefined) updateData.website = website;
    if (company_logo !== undefined) updateData.company_logo = company_logo;
    if (specialties !== undefined) updateData.specialties = specialties;
    if (profileCompleted !== undefined)
      updateData.profile_completed = profileCompleted;

    const { data, error } = await supabaseServer
      .from("users")
      .update(updateData)
      .eq("id", userId)
      .select()
      .single();

    if (error) {
      console.error("❌ Erreur mise à jour users:", error);
      return res.status(500).json({ error: "Erreur mise à jour users" });
    }

    // 🔹 Si pro → mettre à jour professional_accounts
    if (type === "professional") {
      const { error: proError } = await supabaseServer
        .from("professional_accounts")
        .update({
          company_name: companyName || null,
          siret: siret || null,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId);

      if (proError) {
        console.error("❌ Erreur mise à jour professional_accounts:", proError);
        return res
          .status(500)
          .json({ error: "Erreur mise à jour professional_accounts" });
      }
    }

    res.json(data);
  } catch (error) {
    console.error("❌ Erreur serveur update profil:", error);
    res.status(500).json({ error: "Erreur serveur update profil" });
  }
});

/**
 * 🔹 Obtenir le profil complet d'un utilisateur (users + professional_accounts)
 */
router.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const { data, error } = await supabaseServer
      .from("users")
      .select(
        `
        id,
        email,
        name,
        phone,
        whatsapp,
        postal_code,
        city,
        address,
        website,
        type,
        profile_completed,
        professional_accounts (
          company_name,
          siret
        )
      `,
      )
      .eq("id", userId)
      .maybeSingle(); // 🔑 pour éviter les erreurs si pas encore de ligne pro

    if (error) {
      console.error("❌ Erreur récupération profil users:", error);
      return res.status(500).json({ error: "Erreur récupération profil" });
    }

    // Aplatir les champs pro pour le front
    const enrichedData = {
      ...data,
      company_name: (data as any)?.professional_accounts?.company_name || null,
      siret: (data as any)?.professional_accounts?.siret || null,
    };

    delete enrichedData.professional_accounts;

    res.set("Cache-Control", "no-cache");
    res.json(enrichedData);
  } catch (error) {
    console.error("❌ Erreur serveur récupération profil:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

/**
 * 🔹 Finaliser l'onboarding utilisateur
 */
router.post("/complete", requireAuth, async (req: any, res) => {
  try {
    const userId = req.user.id;
    console.log("🔧 Finalisation profil pour user:", userId);

    const {
      name,
      phone,
      whatsapp,
      postalCode,
      city,
      type,
      address,
      website,
      companyName,
      siret,
      professionalPhone,
      specialties,
    } = req.body;

    // Construire l'objet de mise à jour (table users)
    const updateData: any = {
      profile_completed: true,
    };

    if (name !== undefined) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;
    if (whatsapp !== undefined) updateData.whatsapp = whatsapp;
    if (postalCode !== undefined) updateData.postal_code = postalCode || null;
    if (city !== undefined) updateData.city = city;
    if (type !== undefined) updateData.type = type;
    if (address !== undefined) updateData.address = address;
    if (website !== undefined) updateData.website = website;
    if (specialties !== undefined) updateData.specialties = specialties;

    const { data, error } = await supabaseServer
      .from("users")
      .update(updateData)
      .eq("id", userId)
      .select()
      .single();

    if (error) {
      console.error("❌ Erreur finalisation profil:", error);
      return res.status(500).json({ error: "Erreur finalisation profil" });
    }

    console.log("✅ Profil utilisateur finalisé pour:", data.email);

    // 🔹 Si pro → créer ou mettre à jour professional_accounts
    if (type === "professional") {
      console.log("🏢 Création/mise à jour compte professionnel...");

      const { data: existingProAccount } = await supabaseServer
        .from("professional_accounts")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();

      const professionalData: any = {
        user_id: userId,
        company_name: companyName || "",
        siret: siret || "",
        phone: professionalPhone || phone || "",
        email: data.email,
        updated_at: new Date().toISOString(),
      };

      if (existingProAccount) {
        const { error: proError } = await supabaseServer
          .from("professional_accounts")
          .update(professionalData)
          .eq("user_id", userId);
        if (proError) {
          console.error(
            "❌ Erreur mise à jour compte professionnel:",
            proError,
          );
        } else {
          console.log("✅ Compte professionnel mis à jour");
        }
      } else {
        professionalData.created_at = new Date().toISOString();
        const { error: proError } = await supabaseServer
          .from("professional_accounts")
          .insert(professionalData);
        if (proError) {
          console.error("❌ Erreur création compte professionnel:", proError);
        } else {
          console.log("✅ Compte professionnel créé");
        }
      }
    }

    res.json({ success: true, user: data });
  } catch (error) {
    console.error("❌ Erreur serveur finalisation profil:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

export default router;
