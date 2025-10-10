# 📧 Spécifications Techniques - Système d'Emailing et Notifications

> **Document de spécifications détaillées pour l'implémentation du système de notifications temps réel et d'emailing pour PassionAuto2Roues**
> 
> **Version :** 1.0  
> **Date :** Octobre 2025  
> **Destinataire :** Développeur externe  
> **Prérequis :** Connaissance Node.js, TypeScript, React, Supabase

---

## 📋 Table des matières

1. [Vue d'ensemble](#1-vue-densemble)
2. [Architecture technique](#2-architecture-technique)
3. [Schémas de base de données](#3-schémas-de-base-de-données)
4. [Configuration environnement](#4-configuration-environnement)
5. [Liste exhaustive des emails](#5-liste-exhaustive-des-emails)
6. [Types et constantes TypeScript](#6-types-et-constantes-typescript)
7. [Services Backend](#7-services-backend)
8. [Frontend - Notifications in-app](#8-frontend---notifications-in-app)
9. [Déclencheurs et intégrations](#9-déclencheurs-et-intégrations)
10. [Règles anti-spam](#10-règles-anti-spam)
11. [Cron jobs et tâches planifiées](#11-cron-jobs-et-tâches-planifiées)
12. [Tests et validation](#12-tests-et-validation)
13. [Checklist de livraison](#13-checklist-de-livraison)

---

## 1. Vue d'ensemble

### 1.1 Objectif

Implémenter un système complet de notifications qui :
- ✅ Envoie des emails transactionnels et marketing
- ✅ Affiche des notifications temps réel dans l'application web
- ✅ Est compatible avec une future application mobile React Native
- ✅ Respecte les préférences utilisateur
- ✅ Inclut un système anti-spam

### 1.2 Stack technique

| Composant | Technologie | Justification |
|-----------|-------------|---------------|
| **Envoi emails** | Nodemailer + SMTP | Flexible, gratuit, pas de lock-in |
| **Templates HTML** | Fichiers `.html` avec variables `{{var}}` | Simple à maintenir |
| **Base de données** | PostgreSQL (Supabase) | Déjà en place |
| **Temps réel** | Supabase Realtime | Compatible web + mobile |
| **Cron jobs** | `node-cron` | Simple et fiable |
| **Logging** | Table `email_logs` | Traçabilité |

### 1.3 Principes de conception

1. **Un seul point d'entrée** : `notificationService.createNotification()`
2. **Séparation templates/logique** : Templates dans `/server/templates/`
3. **Extensibilité mobile** : Table `notifications` partagée web/mobile
4. **Respect utilisateur** : Table `notification_preferences`
5. **Résilience** : Logging + gestion d'erreurs

---

## 2. Architecture technique

### 2.1 Diagramme de flux

```
┌─────────────────────────────────────────────────────────┐
│                   ÉVÉNEMENT DÉCLENCHEUR                  │
│  (Création annonce, Nouveau message, Paiement, etc.)    │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
         ┌────────────────────────────┐
         │  notificationService.ts    │
         │  createNotification()      │
         └────────────┬───────────────┘
                      │
         ┌────────────┴────────────┐
         │                         │
         ▼                         ▼
┌─────────────────┐       ┌─────────────────┐
│  Table          │       │  emailService   │
│  notifications  │       │  sendEmail()    │
└────────┬────────┘       └────────┬────────┘
         │                         │
         ▼                         ▼
┌─────────────────┐       ┌─────────────────┐
│  Supabase       │       │  SMTP Server    │
│  Realtime       │       │  (Gmail/Brevo)  │
└────────┬────────┘       └────────┬────────┘
         │                         │
         ▼                         ▼
┌─────────────────┐       ┌─────────────────┐
│  Frontend       │       │  Boîte email    │
│  useNotifications│       │  utilisateur    │
└─────────────────┘       └─────────────────┘
```

### 2.2 Structure des dossiers

```
server/
├── services/
│   ├── notificationService.ts    # Service principal
│   ├── emailService.ts            # Envoi emails
│   └── rateLimiter.ts             # Anti-spam
├── templates/                     # Templates HTML
│   ├── account/
│   │   ├── welcome.html
│   │   ├── email_verification.html
│   │   ├── password_reset.html
│   │   ├── password_changed.html
│   │   └── pro_account_activated.html
│   ├── listings/
│   │   ├── listing_validated.html
│   │   ├── listing_rejected.html
│   │   ├── listing_favorited.html
│   │   └── weekly_stats.html
│   ├── messaging/
│   │   ├── new_message.html
│   │   └── message_reply.html
│   ├── marketing/
│   │   ├── monthly_summary.html
│   │   └── boost_suggestion.html
│   └── payments/
│       ├── payment_success.html
│       └── payment_failed.html
├── cron/
│   ├── index.ts                   # Configuration cron
│   ├── weeklySummary.ts
│   └── boostSuggestions.ts
└── routes/
    └── notifications.ts           # API notifications

client/
├── components/
│   └── NotificationCenter.tsx     # UI notifications
└── hooks/
    └── useRealtimeNotifications.ts

shared/
└── types/
    └── notifications.ts           # Types communs
```

---

## 3. Schémas de base de données

### 3.1 Table `notifications`

**Table principale pour web + mobile**

```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,              -- Type de notification (voir enum)
  title TEXT NOT NULL,              -- Titre court
  message TEXT NOT NULL,            -- Message descriptif
  link TEXT,                        -- URL de redirection (ex: /listing/123)
  metadata JSONB,                   -- Données additionnelles
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  
  -- Index pour performance
  INDEX idx_notifications_user_id (user_id),
  INDEX idx_notifications_created_at (created_at DESC),
  INDEX idx_notifications_unread (user_id, is_read) WHERE is_read = false
);
```

**Exemple de données :**
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "user_id": "user_abc",
  "type": "listing_validated",
  "title": "Annonce validée",
  "message": "Votre annonce BMW 320d 2018 est maintenant en ligne",
  "link": "/listing/456",
  "metadata": {
    "listing_id": 456,
    "listing_title": "BMW 320d 2018"
  },
  "is_read": false,
  "created_at": "2025-10-10T10:30:00Z"
}
```

### 3.2 Table `email_logs`

**Traçabilité des emails envoyés**

```sql
CREATE TABLE email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  to_email TEXT NOT NULL,
  email_type TEXT NOT NULL,
  subject TEXT NOT NULL,
  status TEXT DEFAULT 'sent',       -- sent, failed, bounced
  error_message TEXT,
  metadata JSONB,
  sent_at TIMESTAMP DEFAULT NOW(),
  
  -- Index
  INDEX idx_email_logs_user_id (user_id),
  INDEX idx_email_logs_status (status),
  INDEX idx_email_logs_sent_at (sent_at DESC)
);
```

### 3.3 Table `notification_preferences`

**Préférences utilisateur**

```sql
CREATE TABLE notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  
  -- Activation globale
  email_enabled BOOLEAN DEFAULT true,
  in_app_enabled BOOLEAN DEFAULT true,
  
  -- Fréquence emails
  email_frequency TEXT DEFAULT 'instant',  -- instant, daily, weekly, never
  
  -- Types désactivés (array de types)
  disabled_email_types TEXT[] DEFAULT '{}',
  disabled_inapp_types TEXT[] DEFAULT '{}',
  
  -- Métadonnées
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### 3.4 Migration Drizzle

**Ajouter dans `shared/schema.ts` :**

```typescript
import { pgTable, text, uuid, boolean, timestamp, jsonb, index } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// Table notifications
export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  link: text("link"),
  metadata: jsonb("metadata"),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  userIdIdx: index("idx_notifications_user_id").on(table.userId),
  createdAtIdx: index("idx_notifications_created_at").on(table.createdAt),
}));

// Table email_logs
export const emailLogs = pgTable("email_logs", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
  toEmail: text("to_email").notNull(),
  emailType: text("email_type").notNull(),
  subject: text("subject").notNull(),
  status: text("status").default("sent"),
  errorMessage: text("error_message"),
  metadata: jsonb("metadata"),
  sentAt: timestamp("sent_at").defaultNow(),
}, (table) => ({
  userIdIdx: index("idx_email_logs_user_id").on(table.userId),
  statusIdx: index("idx_email_logs_status").on(table.status),
}));

// Table notification_preferences
export const notificationPreferences = pgTable("notification_preferences", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
  emailEnabled: boolean("email_enabled").default(true),
  inAppEnabled: boolean("in_app_enabled").default(true),
  emailFrequency: text("email_frequency").default("instant"),
  disabledEmailTypes: text("disabled_email_types").array().default(sql`'{}'`),
  disabledInappTypes: text("disabled_inapp_types").array().default(sql`'{}'`),
  updatedAt: timestamp("updated_at").defaultNow(),
});
```

**Commande migration :**
```bash
npm run db:push --force
```

---

## 4. Configuration environnement

### 4.1 Variables `.env`

**Ajouter ces variables dans `.env` :**

```bash
# ========================================
# EMAIL CONFIGURATION
# ========================================

# SMTP Settings (Gmail example - à adapter selon votre provider)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false              # true pour port 465
EMAIL_USER=noreply@passionauto2roues.com
EMAIL_PASSWORD=votre_app_password_gmail

# Email sender info
EMAIL_FROM_NAME=PassionAuto2Roues
EMAIL_FROM_ADDRESS=noreply@passionauto2roues.com

# Application URLs
APP_URL=https://passionauto2roues.com
APP_NAME=PassionAuto2Roues

# Rate limiting
EMAIL_RATE_LIMIT_PER_HOUR=10    # Max emails par utilisateur/heure
EMAIL_RATE_LIMIT_PER_DAY=50     # Max emails par utilisateur/jour

# Cron jobs
CRON_WEEKLY_SUMMARY_ENABLED=true
CRON_BOOST_SUGGESTIONS_ENABLED=true
```

### 4.2 Configuration Gmail (exemple)

**Si vous utilisez Gmail, créer un App Password :**

1. Aller sur https://myaccount.google.com/security
2. Activer "2-Step Verification"
3. Aller dans "App passwords"
4. Générer un mot de passe pour "Mail"
5. Utiliser ce mot de passe dans `EMAIL_PASSWORD`

**Alternative : Brevo (SendinBlue)**
```bash
EMAIL_HOST=smtp-relay.brevo.com
EMAIL_PORT=587
EMAIL_USER=votre_email@brevo.com
EMAIL_PASSWORD=votre_api_key_brevo
```

---

## 5. Liste exhaustive des emails

### 5.1 🔐 Emails liés au compte (5 types)

#### 1. **Welcome** - Bienvenue après inscription

| Propriété | Valeur |
|-----------|--------|
| **Type** | `welcome` |
| **Sujet** | "Bienvenue sur PassionAuto2Roues !" |
| **Déclencheur** | Après création compte + validation email |
| **Variables** | `{{userName}}`, `{{dashboardUrl}}` |
| **Template** | `server/templates/account/welcome.html` |

#### 2. **Email Verification** - Confirmation email

| Propriété | Valeur |
|-----------|--------|
| **Type** | `email_verification` |
| **Sujet** | "Confirmez votre adresse email" |
| **Déclencheur** | Inscription ou changement email |
| **Variables** | `{{userName}}`, `{{verificationLink}}`, `{{verificationCode}}` |
| **Template** | `server/templates/account/email_verification.html` |

#### 3. **Password Reset** - Réinitialisation mot de passe

| Propriété | Valeur |
|-----------|--------|
| **Type** | `password_reset` |
| **Sujet** | "Réinitialisation de votre mot de passe" |
| **Déclencheur** | Demande reset password |
| **Variables** | `{{userName}}`, `{{resetLink}}`, `{{expiryTime}}` |
| **Template** | `server/templates/account/password_reset.html` |

#### 4. **Password Changed** - Notification changement MDP

| Propriété | Valeur |
|-----------|--------|
| **Type** | `password_changed` |
| **Sujet** | "Votre mot de passe a été modifié" |
| **Déclencheur** | Après changement MDP réussi |
| **Variables** | `{{userName}}`, `{{changeTime}}`, `{{supportLink}}` |
| **Template** | `server/templates/account/password_changed.html` |

#### 5. **Pro Account Activated** - Activation compte pro

| Propriété | Valeur |
|-----------|--------|
| **Type** | `pro_account_activated` |
| **Sujet** | "Votre compte professionnel est activé !" |
| **Déclencheur** | Validation compte pro par admin |
| **Variables** | `{{userName}}`, `{{companyName}}`, `{{benefits}}`, `{{dashboardUrl}}` |
| **Template** | `server/templates/account/pro_account_activated.html` |

---

### 5.2 📢 Emails liés aux annonces (4 types)

#### 6. **Listing Validated** - Annonce approuvée

| Propriété | Valeur |
|-----------|--------|
| **Type** | `listing_validated` |
| **Sujet** | "Votre annonce est en ligne !" |
| **Déclencheur** | Validation annonce par admin |
| **Variables** | `{{userName}}`, `{{listingTitle}}`, `{{listingUrl}}`, `{{listingImage}}` |
| **Template** | `server/templates/listings/listing_validated.html` |

#### 7. **Listing Rejected** - Annonce rejetée

| Propriété | Valeur |
|-----------|--------|
| **Type** | `listing_rejected` |
| **Sujet** | "Votre annonce nécessite des modifications" |
| **Déclencheur** | Rejet annonce par admin |
| **Variables** | `{{userName}}`, `{{listingTitle}}`, `{{reason}}`, `{{editUrl}}` |
| **Template** | `server/templates/listings/listing_rejected.html` |

#### 8. **Listing Favorited** - Mise en favoris

| Propriété | Valeur |
|-----------|--------|
| **Type** | `listing_favorited` |
| **Sujet** | "Votre annonce a été ajoutée en favoris !" |
| **Déclencheur** | Ajout favoris (max 1 email/jour) |
| **Variables** | `{{userName}}`, `{{listingTitle}}`, `{{favoriteCount}}`, `{{listingUrl}}` |
| **Template** | `server/templates/listings/listing_favorited.html` |

#### 9. **Weekly Stats** - Statistiques hebdomadaires

| Propriété | Valeur |
|-----------|--------|
| **Type** | `weekly_stats` |
| **Sujet** | "Résumé de la semaine pour vos annonces" |
| **Déclencheur** | Cron job (lundi 9h) |
| **Variables** | `{{userName}}`, `{{totalViews}}`, `{{totalFavorites}}`, `{{totalMessages}}`, `{{topListing}}` |
| **Template** | `server/templates/listings/weekly_stats.html` |

---

### 5.3 💬 Emails liés à la messagerie (2 types)

#### 10. **New Message** - Nouveau message

| Propriété | Valeur |
|-----------|--------|
| **Type** | `new_message` |
| **Sujet** | "Nouveau message concernant votre annonce" |
| **Déclencheur** | Message reçu (rate limited: 1/heure/conversation) |
| **Variables** | `{{userName}}`, `{{senderName}}`, `{{messagePreview}}`, `{{listingTitle}}`, `{{conversationUrl}}` |
| **Template** | `server/templates/messaging/new_message.html` |

#### 11. **Message Reply** - Réponse à message

| Propriété | Valeur |
|-----------|--------|
| **Type** | `message_reply` |
| **Sujet** | "Réponse à votre message" |
| **Déclencheur** | Réponse dans conversation (rate limited) |
| **Variables** | `{{userName}}`, `{{replierName}}`, `{{messagePreview}}`, `{{conversationUrl}}` |
| **Template** | `server/templates/messaging/message_reply.html` |

---

### 5.4 📊 Emails marketing (2 types)

#### 12. **Monthly Summary** - Résumé mensuel

| Propriété | Valeur |
|-----------|--------|
| **Type** | `monthly_summary` |
| **Sujet** | "Votre activité du mois sur PassionAuto2Roues" |
| **Déclencheur** | Cron job (1er du mois à 10h) |
| **Variables** | `{{userName}}`, `{{monthName}}`, `{{stats}}`, `{{highlights}}` |
| **Template** | `server/templates/marketing/monthly_summary.html` |

#### 13. **Boost Suggestion** - Suggestion boost

| Propriété | Valeur |
|-----------|--------|
| **Type** | `boost_suggestion` |
| **Sujet** | "Boostez vos annonces pour plus de visibilité" |
| **Déclencheur** | Cron job (mercredi 10h) si annonce peu performante |
| **Variables** | `{{userName}}`, `{{listingTitle}}`, `{{currentViews}}`, `{{boostUrl}}`, `{{benefits}}` |
| **Template** | `server/templates/marketing/boost_suggestion.html` |

---

### 5.5 💳 Emails liés aux paiements (2 types)

#### 14. **Payment Success** - Paiement confirmé

| Propriété | Valeur |
|-----------|--------|
| **Type** | `payment_success` |
| **Sujet** | "Paiement confirmé - Reçu" |
| **Déclencheur** | Webhook Stripe `payment_intent.succeeded` |
| **Variables** | `{{userName}}`, `{{amount}}`, `{{description}}`, `{{invoiceUrl}}`, `{{transactionId}}` |
| **Template** | `server/templates/payments/payment_success.html` |

#### 15. **Payment Failed** - Échec paiement

| Propriété | Valeur |
|-----------|--------|
| **Type** | `payment_failed` |
| **Sujet** | "Problème avec votre paiement" |
| **Déclencheur** | Webhook Stripe `payment_intent.payment_failed` |
| **Variables** | `{{userName}}`, `{{amount}}`, `{{errorReason}}`, `{{retryUrl}}` |
| **Template** | `server/templates/payments/payment_failed.html` |

---

## 6. Types et constantes TypeScript

### 6.1 Fichier `shared/types/notifications.ts`

```typescript
// Types de notifications
export const NOTIFICATION_TYPES = {
  // Compte
  WELCOME: 'welcome',
  EMAIL_VERIFICATION: 'email_verification',
  PASSWORD_RESET: 'password_reset',
  PASSWORD_CHANGED: 'password_changed',
  PRO_ACCOUNT_ACTIVATED: 'pro_account_activated',
  
  // Annonces
  LISTING_VALIDATED: 'listing_validated',
  LISTING_REJECTED: 'listing_rejected',
  LISTING_FAVORITED: 'listing_favorited',
  WEEKLY_STATS: 'weekly_stats',
  
  // Messagerie
  NEW_MESSAGE: 'new_message',
  MESSAGE_REPLY: 'message_reply',
  
  // Marketing
  MONTHLY_SUMMARY: 'monthly_summary',
  BOOST_SUGGESTION: 'boost_suggestion',
  
  // Paiements
  PAYMENT_SUCCESS: 'payment_success',
  PAYMENT_FAILED: 'payment_failed',
} as const;

export type NotificationType = typeof NOTIFICATION_TYPES[keyof typeof NOTIFICATION_TYPES];

// Interface notification
export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  metadata?: Record<string, any>;
  isRead: boolean;
  createdAt: Date;
}

// Interface email log
export interface EmailLog {
  id: string;
  userId?: string;
  toEmail: string;
  emailType: NotificationType;
  subject: string;
  status: 'sent' | 'failed' | 'bounced';
  errorMessage?: string;
  metadata?: Record<string, any>;
  sentAt: Date;
}

// Interface préférences
export interface NotificationPreferences {
  id: string;
  userId: string;
  emailEnabled: boolean;
  inAppEnabled: boolean;
  emailFrequency: 'instant' | 'daily' | 'weekly' | 'never';
  disabledEmailTypes: NotificationType[];
  disabledInappTypes: NotificationType[];
  updatedAt: Date;
}

// Payload création notification
export interface CreateNotificationPayload {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  metadata?: Record<string, any>;
  sendEmail?: boolean;
  emailParams?: Record<string, any>;
}

// Sujets des emails
export const EMAIL_SUBJECTS: Record<NotificationType, string> = {
  welcome: "Bienvenue sur PassionAuto2Roues !",
  email_verification: "Confirmez votre adresse email",
  password_reset: "Réinitialisation de votre mot de passe",
  password_changed: "Votre mot de passe a été modifié",
  pro_account_activated: "Votre compte professionnel est activé !",
  listing_validated: "Votre annonce est en ligne !",
  listing_rejected: "Votre annonce nécessite des modifications",
  listing_favorited: "Votre annonce a été ajoutée en favoris !",
  weekly_stats: "Résumé de la semaine pour vos annonces",
  new_message: "Nouveau message concernant votre annonce",
  message_reply: "Réponse à votre message",
  monthly_summary: "Votre activité du mois sur PassionAuto2Roues",
  boost_suggestion: "Boostez vos annonces pour plus de visibilité",
  payment_success: "Paiement confirmé - Reçu",
  payment_failed: "Problème avec votre paiement",
};
```

---

## 7. Services Backend

### 7.1 `server/services/emailService.ts`

```typescript
import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';
import { supabaseServer } from '../supabase';
import { NOTIFICATION_TYPES, EMAIL_SUBJECTS, NotificationType } from '../../shared/types/notifications';

// Configuration transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// Fonction pour charger et injecter variables dans template
function renderTemplate(type: NotificationType, params: Record<string, any>): string {
  const templatePath = path.join(__dirname, `../templates/${getTemplatePath(type)}`);
  
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Template not found: ${templatePath}`);
  }
  
  let html = fs.readFileSync(templatePath, 'utf-8');
  
  // Injection des variables
  Object.keys(params).forEach(key => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    html = html.replace(regex, params[key] || '');
  });
  
  // Variables globales
  html = html.replace(/{{appUrl}}/g, process.env.APP_URL || '');
  html = html.replace(/{{appName}}/g, process.env.APP_NAME || 'PassionAuto2Roues');
  html = html.replace(/{{year}}/g, new Date().getFullYear().toString());
  
  return html;
}

// Mapper type → chemin template
function getTemplatePath(type: NotificationType): string {
  const paths: Record<NotificationType, string> = {
    welcome: 'account/welcome.html',
    email_verification: 'account/email_verification.html',
    password_reset: 'account/password_reset.html',
    password_changed: 'account/password_changed.html',
    pro_account_activated: 'account/pro_account_activated.html',
    listing_validated: 'listings/listing_validated.html',
    listing_rejected: 'listings/listing_rejected.html',
    listing_favorited: 'listings/listing_favorited.html',
    weekly_stats: 'listings/weekly_stats.html',
    new_message: 'messaging/new_message.html',
    message_reply: 'messaging/message_reply.html',
    monthly_summary: 'marketing/monthly_summary.html',
    boost_suggestion: 'marketing/boost_suggestion.html',
    payment_success: 'payments/payment_success.html',
    payment_failed: 'payments/payment_failed.html',
  };
  
  return paths[type];
}

// Fonction principale d'envoi
export async function sendEmail({
  to,
  type,
  params,
  userId,
}: {
  to: string;
  type: NotificationType;
  params: Record<string, any>;
  userId?: string;
}): Promise<void> {
  try {
    const subject = EMAIL_SUBJECTS[type];
    const html = renderTemplate(type, params);
    
    // Envoi email
    const info = await transporter.sendMail({
      from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_FROM_ADDRESS}>`,
      to,
      subject,
      html,
    });
    
    // Logger succès
    await logEmail({
      userId,
      toEmail: to,
      emailType: type,
      subject,
      status: 'sent',
      metadata: { messageId: info.messageId },
    });
    
    console.log(`✅ Email envoyé: ${type} → ${to}`);
  } catch (error) {
    console.error(`❌ Erreur envoi email ${type}:`, error);
    
    // Logger échec
    await logEmail({
      userId,
      toEmail: to,
      emailType: type,
      subject: EMAIL_SUBJECTS[type],
      status: 'failed',
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
    });
    
    throw error;
  }
}

// Logger email
async function logEmail({
  userId,
  toEmail,
  emailType,
  subject,
  status,
  errorMessage,
  metadata,
}: {
  userId?: string;
  toEmail: string;
  emailType: NotificationType;
  subject: string;
  status: 'sent' | 'failed' | 'bounced';
  errorMessage?: string;
  metadata?: Record<string, any>;
}): Promise<void> {
  await supabaseServer.from('email_logs').insert({
    user_id: userId,
    to_email: toEmail,
    email_type: emailType,
    subject,
    status,
    error_message: errorMessage,
    metadata,
  });
}
```

### 7.2 `server/services/notificationService.ts`

```typescript
import { supabaseServer } from '../supabase';
import { sendEmail } from './emailService';
import { checkRateLimit } from './rateLimiter';
import { CreateNotificationPayload, NotificationType } from '../../shared/types/notifications';

export async function createNotification({
  userId,
  type,
  title,
  message,
  link,
  metadata,
  sendEmail: shouldSendEmail = true,
  emailParams = {},
}: CreateNotificationPayload): Promise<void> {
  try {
    // 1. Créer notification in-app
    const { error: notifError } = await supabaseServer.from('notifications').insert({
      user_id: userId,
      type,
      title,
      message,
      link,
      metadata,
    });
    
    if (notifError) {
      console.error('❌ Erreur création notification:', notifError);
      throw notifError;
    }
    
    console.log(`✅ Notification créée: ${type} pour user ${userId}`);
    
    // 2. Vérifier préférences utilisateur
    const { data: prefs } = await supabaseServer
      .from('notification_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    // Si pas de préférences, créer par défaut
    if (!prefs) {
      await supabaseServer.from('notification_preferences').insert({
        user_id: userId,
      });
    }
    
    const emailEnabled = prefs?.email_enabled ?? true;
    const isTypeDisabled = prefs?.disabled_email_types?.includes(type) ?? false;
    
    // 3. Envoyer email si conditions remplies
    if (shouldSendEmail && emailEnabled && !isTypeDisabled) {
      // Vérifier rate limit
      const canSend = await checkRateLimit(userId, type);
      
      if (!canSend) {
        console.log(`⏱️ Rate limit atteint pour ${type} - email non envoyé`);
        return;
      }
      
      // Récupérer email utilisateur
      const { data: user } = await supabaseServer
        .from('users')
        .select('email, name')
        .eq('id', userId)
        .single();
      
      if (user?.email) {
        await sendEmail({
          to: user.email,
          type,
          params: {
            userName: user.name,
            ...emailParams,
          },
          userId,
        });
      }
    }
  } catch (error) {
    console.error('❌ Erreur notificationService:', error);
    throw error;
  }
}
```

### 7.3 `server/services/rateLimiter.ts`

```typescript
import { supabaseServer } from '../supabase';
import { NotificationType } from '../../shared/types/notifications';

// Cache en mémoire pour rate limiting
const rateLimitCache = new Map<string, { count: number; resetAt: Date }>();

export async function checkRateLimit(
  userId: string,
  type: NotificationType
): Promise<boolean> {
  const cacheKey = `${userId}:${type}`;
  const now = new Date();
  
  // Limites spécifiques par type
  const limits: Partial<Record<NotificationType, { max: number; windowMs: number }>> = {
    new_message: { max: 1, windowMs: 60 * 60 * 1000 }, // 1 par heure
    message_reply: { max: 1, windowMs: 60 * 60 * 1000 },
    listing_favorited: { max: 1, windowMs: 24 * 60 * 60 * 1000 }, // 1 par jour
  };
  
  const limit = limits[type];
  
  if (!limit) {
    return true; // Pas de limite pour ce type
  }
  
  // Vérifier cache
  const cached = rateLimitCache.get(cacheKey);
  
  if (cached && cached.resetAt > now) {
    if (cached.count >= limit.max) {
      return false; // Limite atteinte
    }
    cached.count++;
    return true;
  }
  
  // Nouveau compteur
  rateLimitCache.set(cacheKey, {
    count: 1,
    resetAt: new Date(now.getTime() + limit.windowMs),
  });
  
  return true;
}

// Nettoyer cache périodiquement
setInterval(() => {
  const now = new Date();
  for (const [key, value] of rateLimitCache.entries()) {
    if (value.resetAt <= now) {
      rateLimitCache.delete(key);
    }
  }
}, 10 * 60 * 1000); // Toutes les 10 minutes
```

---

## 8. Frontend - Notifications in-app

### 8.1 Hook `client/src/hooks/useRealtimeNotifications.ts`

```typescript
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Notification } from '@/types/notifications';

export function useRealtimeNotifications(userId: string | undefined) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  
  useEffect(() => {
    if (!userId) return;
    
    // Charger notifications initiales
    loadNotifications();
    
    // S'abonner aux changements temps réel
    const channel = supabase
      .channel(`notifications_${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const newNotif = payload.new as Notification;
          setNotifications(prev => [newNotif, ...prev]);
          setUnreadCount(prev => prev + 1);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const updated = payload.new as Notification;
          setNotifications(prev =>
            prev.map(n => (n.id === updated.id ? updated : n))
          );
          calculateUnreadCount();
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);
  
  async function loadNotifications() {
    if (!userId) return;
    
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);
    
    if (error) {
      console.error('Erreur chargement notifications:', error);
      return;
    }
    
    setNotifications(data || []);
    setUnreadCount(data?.filter(n => !n.is_read).length || 0);
    setLoading(false);
  }
  
  async function markAsRead(notificationId: string) {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);
    
    if (!error) {
      setNotifications(prev =>
        prev.map(n => (n.id === notificationId ? { ...n, is_read: true } : n))
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  }
  
  async function markAllAsRead() {
    if (!userId) return;
    
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);
    
    if (!error) {
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    }
  }
  
  function calculateUnreadCount() {
    setUnreadCount(notifications.filter(n => !n.is_read).length);
  }
  
  return {
    notifications,
    loading,
    unreadCount,
    markAsRead,
    markAllAsRead,
    refresh: loadNotifications,
  };
}
```

### 8.2 Composant `client/src/components/NotificationCenter.tsx`

```typescript
import React, { useState } from 'react';
import { Bell, Check, CheckCheck, X } from 'lucide-react';
import { useRealtimeNotifications } from '@/hooks/useRealtimeNotifications';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useLocation } from 'wouter';

export function NotificationCenter() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  
  const {
    notifications,
    loading,
    unreadCount,
    markAsRead,
    markAllAsRead,
  } = useRealtimeNotifications(user?.id);
  
  const handleNotificationClick = async (notification: any) => {
    // Marquer comme lu
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }
    
    // Rediriger vers le lien
    if (notification.link) {
      setLocation(notification.link);
      setIsOpen(false);
    }
  };
  
  const getNotificationIcon = (type: string) => {
    // Retourner icône selon type
    return '🔔';
  };
  
  return (
    <div className="relative">
      {/* Bouton cloche */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-primary-bolt-500 transition-colors"
        data-testid="button-notifications"
      >
        <Bell className="h-6 w-6" />
        
        {/* Badge compteur */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
      
      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="font-semibold text-gray-900">Notifications</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-sm text-primary-bolt-500 hover:text-primary-bolt-600"
                  data-testid="button-mark-all-read"
                >
                  <CheckCheck className="h-4 w-4" />
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
          
          {/* Liste notifications */}
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-gray-500">
                Chargement...
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Bell className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p>Aucune notification</p>
              </div>
            ) : (
              notifications.map(notif => (
                <div
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`p-4 border-b cursor-pointer transition-colors ${
                    !notif.is_read
                      ? 'bg-blue-50 hover:bg-blue-100'
                      : 'hover:bg-gray-50'
                  }`}
                  data-testid={`notification-${notif.id}`}
                >
                  <div className="flex gap-3">
                    <div className="text-2xl">
                      {getNotificationIcon(notif.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm">
                        {notif.title}
                      </p>
                      <p className="text-sm text-gray-600 mt-1 truncate">
                        {notif.message}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {formatDistanceToNow(new Date(notif.created_at), {
                          addSuffix: true,
                          locale: fr,
                        })}
                      </p>
                    </div>
                    {!notif.is_read && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2" />
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
          
          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t text-center">
              <button
                onClick={() => {
                  setLocation('/notifications');
                  setIsOpen(false);
                }}
                className="text-sm text-primary-bolt-500 hover:text-primary-bolt-600"
              >
                Voir toutes les notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
```

### 8.3 Intégration dans la Navbar

**Modifier `client/src/components/Navbar.tsx` :**

```typescript
import { NotificationCenter } from './NotificationCenter';

// Dans le JSX, ajouter :
<div className="flex items-center gap-4">
  <NotificationCenter />
  {/* ... autres éléments navbar */}
</div>
```

---

## 9. Déclencheurs et intégrations

### 9.1 Points d'intégration dans le code

#### **1. Création annonce** (`server/routes.ts` ~ ligne 200)

```typescript
// Après création annonce
app.post("/api/annonces", async (req, res) => {
  const newAnnonce = await storage.createAnnonce(req.body);
  
  // ✅ AJOUTER ICI
  await notificationService.createNotification({
    userId: req.body.userId,
    type: 'listing_created',
    title: 'Annonce créée',
    message: 'Votre annonce est en attente de validation',
    link: `/dashboard/mes-annonces`,
    sendEmail: false, // Pas d'email pour création
  });
  
  res.json(newAnnonce);
});
```

#### **2. Validation annonce** (`server/routes/admin.ts` ~ ligne 150)

```typescript
// Après validation admin
app.post("/api/admin/annonces/:id/validate", async (req, res) => {
  const annonce = await storage.updateAnnonceStatus(id, 'approved');
  
  // ✅ AJOUTER ICI
  await notificationService.createNotification({
    userId: annonce.userId,
    type: 'listing_validated',
    title: 'Annonce validée',
    message: `Votre annonce ${annonce.title} est maintenant en ligne`,
    link: `/listing/${annonce.id}`,
    sendEmail: true,
    emailParams: {
      listingTitle: annonce.title,
      listingUrl: `${process.env.APP_URL}/listing/${annonce.id}`,
      listingImage: annonce.images[0],
    },
  });
  
  res.json(annonce);
});
```

#### **3. Rejet annonce** (`server/routes/admin.ts` ~ ligne 170)

```typescript
// Après rejet admin
app.post("/api/admin/annonces/:id/reject", async (req, res) => {
  const { reason } = req.body;
  const annonce = await storage.updateAnnonceStatus(id, 'rejected');
  
  // ✅ AJOUTER ICI
  await notificationService.createNotification({
    userId: annonce.userId,
    type: 'listing_rejected',
    title: 'Annonce rejetée',
    message: `Votre annonce nécessite des modifications`,
    link: `/dashboard/mes-annonces`,
    sendEmail: true,
    emailParams: {
      listingTitle: annonce.title,
      reason: reason || 'Non conforme aux conditions',
      editUrl: `${process.env.APP_URL}/edit-listing/${annonce.id}`,
    },
  });
  
  res.json(annonce);
});
```

#### **4. Ajout favoris** (`server/routes/favorites.ts` ~ ligne 30)

```typescript
// Après ajout favoris
app.post("/api/favorites/add", async (req, res) => {
  const { vehicleId, userId } = req.body;
  await storage.addFavorite(userId, vehicleId);
  
  // Récupérer annonce et son propriétaire
  const vehicle = await storage.getVehicle(vehicleId);
  
  // ✅ AJOUTER ICI (notifier le vendeur)
  await notificationService.createNotification({
    userId: vehicle.userId,
    type: 'listing_favorited',
    title: 'Ajout en favoris',
    message: `Quelqu'un a ajouté votre annonce ${vehicle.title} en favoris`,
    link: `/listing/${vehicleId}`,
    sendEmail: true,
    emailParams: {
      listingTitle: vehicle.title,
      favoriteCount: vehicle.favorites + 1,
      listingUrl: `${process.env.APP_URL}/listing/${vehicleId}`,
    },
  });
  
  res.json({ success: true });
});
```

#### **5. Nouveau message** (`server/routes/messaging.ts` ~ ligne 100)

```typescript
// Après envoi message
app.post("/api/messages-simple/send", async (req, res) => {
  const { fromUserId, toUserId, content, vehicleId } = req.body;
  const message = await storage.createMessage(req.body);
  
  // ✅ AJOUTER ICI
  const fromUser = await storage.getUser(fromUserId);
  const vehicle = await storage.getVehicle(vehicleId);
  
  await notificationService.createNotification({
    userId: toUserId,
    type: 'new_message',
    title: 'Nouveau message',
    message: `${fromUser.name} vous a envoyé un message`,
    link: `/messages?conversation=${vehicleId}_${fromUserId}`,
    sendEmail: true,
    emailParams: {
      senderName: fromUser.name,
      messagePreview: content.substring(0, 100),
      listingTitle: vehicle?.title || 'Votre annonce',
      conversationUrl: `${process.env.APP_URL}/messages?conversation=${vehicleId}_${fromUserId}`,
    },
  });
  
  res.json(message);
});
```

#### **6. Webhooks Stripe** (`server/webhooks/stripe.ts` - À créer)

```typescript
import { notificationService } from '../services/notificationService';

app.post('/api/webhooks/stripe', async (req, res) => {
  const event = req.body;
  
  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object;
    const userId = paymentIntent.metadata.userId;
    
    // ✅ AJOUTER ICI
    await notificationService.createNotification({
      userId,
      type: 'payment_success',
      title: 'Paiement confirmé',
      message: `Votre paiement de ${paymentIntent.amount / 100}€ a été confirmé`,
      link: '/dashboard/subscriptions',
      sendEmail: true,
      emailParams: {
        amount: `${paymentIntent.amount / 100}€`,
        description: paymentIntent.description || 'Abonnement',
        transactionId: paymentIntent.id,
        invoiceUrl: `${process.env.APP_URL}/invoices/${paymentIntent.id}`,
      },
    });
  }
  
  if (event.type === 'payment_intent.payment_failed') {
    const paymentIntent = event.data.object;
    const userId = paymentIntent.metadata.userId;
    
    await notificationService.createNotification({
      userId,
      type: 'payment_failed',
      title: 'Échec paiement',
      message: 'Un problème est survenu avec votre paiement',
      link: '/dashboard/subscriptions',
      sendEmail: true,
      emailParams: {
        amount: `${paymentIntent.amount / 100}€`,
        errorReason: paymentIntent.last_payment_error?.message || 'Erreur inconnue',
        retryUrl: `${process.env.APP_URL}/dashboard/subscriptions`,
      },
    });
  }
  
  res.json({ received: true });
});
```

---

## 10. Règles anti-spam

### 10.1 Rate limiting par type

| Type notification | Limite | Fenêtre |
|-------------------|--------|---------|
| `new_message` | 1 email | Par conversation/heure |
| `message_reply` | 1 email | Par conversation/heure |
| `listing_favorited` | 1 email | Par annonce/jour |
| Emails transactionnels | Illimité | - |
| Emails marketing | 2 emails | Par semaine |

### 10.2 Règles globales

```typescript
// Dans notificationService.ts
const GLOBAL_LIMITS = {
  MAX_EMAILS_PER_DAY: 50,        // Max total par utilisateur/jour
  MAX_EMAILS_PER_HOUR: 10,       // Max par utilisateur/heure
  MAX_SAME_TYPE_PER_DAY: 5,      // Max même type par jour
};
```

### 10.3 Digest mode

Pour les notifications fréquentes, grouper en digest :

```typescript
// Si email_frequency = 'daily'
// → Grouper toutes les notifications du jour
// → Envoyer 1 seul email à 18h avec résumé
```

---

## 11. Cron jobs et tâches planifiées

### 11.1 Configuration `server/cron/index.ts`

```typescript
import cron from 'node-cron';
import { weeklySummary } from './weeklySummary';
import { boostSuggestions } from './boostSuggestions';
import { monthlySummary } from './monthlySummary';
import { cleanupOldLogs } from './cleanup';

export function initCronJobs() {
  // Résumé hebdomadaire : Lundi 9h
  cron.schedule('0 9 * * 1', async () => {
    if (process.env.CRON_WEEKLY_SUMMARY_ENABLED === 'true') {
      console.log('🕐 Lancement cron : Résumé hebdomadaire');
      await weeklySummary();
    }
  });
  
  // Suggestions boost : Mercredi 10h
  cron.schedule('0 10 * * 3', async () => {
    if (process.env.CRON_BOOST_SUGGESTIONS_ENABLED === 'true') {
      console.log('🕐 Lancement cron : Suggestions boost');
      await boostSuggestions();
    }
  });
  
  // Résumé mensuel : 1er du mois à 10h
  cron.schedule('0 10 1 * *', async () => {
    console.log('🕐 Lancement cron : Résumé mensuel');
    await monthlySummary();
  });
  
  // Nettoyage logs : Dimanche 2h
  cron.schedule('0 2 * * 0', async () => {
    console.log('🕐 Lancement cron : Nettoyage logs');
    await cleanupOldLogs();
  });
  
  console.log('✅ Cron jobs initialisés');
}
```

### 11.2 Résumé hebdomadaire `server/cron/weeklySummary.ts`

```typescript
import { supabaseServer } from '../supabase';
import { notificationService } from '../services/notificationService';

export async function weeklySummary() {
  // Récupérer utilisateurs avec annonces actives
  const { data: users } = await supabaseServer
    .from('users')
    .select('id, email, name')
    .eq('type', 'individual') // ou 'professional'
    .neq('onboarding_status', 'incomplete_profile');
  
  if (!users) return;
  
  for (const user of users) {
    // Récupérer stats de la semaine
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    const { data: listings } = await supabaseServer
      .from('annonces')
      .select('id, title, views, favorites')
      .eq('user_id', user.id)
      .eq('status', 'approved')
      .gte('created_at', oneWeekAgo.toISOString());
    
    if (!listings || listings.length === 0) continue;
    
    // Calculer totaux
    const totalViews = listings.reduce((sum, l) => sum + (l.views || 0), 0);
    const totalFavorites = listings.reduce((sum, l) => sum + (l.favorites || 0), 0);
    
    // Meilleure annonce
    const topListing = listings.sort((a, b) => (b.views || 0) - (a.views || 0))[0];
    
    // Envoyer notification
    await notificationService.createNotification({
      userId: user.id,
      type: 'weekly_stats',
      title: 'Résumé de la semaine',
      message: `Vos annonces ont reçu ${totalViews} vues cette semaine`,
      link: '/dashboard',
      sendEmail: true,
      emailParams: {
        totalViews,
        totalFavorites,
        totalMessages: 0, // À calculer depuis messages
        topListing: {
          title: topListing.title,
          views: topListing.views,
          url: `${process.env.APP_URL}/listing/${topListing.id}`,
        },
      },
    });
  }
  
  console.log(`✅ Résumés hebdo envoyés à ${users.length} utilisateurs`);
}
```

### 11.3 Suggestions boost `server/cron/boostSuggestions.ts`

```typescript
import { supabaseServer } from '../supabase';
import { notificationService } from '../services/notificationService';

export async function boostSuggestions() {
  // Trouver annonces peu performantes (créées il y a +7 jours, <10 vues)
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  
  const { data: lowPerformingListings } = await supabaseServer
    .from('annonces')
    .select('id, title, user_id, views')
    .eq('status', 'approved')
    .lte('created_at', sevenDaysAgo.toISOString())
    .lt('views', 10);
  
  if (!lowPerformingListings) return;
  
  const userListings = new Map<string, any[]>();
  
  // Grouper par utilisateur
  lowPerformingListings.forEach(listing => {
    if (!userListings.has(listing.user_id)) {
      userListings.set(listing.user_id, []);
    }
    userListings.get(listing.user_id)!.push(listing);
  });
  
  // Envoyer suggestions
  for (const [userId, listings] of userListings) {
    const topListing = listings[0];
    
    await notificationService.createNotification({
      userId,
      type: 'boost_suggestion',
      title: 'Boostez vos annonces',
      message: `Donnez plus de visibilité à vos ${listings.length} annonce(s)`,
      link: '/dashboard/mes-annonces',
      sendEmail: true,
      emailParams: {
        listingTitle: topListing.title,
        currentViews: topListing.views,
        boostUrl: `${process.env.APP_URL}/boost/${topListing.id}`,
        benefits: [
          'Apparaître en tête de liste',
          'Badge "Mise en avant"',
          '+300% de visibilité en moyenne',
        ],
      },
    });
  }
  
  console.log(`✅ Suggestions boost envoyées pour ${userListings.size} utilisateurs`);
}
```

### 11.4 Initialisation dans `server/index.ts`

```typescript
import { initCronJobs } from './cron';

// Après démarrage serveur
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  
  // Initialiser cron jobs
  initCronJobs();
});
```

---

## 12. Tests et validation

### 12.1 Checklist de tests manuels

#### **Emails (15 types à tester)**

- [ ] **welcome** - Inscription nouveau compte
- [ ] **email_verification** - Vérification email
- [ ] **password_reset** - Demande reset MDP
- [ ] **password_changed** - Changement MDP
- [ ] **pro_account_activated** - Validation compte pro
- [ ] **listing_validated** - Validation annonce admin
- [ ] **listing_rejected** - Rejet annonce admin
- [ ] **listing_favorited** - Ajout favoris
- [ ] **weekly_stats** - Résumé hebdo (cron)
- [ ] **new_message** - Nouveau message
- [ ] **message_reply** - Réponse message
- [ ] **monthly_summary** - Résumé mensuel (cron)
- [ ] **boost_suggestion** - Suggestion boost (cron)
- [ ] **payment_success** - Paiement réussi
- [ ] **payment_failed** - Paiement échoué

#### **Notifications in-app**

- [ ] Badge compteur s'affiche correctement
- [ ] Dropdown s'ouvre au clic
- [ ] Notifications temps réel (INSERT détecté)
- [ ] Marquer comme lu (1 notification)
- [ ] Marquer tout comme lu
- [ ] Redirection au clic sur notification
- [ ] Scroll infini si +50 notifications

#### **Préférences**

- [ ] Désactiver emails globalement
- [ ] Désactiver type spécifique
- [ ] Fréquence daily/weekly fonctionne
- [ ] Préférences sauvegardées correctement

#### **Rate limiting**

- [ ] Max 1 email new_message par heure
- [ ] Max 1 email listing_favorited par jour
- [ ] Pas de spam si actions répétées

### 12.2 Tests automatisés (optionnel)

```typescript
// tests/notifications.test.ts
describe('Notification Service', () => {
  it('should create notification in database', async () => {
    // Test création notification
  });
  
  it('should send email if enabled', async () => {
    // Test envoi email
  });
  
  it('should respect rate limits', async () => {
    // Test rate limiting
  });
  
  it('should log email in email_logs', async () => {
    // Test logging
  });
});
```

### 12.3 Vérifications en production

**Avant mise en production :**

1. ✅ Toutes les variables `.env` configurées
2. ✅ SMTP testé avec email réel
3. ✅ Tables créées (`notifications`, `email_logs`, `notification_preferences`)
4. ✅ Au moins 3 templates HTML testés
5. ✅ NotificationCenter visible dans navbar
6. ✅ Rate limiting activé
7. ✅ Cron jobs testés manuellement
8. ✅ Logs d'erreurs configurés

---

## 13. Checklist de livraison

### 13.1 Backend

#### Base de données
- [ ] Table `notifications` créée avec indexes
- [ ] Table `email_logs` créée avec indexes
- [ ] Table `notification_preferences` créée
- [ ] Migration Drizzle exécutée (`npm run db:push --force`)

#### Services
- [ ] `emailService.ts` implémenté et testé
- [ ] `notificationService.ts` implémenté et testé
- [ ] `rateLimiter.ts` implémenté
- [ ] Configuration Nodemailer validée

#### Templates HTML
- [ ] 5 templates compte créés
- [ ] 4 templates annonces créés
- [ ] 2 templates messagerie créés
- [ ] 2 templates marketing créés
- [ ] 2 templates paiement créés
- [ ] Variables `{{}}` fonctionnent correctement

#### Déclencheurs
- [ ] Création annonce → notification
- [ ] Validation annonce → email + notification
- [ ] Rejet annonce → email + notification
- [ ] Ajout favoris → notification (rate limited)
- [ ] Nouveau message → email + notification (rate limited)
- [ ] Webhooks Stripe configurés

#### Cron jobs
- [ ] Résumé hebdomadaire (lundi 9h)
- [ ] Suggestions boost (mercredi 10h)
- [ ] Résumé mensuel (1er du mois)
- [ ] Nettoyage logs (dimanche 2h)
- [ ] Cron jobs testés manuellement

### 13.2 Frontend

- [ ] Hook `useRealtimeNotifications` implémenté
- [ ] Composant `NotificationCenter` créé
- [ ] Badge compteur fonctionne
- [ ] Dropdown fonctionne
- [ ] Temps réel Supabase fonctionne
- [ ] Mark as read fonctionne
- [ ] Redirection au clic fonctionne
- [ ] Intégré dans navbar

### 13.3 Configuration

- [ ] Variables `.env` configurées
- [ ] SMTP validé (email test reçu)
- [ ] Types TypeScript à jour
- [ ] Rate limiting configuré
- [ ] Logs d'erreurs en place

### 13.4 Documentation

- [ ] README mis à jour
- [ ] Variables d'environnement documentées
- [ ] Types de notifications documentés
- [ ] Guide de test créé

### 13.5 Tests

- [ ] Au moins 3 emails testés manuellement
- [ ] Notifications in-app testées
- [ ] Rate limiting vérifié
- [ ] Cron jobs testés
- [ ] Pas d'erreur console

---

## 14. Annexes

### 14.1 Exemple de template HTML minimal

```html
<!-- server/templates/account/welcome.html -->
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
      line-height: 1.6; 
      color: #333; 
      margin: 0; 
      padding: 0; 
    }
    .container { 
      max-width: 600px; 
      margin: 0 auto; 
      background: #ffffff; 
    }
    .header { 
      background: linear-gradient(135deg, #067D92 0%, #05626F 100%); 
      color: white; 
      padding: 30px 20px; 
      text-align: center; 
    }
    .content { 
      padding: 30px 20px; 
    }
    .button { 
      display: inline-block; 
      background: #067D92; 
      color: white; 
      padding: 14px 28px; 
      text-decoration: none; 
      border-radius: 6px; 
      font-weight: 600; 
      margin: 20px 0; 
    }
    .footer { 
      background: #f5f5f5; 
      padding: 20px; 
      text-align: center; 
      font-size: 12px; 
      color: #666; 
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Bienvenue sur {{appName}} !</h1>
    </div>
    
    <div class="content">
      <p>Bonjour <strong>{{userName}}</strong>,</p>
      
      <p>Votre compte a été créé avec succès ! Vous faites maintenant partie de la communauté PassionAuto2Roues.</p>
      
      <p>Vous pouvez dès maintenant :</p>
      <ul>
        <li>Publier vos annonces de véhicules</li>
        <li>Rechercher votre prochaine acquisition</li>
        <li>Échanger avec les vendeurs</li>
      </ul>
      
      <p style="text-align: center;">
        <a href="{{dashboardUrl}}" class="button">
          Accéder à mon tableau de bord
        </a>
      </p>
      
      <p>À très vite sur PassionAuto2Roues !</p>
    </div>
    
    <div class="footer">
      <p>&copy; {{year}} {{appName}} - Tous droits réservés</p>
      <p>
        <a href="{{appUrl}}/unsubscribe" style="color: #666;">Se désabonner</a>
      </p>
    </div>
  </div>
</body>
</html>
```

### 14.2 Dépannage fréquent

#### Emails ne partent pas

1. Vérifier `.env` : `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASSWORD`
2. Tester connexion SMTP :
```bash
node -e "require('./server/services/emailService').sendEmail({to:'test@example.com',type:'welcome',params:{userName:'Test'}})"
```
3. Vérifier logs dans `email_logs`

#### Notifications temps réel ne fonctionnent pas

1. Vérifier Supabase Realtime activé
2. Check channel name : `notifications_${userId}`
3. Vérifier permissions table `notifications`

#### Rate limiting trop restrictif

1. Ajuster limites dans `rateLimiter.ts`
2. Vider cache : redémarrer serveur
3. Check logs pour voir refus

---

## 🎯 Résumé - À faire par le développeur

1. **Installer dépendances**
   ```bash
   npm install nodemailer @types/nodemailer node-cron @types/node-cron
   ```

2. **Créer tables** (Drizzle schema + migration)

3. **Configurer .env** (SMTP + variables)

4. **Créer 15 templates HTML** dans `/server/templates/`

5. **Implémenter 3 services** (email, notification, rate limiter)

6. **Ajouter déclencheurs** dans routes existantes

7. **Créer cron jobs** (4 tâches planifiées)

8. **Implémenter frontend** (NotificationCenter + hook)

9. **Tester exhaustivement** (checklist section 12)

10. **Livrer** (checklist section 13)

---

**Document créé le :** Octobre 2025  
**Version :** 1.0  
**Contact :** [Votre contact support]  
**Temps estimé d'implémentation :** 3-5 jours (développeur expérimenté)


================== Remarque de chatgpt a prendre en compte =================

Voici mon analyse critique + recommandations stratégiques pour t’aider à décider quoi garder, quoi simplifier et comment l’intégrer efficacement.

⚙️ 1. Qualité globale

Le document est exceptionnel :

✅ Architecture claire (notificationService + emailService + rateLimiter)

✅ Tables bien pensées (notifications, email_logs, notification_preferences)

✅ Typage TypeScript propre (shared/types)

✅ Séparation parfaite logique / templates

✅ Gestion Realtime Supabase web/mobile

✅ Cron jobs et déclencheurs déjà prévus

✅ Documentation prête à l’emploi pour un freelance

En résumé :

C’est une base complète, immédiatement exploitable par n’importe quel dev fullstack pour produire un système emailing/notifications professionnel, scalable et multi-plateforme.

🧠 2. Points forts à conserver absolument
Élément	Pourquoi c’est bon
notificationService.ts comme point d’entrée unique	Simplifie tout : un seul appel backend pour créer notification + email
Séparation logique / templates HTML	Indispensable pour évoluer (et changer de style facilement)
Supabase Realtime	Reutilisable sur ton futur app mobile React Native sans refonte
Rate limiter en mémoire	Suffisant au démarrage, protège contre les abus
Cron jobs (hebdo, mensuel, boost)	Excellent pour engagement utilisateur
Préférences utilisateur	Future-proof : permet d’ajouter facilement désabonnement, modes digest, etc.
Email logs	Transparence et debug facile en production
🧩 3. Points à simplifier ou adapter
🔹 a) “15 templates” → commence simple

Tu n’as pas besoin de tout coder d’un coup.
Priorise :

🔐 Compte : welcome, email_verification, password_reset

📢 Annonces : listing_validated, listing_rejected, listing_favorited

💬 Messagerie : new_message

💳 Paiements : payment_success, payment_failed

➡️ Ça fait 8 templates au lieu de 15 — suffisant pour MVP.
Tu compléteras les marketing (weekly_stats, boost_suggestion) plus tard.

🔹 b) Cron jobs → active uniquement ceux utiles

Garde :

weeklySummary ✅ (utile)

boostSuggestions ❌ (ajoute plus tard)

monthlySummary ❌ (optionnel pour V2)

cleanupOldLogs ✅ (simple, peu coûteux)

🔹 c) Rate limiting

Le cache mémoire est bien,
mais prévois de persister les compteurs en base plus tard si tu scales sur plusieurs serveurs (load balancing).
Pour l’instant → parfait comme ça.

🔹 d) Notification Preferences

Tu peux reporter la création de la table notification_preferences si tu veux livrer vite.
Mets juste un flag simple email_enabled: true dans le code tant que la table n’existe pas.

🔹 e) Gestion multi-provider email

Le doc prévoit Nodemailer + SMTP — excellent.
Mais pour plus de fiabilité, tu peux :

👉 Commencer avec Brevo (SMTP gratuit 300/jour)
et passer plus tard à Resend ou Postmark (si tu veux analytics ou domain reputation).

📱 4. Compatibilité mobile (React Native)

✅ Excellent choix : le système repose sur Supabase Realtime
→ donc ton app mobile pourra utiliser exactement la même table notifications et le même notificationService.

🔮 Dans la V2 :

Ajoute un pushService.ts pour envoyer les push via Firebase Cloud Messaging (FCM).

Tu pourras ainsi envoyer des push + emails à partir du même déclencheur.

🧩 5. Vision à long terme

Le document prépare déjà les prochaines étapes :

✅ Intégration Stripe (paiement & renouvellement)

✅ Notifications marketing programmées

✅ Système anti-spam

✅ Digest mode (daily/weekly)

✅ Compatibilité multi-device

Tu pourras faire évoluer cette base en SaaS notification center si besoin (exploitable dans d’autres projets).

🪶 6. Recommandations pratiques
Phase	Ce que je recommande
Phase 1 (MVP)	Implémente : 8 templates essentiels, tables notifications + email_logs, services email + notification, intégration Supabase realtime
Phase 2	Ajoute : notification_preferences, cron jobs (weeklySummary), rate limiting affiné
Phase 3	Ajoute : campagnes marketing, digest emails, push mobile via FCM
Phase 4	Ajoute : tableau d’analyse admin (taux ouverture, logs, erreurs)
💡 7. Verdict global
Critère	Évaluation
Cohérence technique	⭐⭐⭐⭐⭐
Simplicité d’implémentation	⭐⭐⭐⭐☆
Scalabilité	⭐⭐⭐⭐⭐
Maintenance future	⭐⭐⭐⭐⭐
Compatibilité mobile	⭐⭐⭐⭐⭐
MVP Ready	✅ Oui, immédiatement

👉 C’est une architecture quasi-parfaite pour ton projet PassionAuto2Roues.
Tu peux la valider telle quelle avec seulement un petit allègement (moins de templates et cron pour commencer).