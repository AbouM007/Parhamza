# Todo

**A faire**  
📊 Situation actuelle  
Vous avez déjà tout en place :  

✅ Ce qui existe :  
Icône favoris dans le header → renvoie au dashboard section "favorites"
Section favoris avec 2 onglets :  
📄 "Annonces favorites" (favoritesSubTab === "listings")  
🔍 "Recherches enregistrées" (favoritesSubTab === "searches")  

Backend complet :  
Table wishlist ✅  
Routes API favorites ✅  
Hook useFavorites ✅  
Hook useSavedSearches ✅  
💡 Ma recommandation : RÉUTILISER (ne pas réorganiser)
Pourquoi ?  

✅ Structure déjà pensée et cohérente  
✅ Navigation déjà en place (icône header)  
✅ Deux onglets logiques (annonces + recherches)  
✅ Code existant fonctionnel  
Ce qu'on va faire :  

Améliorer l'existant (1-2h max) 🚀  
Onglet "Annonces favorites" :  
✅ Utiliser VehicleCard existant (comme sur la page d'accueil)  
✅ Afficher grille responsive (1 col mobile, 3 cols desktop)  
✅ Message si vide : "Aucun favori - Explorez nos annonces !"  
✅ Bouton coeur rouge qui retire des favoris  
✅ Loader skeleton pendant chargement  
Onglet "Recherches enregistrées" :  
✅ Liste des recherches sauvegardées  
✅ Pour chaque recherche :  
Nom personnalisé  
Filtres résumés (ex: "Voiture - Paris - 5000-10000€")  
Toggle alertes email (🔔 actif/inactif)  
Bouton "Lancer la recherche" → redirige vers /search avec filtres  
Bouton "Supprimer"  
✅ Message si vide : "Aucune recherche sauvegardée"  
🎯 Plan d'action (1-2h)  
Améliorer renderFavoriteListings() (30 min)  

Remplacer le code actuel par grille de VehicleCard  
Ajouter skeleton loader  
Gérer état vide  
Améliorer renderSavedSearches() (45 min)  

Design des cartes de recherche  
Bouton "Lancer recherche" avec redirection  
Toggle alertes  
Suppression  
Tester (15 min)  


🎯 Mon approche :
Je vais créer un système simple et efficace en 5 étapes :

1. Backend (schéma + API)
Ajouter la table followers dans Drizzle (shared/schema.ts)
Créer les routes API pour :
➕ Suivre un vendeur (POST /api/followers)
➖ Ne plus suivre (DELETE /api/followers/:id)
📊 Voir mes vendeurs suivis (GET /api/followers/following)
👥 Voir les followers d'un vendeur (GET /api/followers/:userId)
✅ Vérifier si je suis un vendeur (GET /api/followers/is-following/:userId)
2. Frontend (hook réutilisable)
Hook useFollowers pour gérer toute la logique (comme useFavorites)
Gestion optimiste + invalidation cache
Compteurs en temps réel
3. Bouton "Suivre"
Sur les pages boutique professionnelles uniquement
Design cohérent avec le reste de l'app
États : "Suivre" / "Suivi" avec animation
4. Dashboard - Nouvelle section
Onglet "Vendeurs suivis" dans Dashboard
Liste des pros suivis avec compteur d'annonces actives
Bouton "Voir la boutique" + "Ne plus suivre"
5. Affichage compteur
Badge "X followers" sur pages boutique
Badge "X abonnés" sur profils pros