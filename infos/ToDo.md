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