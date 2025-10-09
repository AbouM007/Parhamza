# Database Migrations

Ce dossier contient les scripts de migration SQL pour la base de données Supabase.

## Comment exécuter une migration

1. Connectez-vous à votre console Supabase : https://supabase.com/dashboard
2. Accédez à votre projet
3. Allez dans l'onglet **SQL Editor**
4. Copiez le contenu du fichier SQL de migration souhaité
5. Collez-le dans l'éditeur SQL
6. Cliquez sur **Run** pour exécuter la migration

## Migrations disponibles

### 001_create_vehicle_views_table.sql

**Objectif :** Créer la table `vehicle_views` et les fonctions RPC pour tracker les vues et favoris.

**Description - Partie 1 (Table et contraintes) :**
- Crée la table `vehicle_views` pour enregistrer les vues de véhicules
- Contraintes uniques partielles :
  - Utilisateurs connectés : (user_id, vehicle_id) WHERE user_id IS NOT NULL
  - Utilisateurs anonymes : (ip_address, vehicle_id) WHERE ip_address IS NOT NULL AND user_id IS NULL
- Index pour optimiser les requêtes
- Empêche les doublons au niveau base de données

**Description - Partie 2 (Fonctions RPC atomiques) :**
- `increment_vehicle_views(p_vehicle_id TEXT)` : Incrémente atomiquement le compteur de vues
- `increment_vehicle_favorites(p_vehicle_id TEXT)` : Incrémente atomiquement le compteur de favoris
- `decrement_vehicle_favorites(p_vehicle_id TEXT)` : Décrémente atomiquement le compteur de favoris (min 0)
- Garantit la cohérence des compteurs même sous forte concurrence

**Cette migration est requise pour :**
- Le système de compteur de vues avec tracking unique
- Le système de compteur de favoris
- L'affichage des statistiques (vues/favoris) sur les cartes de véhicules
- La prévention des incrémentations multiples sous concurrence

## Notes importantes

- Exécutez les migrations dans l'ordre numérique (001, 002, etc.)
- Ne modifiez pas les migrations déjà exécutées
- Sauvegardez toujours votre base avant d'exécuter une migration

## Vérification

Après avoir exécuté la migration 001, vous pouvez vérifier que la table a été créée avec cette requête :

```sql
SELECT * FROM vehicle_views LIMIT 1;
```

Si la requête fonctionne sans erreur, la migration a réussi.
