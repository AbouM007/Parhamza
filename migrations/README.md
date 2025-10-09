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

**Objectif :** Créer la table `vehicle_views` pour tracker les vues uniques par véhicule.

**Description :**
- Crée une table pour enregistrer les vues de véhicules
- Chaque vue est unique par utilisateur (userId) ou par adresse IP (pour les anonymes)
- Ajoute des index pour optimiser les requêtes
- Empêche les doublons avec des contraintes UNIQUE

**Cette migration est requise pour :**
- Le système de compteur de vues
- Le tracking des vues uniques par utilisateur/IP
- L'affichage du nombre de vues sur les cartes de véhicules

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
