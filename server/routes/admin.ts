import { Router } from 'express';
import { supabase } from '../lib/supabase';
import { db } from '../db';
import { sql } from 'drizzle-orm';
import { notifyListingValidated, notifyListingRejected } from '../services/notificationCenter';

const router = Router();

// Middleware pour vérifier les droits admin
const requireAdmin = async (req: any, res: any, next: any) => {
  const userEmail = req.headers['x-user-email'];
  
  console.log('🔐 Vérification admin pour:', userEmail);
  
  if (!userEmail) {
    console.log('❌ Pas d\'email dans headers');
    return res.status(401).json({ error: 'Non authentifié' });
  }

  try {
    // Vérifier si l'utilisateur est admin
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('email', userEmail)
      .single();

    console.log('👤 User trouvé:', user?.id);

    if (!user) {
      console.log('❌ Utilisateur non trouvé dans DB');
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    const { data: admin, error: adminError } = await supabase
      .from('admins')
      .select('*')
      .eq('user_id', user.id)
      .single();

    console.log('🛡️ Admin trouvé:', admin?.id, 'erreur:', adminError);

    if (!admin) {
      console.log('❌ Pas de droits admin pour:', userEmail);
      return res.status(403).json({ error: 'Accès refusé - Droits administrateur requis' });
    }

    console.log('✅ Admin vérifié:', admin.role);
    (req as any).admin = admin;
    (req as any).userId = user.id;
    next();
  } catch (error) {
    console.error('Erreur vérification admin:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// GET /api/admin/users - Récupérer tous les utilisateurs
router.get('/users', requireAdmin, async (req, res) => {
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json(users);
  } catch (error) {
    console.error('Erreur récupération utilisateurs:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des utilisateurs' });
  }
});

// GET /api/admin/annonces - Récupérer toutes les annonces
router.get('/annonces', requireAdmin, async (req, res) => {
  try {
    const { data: annonces, error } = await supabase
      .from('annonces')
      .select(`
        *,
        users:user_id (
          id,
          name,
          email
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Transformer pour correspondre au format attendu
    const formattedAnnonces = annonces.map(annonce => ({
      id: annonce.id,
      title: annonce.title,
      price: annonce.price,
      status: annonce.status || 'active',
      createdAt: annonce.created_at,
      user: Array.isArray(annonce.users) ? annonce.users[0] : annonce.users
    }));

    res.json(formattedAnnonces);
  } catch (error) {
    console.error('Erreur récupération annonces:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des annonces' });
  }
});

// PATCH /api/admin/users/:id - Actions sur les utilisateurs
router.patch('/users/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { action } = req.body;

  try {
    let updateData: any = {};

    switch (action) {
      case 'activate':
        updateData = { verified: true };
        break;
      case 'suspend':
        updateData = { verified: false };
        break;
      default:
        return res.status(400).json({ error: 'Action non reconnue' });
    }

    const { error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', id);

    if (error) throw error;

    // Log de l'action admin
    await supabase
      .from('admin_logs')
      .insert({
        admin_user_id: (req as any).userId,
        action: `user_${action}`,
        target_type: 'user',
        target_id: id,
        details: { action, timestamp: new Date().toISOString() }
      });

    res.json({ success: true, message: `Utilisateur ${action === 'activate' ? 'activé' : 'suspendu'}` });
  } catch (error) {
    console.error('Erreur action utilisateur:', error);
    res.status(500).json({ error: 'Erreur lors de l\'action sur l\'utilisateur' });
  }
});

// PATCH /api/admin/annonces/:id - Actions sur les annonces
router.patch('/annonces/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { action } = req.body;

  try {
    let updateData: any = {};

    switch (action) {
      case 'approve':
        updateData = { status: 'active' };
        break;
      case 'reject':
      case 'suspend':
        updateData = { status: 'suspended' };
        break;
      default:
        return res.status(400).json({ error: 'Action non reconnue' });
    }

    // Récupérer les informations de l'annonce avant la mise à jour
    const { data: annonce } = await supabase
      .from('annonces')
      .select('id, title, user_id')
      .eq('id', id)
      .single();

    const { error } = await supabase
      .from('annonces')
      .update(updateData)
      .eq('id', id);

    if (error) throw error;

    // 🔔 Envoyer une notification au propriétaire de l'annonce
    if (annonce) {
      try {
        if (action === 'approve') {
          await notifyListingValidated({
            userId: annonce.user_id,
            listingId: parseInt(annonce.id),
            listingTitle: annonce.title,
          });
        } else if (action === 'reject') {
          await notifyListingRejected({
            userId: annonce.user_id,
            listingId: parseInt(annonce.id),
            listingTitle: annonce.title,
            reason: req.body.reason || 'Non conforme aux conditions',
          });
        }
      } catch (notifError) {
        console.error('Erreur envoi notification annonce:', notifError);
        // Ne pas bloquer l'action admin si la notification échoue
      }
    }

    // Log de l'action admin
    await supabase
      .from('admin_logs')
      .insert({
        admin_user_id: (req as any).userId,
        action: `annonce_${action}`,
        target_type: 'annonce',
        target_id: id,
        details: { action, timestamp: new Date().toISOString() }
      });

    res.json({ success: true, message: `Annonce ${action === 'approve' ? 'approuvée' : 'suspendue'}` });
  } catch (error) {
    console.error('Erreur action annonce:', error);
    res.status(500).json({ error: 'Erreur lors de l\'action sur l\'annonce' });
  }
});

// GET /api/admin/subscriptions - Lister tous les abonnements (VERSION DEBUG ULTRA SIMPLE)
router.get('/subscriptions', async (req, res) => {
  try {
    console.log('🔍 [DEBUG] Test basique table subscriptions...');
    
    // Test super basique : compter les lignes
    const { count, error: countError } = await supabase
      .from('subscriptions')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('❌ Erreur comptage:', countError);
      return res.status(500).json({ error: 'Erreur table subscriptions', details: countError });
    }

    console.log(`📊 ${count} abonnements trouvés dans la table`);
    
    // Si comptage OK, essayons de récupérer les données
    const { data: subscriptions, error } = await supabase
      .from('subscriptions')
      .select('*')
      .limit(10);

    if (error) {
      console.error('❌ Erreur récupération données:', error);
      return res.status(500).json({ error: 'Erreur récupération données', details: error });
    }

    console.log(`✅ Données récupérées:`, subscriptions);
    res.json({ 
      count, 
      subscriptions: subscriptions || [],
      message: "Route admin subscriptions fonctionnelle !" 
    });
  } catch (error) {
    console.error('❌ Erreur générale:', error);
    res.status(500).json({ error: 'Erreur serveur', details: error.message });
  }
});

// GET /api/admin/stats - Statistiques pour le dashboard
router.get('/stats', requireAdmin, async (req, res) => {
  try {
    const [
      { count: totalUsers },
      { count: totalAnnonces },
      { count: pendingReports }
    ] = await Promise.all([
      supabase.from('users').select('*', { count: 'exact', head: true }),
      supabase.from('annonces').select('*', { count: 'exact', head: true }),
      supabase.from('reports').select('*', { count: 'exact', head: true }).eq('status', 'pending')
    ]);

    res.json({
      totalUsers: totalUsers || 0,
      totalAnnonces: totalAnnonces || 0,
      pendingReports: pendingReports || 0,
      monthlyGrowth: 12 // Placeholder - calculer réellement
    });
  } catch (error) {
    console.error('Erreur récupération stats:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des statistiques' });
  }
});

// GET /api/admin/run-notification-migration - Exécuter la migration des notifications (temporaire)
router.get('/run-notification-migration', requireAdmin, async (req, res) => {
  try {
    console.log('🔄 Début migration tables notifications...');
    
    // Créer la table notifications
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        data JSONB,
        read BOOLEAN NOT NULL DEFAULT false,
        read_at TIMESTAMP,
        channels JSONB NOT NULL DEFAULT '["in-app"]',
        sent_channels JSONB NOT NULL DEFAULT '["in-app"]',
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    console.log('✅ Table notifications créée');

    // Créer la table notification_preferences
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS notification_preferences (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        notification_type VARCHAR(50) NOT NULL,
        enable_in_app BOOLEAN NOT NULL DEFAULT true,
        enable_email BOOLEAN NOT NULL DEFAULT true,
        enable_push BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        CONSTRAINT unique_user_type UNIQUE (user_id, notification_type)
      )
    `);
    console.log('✅ Table notification_preferences créée');

    // Créer les index
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_id ON notification_preferences(user_id)`);
    console.log('✅ Index créés');

    console.log('✅ Migration terminée avec succès');
    res.json({ 
      success: true, 
      message: 'Tables notifications créées avec succès' 
    });
  } catch (error: any) {
    console.error('❌ Erreur migration:', error);
    res.status(500).json({ 
      error: 'Erreur serveur', 
      details: error?.message || 'Erreur inconnue'
    });
  }
});

export default router;