# Todo

**A faire**  
- Systeme de mailing et notifications
- Ajouter OTP Tél Whatsapp post creation compte 

========================================================
## Prochaine tâche ##
# Emailing et notification push  #


Voici une analyse claire + une proposition optimisée 👇

⚖️ Analyse de la réponse de ton agent
✅ Les bons points

Il a bien capté les 3 couches nécessaires :
🔹 Envoi d’emails
🔹 Notifications internes (in-app)
🔹 Logique d’événements déclencheurs

L’idée d’un EmailService central et d’un NotificationService est excellente.

La séparation front/back + les “cron jobs” pour les campagnes et résumés = très propre.

⚠️ Les points à ajuster selon ton besoin réel

Resend est top (moderne, simple), mais pas indispensable si tu as déjà un SMTP professionnel + Supabase + éventuellement Brevo.
👉 Tu peux très bien démarrer avec Nodemailer ou Brevo, puis brancher Resend plus tard sans rien casser.

Table “email_queue” + retry automatique : bonne idée si tu veux une haute fiabilité,
mais trop complexe à ce stade si tu veux juste que “ça marche vite et bien”.
👉 On peut commencer par un simple email_logs avec statut envoyé/échoué, et ajouter une file plus tard.

Centre de notifications in-app + mobile :

Son approche Supabase + useNotifications en temps réel est parfaite pour la version web.

Et bonne nouvelle : Supabase Realtime fonctionne aussi sous React Native.
👉 Donc ta future app mobile pourra réutiliser exactement la même logique et base sans aucune refonte.

🧠 Ma recommandation stratégique (équilibrée et scalable)
1. 📬 Service Email minimaliste mais solide

Démarre avec Brevo ou Nodemailer (connecté à ton domaine @passionauto2roues.com)

Crée un micro-service Node emailService.ts avec cette interface :

sendEmail({
  to,
  type,  // exemple: "welcome", "reset_password", "listing_validated"
  params // data à injecter dans le template
})


Les templates HTML (comme ceux qu’on a faits) sont stockés dans /emails/templates/ et tu injectes les variables.

➡️ Ça t’évite toute dépendance forte à un provider (tu peux changer Brevo → Resend plus tard sans rien casser).

2. 🔔 Table notifications universelle (pour web + mobile)
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  type TEXT,              -- ex: "new_message", "listing_favorited"
  title TEXT,
  message TEXT,
  link TEXT,              -- lien cliquable ou redirection interne
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);


Chaque notification :

est stockée ici

peut être affichée en temps réel dans le web app (via Supabase Realtime)

sera accessible via une simple API REST pour ton futur app mobile.

3. ⚙️ NotificationService

Service backend central (ex: notificationService.ts) :

import { sendEmail } from './emailService';
import { supabase } from './supabaseClient';

export async function createNotification({ userId, type, title, message, link, sendEmailToo = true }) {
  // 1. Crée la notif en DB
  await supabase.from('notifications').insert([{ user_id: userId, type, title, message, link }]);

  // 2. Envoi d'email (optionnel selon type)
  if (sendEmailToo) {
    await sendEmail({
      to: await getUserEmail(userId),
      type,
      params: { title, message, link }
    });
  }
}


✅ Avantages :

Un seul point d’entrée pour toutes les notifications

Tu peux facilement ajouter des règles (par ex : “ne pas envoyer d’email si déjà lu”)

Le jour où tu ajoutes les push notifications (FCM) pour React Native,
tu appelles juste sendPushNotification(userId, title, message) dans ce même service.

4. 📱 Côté frontend (web + mobile futur)

Web → useRealtimeNotifications() (via Supabase channel)

Mobile → même principe (Supabase JS SDK RN + table notifications)

Tous deux se connectent à la même table en temps réel

5. 🧱 Architecture globale simple et réutilisable
backend/
 ├─ emailService.ts        # gère l'envoi réel des emails (Brevo/Nodemailer)
 ├─ notificationService.ts # gère la logique métier des notifications
 ├─ templates/             # emails HTML
 ├─ cron/                  # relances / résumés hebdo
 └─ db/notifications.sql   # création table

💡 En résumé
Élément	Solution recommandée
Envoi d’emails	Brevo ou Nodemailer (→ Resend plus tard si besoin)
Stockage notifications	Table notifications (Supabase)
Temps réel web & mobile	Supabase Realtime
Architecture	notificationService + emailService
Futur mobile	100 % compatible (React Native + Supabase)


📧 Déclenchement des emails - 3 méthodes
1. Déclenchement automatique lors d'événements
Les emails seront envoyés automatiquement après certaines actions :

// Exemple : Après création d'annonce
app.post("/api/annonces", async (req, res) => {
  // 1. Créer l'annonce en base
  const newAnnonce = await storage.createAnnonce(req.body);

  // 2. Déclencher notification + email
  await notificationService.createNotification({
    userId: req.body.userId,
    type: "listing_created",
    title: "Annonce créée avec succès",
    message: "Votre annonce est en attente de validation",
    sendEmail: true  // ← Email envoyé automatiquement
  });

  res.json(newAnnonce);
});
2. Webhooks (pour Stripe)
// Webhook Stripe déclenche emails de paiement
app.post("/api/webhooks/stripe", async (req, res) => {
  const event = req.body;

  if (event.type === "payment_intent.succeeded") {
    await notificationService.createNotification({
      userId: getUser(event),
      type: "payment_success",
      title: "Paiement confirmé",
      sendEmail: true  // ← Email de confirmation
    });
  }
});
3. Tâches planifiées (Cron jobs)
// Tous les lundis à 9h → résumé hebdomadaire
cron.schedule("0 9 * * 1", async () => {
  const users = await getActiveUsers();

  for (const user of users) {
    const stats = await getWeeklyStats(user.id);
    await emailService.sendEmail({
      to: user.email,
      type: "weekly_summary",
      params: { stats }
    });
  }
});
📮 Nodemailer + Templates - OUI, c'est parfait !
Nodemailer est idéal pour votre cas :

✅ Gratuit et open source
✅ Fonctionne avec n'importe quel SMTP
✅ Support complet des templates HTML
✅ Pas de limite d'envoi (dépend de votre SMTP)
Architecture avec Nodemailer + Templates
// server/services/emailService.ts
import nodemailer from "nodemailer";
import fs from "fs";
import path from "path";
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com", // ou Brevo, OVH, etc.
  port: 587,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});
export async function sendEmail({ to, type, params }) {
  // 1. Charger le template HTML
  const templatePath = path.join(__dirname, `../templates/${type}.html`);
  let html = fs.readFileSync(templatePath, "utf-8");

  // 2. Injecter les variables dynamiques
  Object.keys(params).forEach(key => {
    html = html.replace(`{{${key}}}`, params[key]);
  });

  // 3. Envoyer l'email
  await transporter.sendMail({
    from: '"PassionAuto2Roues" <noreply@passionauto2roues.com>',
    to,
    subject: getSubject(type),
    html
  });

  // 4. Logger l'envoi
  await logEmail(to, type, "sent");
}
Exemple de template HTML
<!-- server/templates/listing_validated.html -->
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #067D92; color: white; padding: 20px; }
    .button { 
      background: #067D92; 
      color: white; 
      padding: 12px 24px; 
      text-decoration: none; 
      border-radius: 6px;
      display: inline-block;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✅ Annonce validée !</h1>
    </div>

    <div style="padding: 20px;">
      <p>Bonjour {{userName}},</p>

      <p>Bonne nouvelle ! Votre annonce <strong>{{listingTitle}}</strong> est maintenant en ligne.</p>

      <p style="text-align: center; margin: 30px 0;">
        <a href="{{listingUrl}}" class="button">
          Voir mon annonce
        </a>
      </p>

      <p>Votre annonce est visible par tous les utilisateurs de PassionAuto2Roues.</p>
    </div>

    <div style="background: #f5f5f5; padding: 15px; text-align: center;">
      <small>PassionAuto2Roues - Marketplace automobile</small>
    </div>
  </div>
</body>
</html>
Utilisation dans le code
// Après validation admin de l'annonce
await notificationService.createNotification({
  userId: annonce.userId,
  type: "listing_validated",
  title: "Annonce validée",
  message: `Votre annonce ${annonce.title} est en ligne`,
  link: `/listing/${annonce.id}`,
  sendEmail: true,
  emailParams: {  // ← Variables injectées dans le template
    userName: user.name,
    listingTitle: annonce.title,
    listingUrl: `https://passionauto2roues.com/listing/${annonce.id}`
  }
});
🎯 Résumé de l'approche
Aspect	Solution
Service email	Nodemailer (SMTP Gmail/Brevo/OVH)
Templates	Fichiers HTML dans /server/templates/
Variables dynamiques	Injection {{variable}}
Déclencheurs	Events backend + Webhooks + Cron
Logs	Table email_logs simple
Mobile	Même système (API REST)
💡 Avantages de cette approche
✅ Simple → Pas de dépendance externe coûteuse
✅ Flexible → Change de SMTP quand tu veux
✅ Maintenable → Templates HTML séparés du code
✅ Scalable → Ajouter des templates = créer des fichiers HTML
✅ Mobile-ready → Fonctionne avec React Native sans modification