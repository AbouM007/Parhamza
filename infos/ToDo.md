# 🧩 Todo

## **À faire**
### Notification Center  

---

## 🔔 Pourquoi un centre de notifications centralisé est brillant

### ✅ Avantages architecturaux
- **Single Source of Truth**
  - Un seul endroit pour créer une notification  
  - Distribution automatique vers tous les canaux  
- **Traçabilité complète**
  - Historique de toutes les notifications  
  - Statut : `envoyé`, `lu`, `cliqué`  
  - Analytics intégrées  
- **Préférences utilisateur**
  - “Je veux recevoir par email”  
  - “Notifications push seulement”  
  - Granularité par type d’événement  
- **Évolutivité**
  - Ajout facile de nouveaux canaux (SMS, Slack, etc.)  
  - A/B testing sur les messages  
  - Internationalisation centralisée  

---

## 🏗️ Architecture recommandée

```
┌─────────────────────────────────────────┐
│  EVENT (ex: nouveau message reçu)       │
└──────────────┬──────────────────────────┘
               ↓
┌─────────────────────────────────────────┐
│  NOTIFICATION CENTER (Service)          │
│  - Crée notification en DB              │
│  - Vérifie préférences user             │
│  - Dispatch vers canaux activés         │
└──────┬──────┬──────┬───────────────────┘
       ↓      ↓      ↓
   ┌────┐  ┌────┐  ┌─────┐
   │ DB │  │Email│  │Push │
   └────┘  └────┘  └─────┘
     ↓
 Dashboard (badge + liste)
```

---

## 📊 Structure de données

### Table `notifications`

```js
{
  id: string,
  userId: string,                   // Destinataire
  type: 'message' | 'listing_validated' | 'new_follower' | ...,
  title: string,                    // "Nouveau message de Jean"
  message: string,                  // "Vous avez reçu un message concernant..."
  data: json,                       // { listingId: 123, messageId: 456 }
  read: boolean,
  readAt: timestamp,
  channels: ['in-app', 'email', 'push'],  // Où envoyer
  sentChannels: ['in-app'],               // Où effectivement envoyé
  createdAt: timestamp
}
```

### Table `notification_preferences`

```js
{
  userId: string,
  notificationType: 'message' | 'listing' | 'follower',
  enableInApp: boolean,
  enableEmail: boolean,
  enablePush: boolean
}
```

---

## 🎯 Cas d’usage concrets

### Exemple 1 : Nouveau message reçu

```js
await notificationCenter.create({
  userId: recipientId,
  type: 'new_message',
  title: 'Nouveau message de {senderName}',
  message: 'Concernant: {listingTitle}',
  data: { messageId, listingId, senderId },
  channels: ['in-app', 'email', 'push']
});
```

**Le centre gère automatiquement :**
- ✅ Sauvegarde en DB  
- ✅ Envoi email si activé  
- ✅ Push notification si activé  
- ✅ Badge dans dashboard  

---

### Exemple 2 : Annonce validée

```js
await notificationCenter.create({
  userId: sellerId,
  type: 'listing_validated',
  title: 'Votre annonce est en ligne !',
  message: '{listingTitle} est maintenant visible',
  data: { listingId },
  channels: ['in-app', 'email']  // Pas de push ici
});
```

---

## 📋 Types de notifications pour **PassionAuto2Roues**

### **Messages 🔥 (Priorité haute)**
- `new_message` — Nouveau message reçu  
- `message_reply` — Réponse à votre message  

### **Annonces 📝 (Important)**
- `listing_validated` — Annonce approuvée  
- `listing_rejected` — Annonce rejetée  
- `listing_favorited` — Quelqu’un a mis en favori  
- `listing_expiring` — Annonce expire bientôt  

### **Social 👥 (Engagement)**
- `new_follower` — Nouveau follower (pros)  
- `followed_new_listing` — Vendeur suivi publie une annonce  

### **Paiements 💰 (Critique)**
- `payment_success` — Paiement réussi  
- `payment_failed` — Paiement échoué  
- `subscription_ending` — Abonnement expirant  

---

## 🚀 Plan d’implémentation

### **Phase 1 : Infrastructure (MVP) ✅**
1. Tables DB (`notifications` + `preferences`)  
2. Service `NotificationCenter`  
3. Affichage in-app (badge + dropdown dashboard)  
4. Emails via templates existants  

### **Phase 2 : Préférences**
1. Page paramètres utilisateur  
2. Toggle par type de notification  
3. “Recevoir par email” / “In-app seulement”  

### **Phase 3 : Push (futur mobile)**
1. Web Push API (PWA)  
2. Service Worker  
3. OneSignal / FCM pour mobile natif  

---

## 💡 Avantages immédiats

### ✅ Pour les utilisateurs
- Historique complet des notifications  
- Contrôle sur le mode de réception  
- Badge “3 nouvelles notifications”  

### ✅ Pour les développeurs
- Code centralisé = maintenance facile  
- Analytics natives (“qui lit quoi ?”)  
- A/B testing possible  

### ✅ Pour l’évolution
- Ajout de SMS en 10 lignes  
- Notifications groupées (“5 nouveaux messages”)  
- Digest quotidien / hebdomadaire  

---

## ✨ Recommandation finale

> Créez **le centre de notifications avant les templates emails** :  
> - C’est la **fondation** du système.  
> - Les emails deviennent un simple “canal”.  
> - La migration est ensuite **simple et scalable** :  
>   `existants → centre → multi-canal`.

============================================

📋 Plan d'implémentation - Todo List  
Voici les étapes que je vais suivre pour implémenter le centre de notifications complet :  

Phase 1 : Infrastructure (Base)  
Créer le schéma DB - Tables notifications et notification_preferences dans shared/schema.ts  
Créer les types - Fichier shared/notificationTypes.ts avec tous les types de notifications  
Migration DB - Exécuter npm run db:push pour créer les tables  
Service central - Créer server/services/notificationCenter.ts avec logique de création et dispatch  

Phase 2 : API Routes  
Routes notifications - GET/POST/PATCH dans server/routes.ts pour gérer les notifications  
Routes préférences - GET/PUT pour les préférences utilisateur par type  

Phase 3 : UI Dashboard  
Composant NotificationCenter - Badge + dropdown avec liste des notifications
Hook useNotifications - React Query pour fetch et mutations  
Marquer comme lu - Clic sur notification → readAt + navigation  
Badge compteur - Afficher nombre de non-lus dans header  

Phase 4 : Intégration Email  
Connecter emailService - Le centre appelle emailService selon template du type  
Mapper types → templates - new_message → messaging/new_message.html  


Phase 5 : Événements déclencheurs  
Messages - Créer notification lors d'un nouveau message  
Annonces - Notification lors validation/rejet d'annonce  
Followers - Notification nouveau follower pour pros  
Paiements - Notifications succès/échec paiement  

Phase 6 : Page Préférences  
UI Préférences - Toggle par type de notification dans paramètres compte  
Sauvegarde préférences - Mutation pour update en DB  

Phase 7 : Optimisations  
Polling/WebSocket - Notifications temps réel (optionnel)  
Nettoyage auto - Supprimer notifications > 30 jours (optionnel)  
