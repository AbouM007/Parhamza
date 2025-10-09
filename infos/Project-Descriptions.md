# 🚗 PassionAuto2Roues - Documentation Projet

**Version :** 1.0.0  
**Date :** Décembre 2024  
**Destiné à :** Développeur senior prenant en charge le projet

---

## 📋 Vue d'Ensemble

**PassionAuto2Roues** est une marketplace en ligne spécialisée dans l'achat/vente de véhicules d'occasion, véhicules accidentés, et pièces détachées automobiles. L'application cible les particuliers et les professionnels de l'automobile (concessionnaires, garages, etc.).

### Objectifs Principaux
- 🛒 **Marketplace complète** : Achat/vente de véhicules et pièces
- 👥 **Multi-utilisateurs** : Particuliers, professionnels, administrateurs  
- 💳 **Monétisation** : Abonnements premium, annonces boostées
- ✅ **Vérification** : Système de vérification des comptes professionnels
- 💬 **Communication** : Messagerie intégrée entre acheteurs/vendeurs

---

## 🏗️ Architecture Technique

### Stack Technologique

**Frontend :**
- **React 18** + **TypeScript** 
- **Vite** (bundler et dev server)
- **TailwindCSS** + **Radix UI** (composants)
- **Wouter** (routing client-side)
- **TanStack Query** (state management API)
- **React Hook Form** + **Zod** (validation)

**Backend :**
- **Node.js** + **Express** + **TypeScript**
- **Drizzle ORM** (queries et migrations)
- **PostgreSQL** (base de données principale)
- **Supabase** (auth + storage fichiers)

**Intégrations :**
- **Stripe** (paiements et abonnements)
- **Sharp** (optimisation images)
- **Replit** (hosting et déploiement)

### Architecture Globale
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Client  │────│  Express API    │────│   PostgreSQL    │
│  (Port 5000)    │    │  (Port 5000)    │    │   Database      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │              ┌─────────────────┐    ┌─────────────────┐
         │              │   Supabase      │    │     Stripe      │
         └──────────────│ (Auth/Storage)  │    │   (Payments)    │
                        └─────────────────┘    └─────────────────┘
```

---

## 📁 Structure des Fichiers

### Répertoires Principaux

```
project/
├── client/src/                 # Frontend React
│   ├── components/             # Composants réutilisables
│   │   ├── auth/              # Authentification (UserMenu, etc.)
│   │   ├── dashboard/         # Interface utilisateur (Dashboard, ProfileSection)
│   │   ├── onboarding/        # Processus d'onboarding
│   │   └── ui/                # Composants UI de base (Shadcn)
│   ├── contexts/              # Contextes React (Auth, App)
│   ├── hooks/                 # Hooks personnalisés (useAuth, useMessaging)
│   ├── lib/                   # Utilitaires (Supabase, QueryClient)
│   ├── pages/                 # Pages de l'application
│   ├── services/              # Services (AuthService)
│   ├── types/                 # Types TypeScript
│   └── utils/                 # Utilitaires divers
├── server/                    # Backend Express
│   ├── routes/               # Routes API
│   ├── auth/                 # Logique d'authentification
│   ├── middleware/           # Middlewares Express
│   ├── lib/                  # Utilitaires serveur
│   └── services/             # Services métier
├── shared/                   # Code partagé
│   └── schema.ts             # Schémas Drizzle (base de données)
├── public/                   # Assets statiques
└── scripts/                  # Scripts de maintenance
```

### Fichiers Clés

| Fichier | Description |
|---------|-------------|
| `shared/schema.ts` | **CRITIQUE** - Définition de tous les schémas de base de données |
| `client/src/App.tsx` | Point d'entrée de l'application React |
| `server/index.ts` | Point d'entrée du serveur Express |
| `server/routes.ts` | Définition des routes API principales |
| `client/src/contexts/AuthContext.tsx` | Contexte d'authentification global |
| `client/src/hooks/useAuth.ts` | Hook d'authentification (instance indépendante) |

---

## 🗄️ Base de Données

### Tables Principales

#### **users** - Table unifiée des utilisateurs
```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  type TEXT DEFAULT 'pending', -- 'individual', 'professional', 'pending'
  avatar TEXT,
  phone TEXT,
  whatsapp TEXT,
  profile_completed BOOLEAN DEFAULT false,
  -- Champs métier
  company_name TEXT,
  siret TEXT,
  address TEXT,
  city TEXT,
  postal_code TEXT,
  website TEXT,
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### **annonces** - Annonces de véhicules
```sql
CREATE TABLE annonces (
  id SERIAL PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER NOT NULL,
  price NUMERIC(12,2) NOT NULL,
  location TEXT NOT NULL,
  images JSON DEFAULT '[]',
  is_premium BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### **professional_accounts** - Comptes professionnels
```sql
CREATE TABLE professional_accounts (
  id SERIAL PRIMARY KEY,
  user_id TEXT REFERENCES users(id) UNIQUE,
  company_name TEXT NOT NULL,
  siret TEXT UNIQUE,
  status TEXT DEFAULT 'pending_docs', -- 'pending_docs', 'under_review', 'verified', 'rejected'
  membership TEXT DEFAULT 'free',     -- 'free', 'paid', 'canceled'
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Relations Importantes
- `users` ↔ `professional_accounts` : One-to-One (un utilisateur peut avoir un compte pro)
- `users` ↔ `annonces` : One-to-Many (un utilisateur peut avoir plusieurs annonces)
- `users` ↔ `messages` : Many-to-Many (messagerie entre utilisateurs)

---

## 👥 Types d'Utilisateurs

### 1. **Particuliers** (`type: "individual"`)
- Inscription simple (email + mot de passe)
- Peut publier des annonces basiques
- Accès aux favoris et messagerie
- Interface simplifiée

### 2. **Professionnels** (`type: "professional"`)  
- Processus d'onboarding complexe :
  1. **Profil** : Informations entreprise (nom, SIRET)
  2. **Vérification** : Upload documents (K-bis, etc.)
  3. **Abonnement** : Choix plan payant obligatoire
- Fonctionnalités premium :
  - Badge "Vérifié" 
  - Annonces illimitées
  - Boutique personnalisée (`/pro/{userId}`)
  - Statistics avancées
- États de vérification :
  - `pending_docs` : Documents manquants
  - `under_review` : En cours de vérification
  - `verified` : Compte approuvé
  - `rejected` : Demande refusée

### 3. **Administrateurs**
- Accès au dashboard admin (`/admin-test`)
- Gestion des utilisateurs et annonces
- Modération des contenus
- Email admin : `admin@passionauto2roues.com`

---

## ⚙️ Fonctionnalités Principales

### 🔐 Authentification
- **Supabase Auth** : Login/Register, OAuth Google
- **Dual Auth System** : 
  - `contexts/AuthContext.tsx` : Contexte global partagé
  - `hooks/useAuth.ts` : Hook indépendant (⚠️ peut causer des incohérences)

### 🏠 Marketplace
- **Catégories** : Véhicules, pièces détachées, services
- **Recherche avancée** : Filtres (marque, prix, localisation)
- **Favoris** : System de wishlist
- **Messagerie** : Communication acheteur-vendeur

### 💳 Monétisation  
- **Stripe** : Gestion paiements et abonnements récurrents
- **Plans Premium** : Fonctionnalités avancées pour pros
- **Boost Annonces** : Mise en avant payante

### 📱 Interface
- **Responsive Design** : Mobile-first avec TailwindCSS
- **Dark/Light Mode** : Support thèmes (partiellement implémenté)
- **PWA Ready** : Configuration pour app mobile

---

## 🔧 APIs et Routes

### Routes Principales

| Route | Méthode | Description |
|-------|---------|-------------|
| `/api/auth/*` | Various | Authentification Supabase |
| `/api/users/*` | GET/POST/PUT | Gestion utilisateurs |
| `/api/annonces/*` | GET/POST/PUT/DELETE | CRUD annonces |
| `/api/professional-accounts/*` | GET/POST | Comptes professionnels |
| `/api/subscriptions/*` | GET/POST | Abonnements Stripe |
| `/api/messages/*` | GET/POST | Messagerie |
| `/api/avatar/upload/:id` | POST | Upload avatars/logos |
| `/api/admin/*` | Various | Administration |

### Structure API Response
```typescript
// Success
{
  success: true,
  data: any,
  message?: string
}

// Error  
{
  success: false,
  error: string,
  details?: any
}
```

---

## ⚠️ Points d'Attention

### 🐛 Problèmes Connus

1. **Double Système Auth** 
   - `AuthContext` vs `useAuth` hook créent des incohérences
   - **Solution** : Migrer tout vers `AuthContext`

2. **Gestion Avatar/Logo**
   - Récemment unifié : un seul champ `avatar` pour tous
   - Ancien champ `company_logo` en cours de suppression

3. **Erreurs LSP**
   - 34 erreurs dans `server/storage.ts` (migration en cours)
   - 1 erreur dans `ProfileSection.tsx` (type incorrect)

4. **Onboarding Professionnel**
   - Logique complexe dans `onboardingDetector.ts`
   - Popup peut persister si états incohérents

### 🔒 Sécurité

- **Variables d'environnement** : DATABASE_URL, SUPABASE keys, STRIPE keys
- **CORS** : Configuration restrictive pour production
- **Validation** : Zod schemas côté client ET serveur
- **Rate Limiting** : À implémenter pour les APIs critiques

---

## 🚀 Guide de Développement

### Installation et Setup

```bash
# 1. Cloner et installer
npm install

# 2. Configuration env (créer .env)
DATABASE_URL=postgres://...
VITE_SUPABASE_URL=https://...
VITE_SUPABASE_ANON_KEY=eyJ...
STRIPE_SECRET_KEY=sk_...
VITE_STRIPE_PUBLIC_KEY=pk_...

# 3. Base de données
npm run db:push          # Sync schema 
npm run db:push --force  # Force sync si conflicts

# 4. Développement
npm run dev             # Start both client + server (port 5000)
```

### Workflow de Développement

1. **Schema First** : Modifier `shared/schema.ts` avant tout
2. **Database Sync** : `npm run db:push` après chaque changement schema
3. **Type Safety** : Utiliser les types générés par Drizzle
4. **Components** : Privilégier Radix UI + TailwindCSS
5. **State Management** : TanStack Query pour les données API

### Débogage

```bash
# Logs serveur
console.log("🐛 Debug:", data)

# Logs base de données  
SELECT * FROM users WHERE type = 'professional';

# Logs Supabase
SELECT * FROM auth.users LIMIT 10;

# Test API
curl -X GET "http://localhost:5000/api/users/by-email/test@example.com"
```

---

## 📈 Roadmap et Améliorations

### Priorité Haute
- [ ] Unifier le système d'authentification (AuthContext uniquement)
- [ ] Résoudre les erreurs LSP restantes
- [ ] Stabiliser l'onboarding professionnel
- [ ] Tests unitaires sur les fonctions critiques

### Priorité Moyenne  
- [ ] System de notifications push
- [ ] API mobile (React Native)
- [ ] Analytics et métriques avancées
- [ ] System de chat temps réel (WebSocket)

### Priorité Basse
- [ ] Mode hors-ligne (PWA)
- [ ] Intégration IA pour évaluation véhicules
- [ ] Multi-langues (i18n)

---

## 📞 Support et Contacts

### Ressources Utiles
- **Replit Console** : Logs en temps réel et debugging
- **Supabase Dashboard** : Gestion auth et storage  
- **Stripe Dashboard** : Paiements et abonnements
- **Database** : Interface Replit pour requêtes SQL

### Documentation Technique
- **Drizzle ORM** : https://orm.drizzle.team/
- **TanStack Query** : https://tanstack.com/query/latest
- **Radix UI** : https://www.radix-ui.com/
- **Supabase** : https://supabase.com/docs

---

*Document créé le 22 septembre 2025 - Mettre à jour régulièrement*