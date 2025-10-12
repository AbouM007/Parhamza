# Système de Notifications et Emails - PassionAuto2Roues

## 📋 Vue d'ensemble

PassionAuto2Roues dispose d'un système de notifications multi-canal complet et production-ready :
- **16 types de notifications** couvrant tous les événements métier
- **Notifications in-app** stockées dans la base de données Supabase
- **Notifications email** via Nodemailer avec SMTP professionnel
- **Architecture non-bloquante** : les échecs d'email n'impactent pas les opérations métier
- **Templates HTML responsives** avec design cohérent (#067D92)

---

## 🔔 Les 16 Types de Notifications

### 1. **Account - Compte utilisateur** (2 types)

#### `welcome`
- **Déclencheur** : Inscription d'un nouvel utilisateur
- **Localisation** : `server/routes.ts` (handler `POST /api/auth/register`)
- **Variables** : `userName`, `dashboardLink`
- **Template** : `server/templates/account/welcome.html`

#### `pro_account_activated`
- **Déclencheur** : Validation manuelle d'un compte professionnel par l'admin
- **Localisation** : `server/routes.ts` (handler `PUT /api/users/:id/verify-professional`)
- **Variables** : `userName`, `dashboardLink`
- **Template** : `server/templates/account/pro_account_activated.html`

---

### 2. **Listings - Annonces** (4 types)

#### `listing_validated`
- **Déclencheur** : Validation d'une annonce par l'admin
- **Localisation** : `server/routes.ts` (handler `PUT /api/listings/:id/validate`)
- **Variables** : `listingTitle`, `listingUrl`
- **Template** : `server/templates/listings/listing_validated.html`

#### `listing_rejected`
- **Déclencheur** : Rejet d'une annonce par l'admin
- **Localisation** : `server/routes.ts` (handler `PUT /api/listings/:id/reject`)
- **Variables** : `listingTitle`, `reason`
- **Template** : `server/templates/listings/listing_rejected.html`

#### `listing_favorited`
- **Déclencheur** : Ajout d'une annonce aux favoris
- **Localisation** : `server/routes.ts` (handler `POST /api/favorites`)
- **Variables** : `listingTitle`, `userName`, `listingUrl`
- **Template** : `server/templates/listings/listing_favorited.html`

#### `listing_expiring`
- **Déclencheur** : ⚠️ Rappel avant expiration d'annonce (nécessite cron/scheduled job)
- **Statut** : Type défini, implémentation à venir
- **Variables** : `listingTitle`, `daysLeft`
- **Template** : À créer

---

### 3. **Messages** (2 types)

#### `new_message`
- **Déclencheur** : Réception d'un nouveau message
- **Localisation** : `server/routes.ts` (handler `POST /api/messages`)
- **Variables** : `senderName`, `messagePreview`, `conversationUrl`
- **Template** : `server/templates/messaging/new_message.html`

#### `message_reply`
- **Déclencheur** : Réponse à un message existant
- **Localisation** : `server/routes.ts` (handler `POST /api/messages`)
- **Variables** : `senderName`, `messagePreview`, `conversationUrl`
- **Template** : `server/templates/messaging/message_reply.html`

---

### 4. **Payments - Paiements** (2 types)

#### `payment_success`
- **Déclencheur** : Paiement réussi (boost, abonnement initial)
- **Localisation** : 
  - Boost : `server/routes.ts` (handler `POST /api/boost-payment`)
  - Abonnement initial : `server/routes/subscriptions.ts` (webhook `invoice.payment_succeeded` + `billing_reason !== 'subscription_cycle'`)
- **Variables** : `amount`, `type`, `transactionId`
- **Template** : `server/templates/payments/payment_success.html`

#### `payment_failed`
- **Déclencheur** : Échec de paiement (webhook Stripe)
- **Localisation** : `server/routes/subscriptions.ts` (webhook `invoice.payment_failed`)
- **Variables** : `reason`
- **Template** : `server/templates/payments/payment_failed.html`

---

### 5. **Followers - Suivis** (2 types)

#### `new_follower`
- **Déclencheur** : Nouveau follower pour un vendeur pro
- **Localisation** : `server/routes.ts` (handler `POST /api/followers`)
- **Variables** : `followerName`, `followerProfileUrl`
- **Template** : `server/templates/followers/new_follower.html`

#### `followed_new_listing`
- **Déclencheur** : Nouvelle annonce d'un vendeur suivi
- **Localisation** : `server/routes.ts` (handler `POST /api/listings` - notifie les followers)
- **Variables** : `sellerName`, `listingTitle`, `listingUrl`
- **Template** : `server/templates/followers/followed_new_listing.html`

---

### 6. **Subscriptions - Abonnements** (4 types)

#### `subscription_renewed`
- **Déclencheur** : Renouvellement automatique d'abonnement (webhook Stripe)
- **Localisation** : `server/routes/subscriptions.ts` (webhook `invoice.payment_succeeded` + `billing_reason === 'subscription_cycle'`)
- **Variables** : `planName`, `amount`, `nextBillingDate`
- **Template** : `server/templates/subscriptions/subscription_renewed.html`

#### `subscription_cancelled`
- **Déclencheur** : Annulation d'abonnement par l'utilisateur
- **Localisation** : `server/routes/subscriptions.ts` (handler `POST /api/subscriptions/modify` avec `action: 'cancel'`)
- **Variables** : `planName`, `endDate`
- **Template** : `server/templates/subscriptions/subscription_cancelled.html`

#### `subscription_downgraded`
- **Déclencheur** : Downgrade vers un plan inférieur
- **Localisation** : `server/routes/subscriptions.ts` (handler `POST /api/subscriptions/modify` avec `action: 'downgrade'`)
- **Variables** : `oldPlan`, `newPlan`, `effectiveDate`
- **Template** : `server/templates/subscriptions/subscription_downgraded.html`

#### `subscription_ending`
- **Déclencheur** : ⚠️ Rappel avant expiration (nécessite cron/scheduled job)
- **Statut** : Template prêt, déclencheur à implémenter
- **Variables** : `planName`, `expirationDate`, `renewLink`
- **Template** : `server/templates/subscriptions/subscription_ending.html`

---

## 📧 Architecture Email

### Structure des Templates

Tous les templates HTML suivent la même structure professionnelle :

```
┌─────────────────────────────┐
│  🏢 Logo PassionAuto2Roues  │  ← Header avec logo
├─────────────────────────────┤
│                             │
│  📝 Titre principal         │  ← Titre de notification
│                             │
│  Contenu personnalisé       │  ← Variables dynamiques
│  avec variables             │
│                             │
│  🔗 [Bouton CTA]            │  ← Call-to-Action
│                             │
├─────────────────────────────┤
│  📍 Footer                  │  ← Liens utiles
│  Mon profil | Aide          │
└─────────────────────────────┘
```

### Style cohérent
- **Couleur principale** : #067D92 (bleu turquoise)
- **Logo** : Affiché en en-tête de chaque email
- **Responsive** : Compatible mobile (80% des ouvertures)
- **Tables HTML** : Compatibilité maximale (Gmail, Outlook, etc.)

### Organisation des fichiers

```
server/templates/
├── account/
│   ├── welcome.html
│   └── pro_account_activated.html
├── listings/
│   ├── listing_validated.html
│   ├── listing_rejected.html
│   └── listing_favorited.html
├── messaging/
│   ├── new_message.html
│   └── message_reply.html
├── payments/
│   ├── payment_success.html
│   └── payment_failed.html
├── followers/
│   ├── new_follower.html
│   └── followed_new_listing.html
└── subscriptions/
    ├── subscription_renewed.html
    ├── subscription_cancelled.html
    ├── subscription_downgraded.html
    └── subscription_ending.html
```

---

## ⚙️ Configuration SMTP

### Variables d'environnement (Secrets Replit)

```env
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=noreply@passionauto2roues.com
SMTP_PASSWORD=********
SMTP_FROM_EMAIL=noreply@passionauto2roues.com
SMTP_FROM_NAME=PassionAuto2Roues
```

### Service Nodemailer

Fichier : `server/services/emailService.ts`

**Fonctionnalités** :
- ✅ Chargement dynamique des templates HTML
- ✅ Remplacement des variables (ex: `{{userName}}`)
- ✅ Gestion d'erreurs gracieuse (non-bloquante)
- ✅ Logs détaillés pour monitoring
- ✅ Support TLS/STARTTLS

---

## 🔄 Flux de Notification

### 1. Déclenchement
```typescript
// Exemple : Validation d'annonce
await notifyListingValidated({
  userId: listing.user_id,
  listingTitle: listing.title,
  listingUrl: `${frontendUrl}/listing/${listing.id}`
});
```

### 2. Création notification in-app
```typescript
// Dans notificationCenter.ts
await supabaseServer.from('notifications').insert({
  user_id: userId,
  type: 'listing_validated',
  title: 'Annonce validée',
  message: `Votre annonce "${listingTitle}" est maintenant en ligne`,
  data: { listingUrl }
});
```

### 3. Envoi email (parallèle)
```typescript
// Non-bloquant
try {
  await sendEmail({
    to: userEmail,
    subject: 'Votre annonce est validée 🎉',
    templateName: 'listing_validated',
    variables: { listingTitle, listingUrl }
  });
} catch (error) {
  console.error('Email failed but notification created:', error);
  // L'opération métier continue normalement
}
```

---

## 🛡️ Gestion des Erreurs

### Stratégie Non-Bloquante

**Principe** : Les échecs d'email ne doivent jamais bloquer les opérations métier.

```typescript
// ✅ Bon pattern (utilisé partout)
try {
  await notifyListingValidated({ ... });
  console.log("📧 Email envoyé avec succès");
} catch (emailError) {
  console.error("❌ Erreur email (non-bloquante):", emailError);
  // L'opération continue normalement
}
```

### Logs de débogage

```
✅ Email envoyé avec succès: listing_validated to user@example.com
❌ Erreur email (non-bloquante): SMTP timeout
📧 Email renouvellement abonnement envoyé
```

---

## 📊 Mapping des Templates

Fichier : `server/services/emailService.ts`

```typescript
const EMAIL_TEMPLATE_MAP = {
  // Account
  welcome: 'account/welcome.html',
  pro_account_activated: 'account/pro_account_activated.html',
  
  // Listings
  listing_validated: 'listings/listing_validated.html',
  listing_rejected: 'listings/listing_rejected.html',
  listing_favorited: 'listings/listing_favorited.html',
  // listing_expiring: à créer
  
  // Messages
  new_message: 'messaging/new_message.html',
  message_reply: 'messaging/message_reply.html',
  
  // Payments
  payment_success: 'payments/payment_success.html',
  payment_failed: 'payments/payment_failed.html',
  
  // Followers
  new_follower: 'followers/new_follower.html',
  followed_new_listing: 'followers/followed_new_listing.html',
  
  // Subscriptions
  subscription_renewed: 'subscriptions/subscription_renewed.html',
  subscription_cancelled: 'subscriptions/subscription_cancelled.html',
  subscription_downgraded: 'subscriptions/subscription_downgraded.html',
  subscription_ending: 'subscriptions/subscription_ending.html',
};
```

---

## 🎯 Points Clés pour la Production

### ✅ Déjà implémenté

1. **15 types de notifications** couvrant tous les cas d'usage
2. **Templates HTML responsives** avec design cohérent
3. **SMTP professionnel** via Nodemailer (pas de service tiers)
4. **Architecture non-bloquante** : 100% fiable
5. **Logs détaillés** pour monitoring et debugging
6. **Variables sécurisées** via Replit Secrets

### ⚠️ À implémenter (optionnel)

1. **Cron job** pour `subscription_ending` (rappels d'expiration)
2. **Web Push notifications** (Phase 2)
3. **Composants réutilisables** (migration vers Handlebars)
4. **Internationalisation** (FR/EN)
5. **Analytics email** (taux d'ouverture, clics)

---

## 🔗 Fichiers Clés

| Fichier | Rôle |
|---------|------|
| `shared/notificationTypes.ts` | Définition des 16 types + metadata |
| `server/services/notificationCenter.ts` | Fonctions `notify*()` pour chaque type implémenté |
| `server/services/emailService.ts` | Service Nodemailer + gestion templates |
| `server/routes.ts` | Déclencheurs account, listings, messages, followers |
| `server/routes/subscriptions.ts` | Déclencheurs paiements et abonnements |
| `server/templates/` | 14 templates HTML organisés par catégorie |

---

## 📈 Statistiques

- **16 types de notifications** définis (14 implémentés + 2 en attente)
  - ✅ 14 types avec templates HTML et déclencheurs actifs
  - ⚠️ 2 types définis mais nécessitent cron job (`listing_expiring`, `subscription_ending`)
- **14 templates HTML** (design cohérent et responsive)
- **8 fichiers sources** (architecture modulaire)
- **100% non-bloquant** (aucun impact sur UX)
- **Production-ready** pour les 14 types actifs ✅

---

## 🚀 Prochaines Évolutions

### Phase 2 (V1.5)
- [ ] Web Push notifications (Service Worker)
- [ ] Migration vers Handlebars (composants réutilisables)
- [ ] Cron job pour rappels d'expiration
- [ ] Analytics email avancées

### Phase 3 (Mobile)
- [ ] Push notifications natives (FCM/OneSignal)
- [ ] Actions rapides dans notifications
- [ ] Internationalisation complète
- [ ] Tests A/B sur emails

---

**Dernière mise à jour** : Octobre 2025  
**Statut** : ✅ Production-ready
