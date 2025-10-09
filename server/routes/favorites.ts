import { Router } from 'express';
import { storage } from '../storage';
import crypto from 'crypto';

const router = Router();

// Récupérer les favoris d'un utilisateur
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    console.log('🔄 Récupération favoris pour utilisateur:', userId);
    
    // Utiliser la nouvelle méthode getUserFavorites qui fait le JOIN
    const favorites = await storage.getUserFavorites(userId);

    console.log('✅ Favoris récupérés:', favorites.length);
    res.setHeader("Cache-Control", "no-store");
    res.json(favorites);
    
  } catch (error) {
    console.error('❌ Erreur serveur favoris:', error);
    console.error('❌ Stack trace:', error.stack);
    console.error('❌ Message détaillé:', error.message);
    res.status(500).json({ error: 'Erreur serveur', details: error.message });
  }
});

// Ajouter un véhicule aux favoris
router.post('/add', async (req, res) => {
  try {
    const { userId, vehicleId } = req.body;
    
    console.log('🔄 Ajout favori:', { userId, vehicleId });
    
    const wishlistItem = {
      id: crypto.randomUUID(),
      userId,
      vehicleId
    };
    const result = await storage.addToWishlist(wishlistItem);
    
    // Incrémenter le compteur de favoris
    await storage.incrementFavoriteCount(vehicleId.toString());

    console.log('✅ Favori ajouté et compteur incrémenté');
    res.json({ success: true, id: result.id });
    
  } catch (error) {
    console.error('❌ Erreur serveur ajout favori:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Supprimer un véhicule des favoris
router.delete('/remove', async (req, res) => {
  try {
    const { userId, vehicleId } = req.body;
    
    console.log('🔄 Suppression favori:', { userId, vehicleId });
    
    await storage.removeFromWishlist(userId, vehicleId);
    
    // Décrémenter le compteur de favoris
    await storage.decrementFavoriteCount(vehicleId.toString());

    console.log('✅ Favori supprimé et compteur décrémenté');
    res.json({ success: true });
    
  } catch (error) {
    console.error('❌ Erreur serveur suppression favori:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;