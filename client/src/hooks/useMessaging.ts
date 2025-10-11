import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export function useMessaging() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Créer ou récupérer une conversation pour un véhicule
  const getOrCreateConversation = async (
    vehicleId: string, 
    sellerId: string, 
    buyerId: string
  ) => {
    try {
      setLoading(true);
      setError(null);

      // Vérifier si une conversation existe déjà
      const { data: existingConversation } = await supabase
        .from('conversations')
        .select('id')
        .eq('vehicle_id', vehicleId)
        .eq('type', 'listing')
        .single();

      if (existingConversation) {
        return existingConversation.id;
      }

      // Créer nouvelle conversation
      const { data: newConversation, error: convError } = await supabase
        .from('conversations')
        .insert({
          vehicle_id: vehicleId,
          type: 'listing',
          last_message_at: new Date().toISOString()
        })
        .select('id')
        .single();

      if (convError) throw convError;

      // Ajouter les participants
      const { error: participantsError } = await supabase
        .from('conversation_participants')
        .insert([
          {
            conversation_id: newConversation.id,
            user_id: sellerId,
            role: 'seller',
            joined_at: new Date().toISOString()
          },
          {
            conversation_id: newConversation.id,
            user_id: buyerId,
            role: 'buyer',
            joined_at: new Date().toISOString()
          }
        ]);

      if (participantsError) throw participantsError;

      return newConversation.id;
    } catch (err) {
      console.error('Erreur création conversation:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Envoyer le premier message d'une conversation
  const startConversation = async (
    vehicleId: string,
    sellerId: string,
    buyerId: string,
    messageContent: string
  ) => {
    try {
      setLoading(true);
      setError(null);

      console.log('🚀 Début startConversation:', { vehicleId, sellerId, buyerId, messageContent });

      // Utiliser l'API simplifiée pour l'envoi de messages
      const response = await fetch('/api/messages-simple/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fromUserId: buyerId,
          toUserId: sellerId,
          content: messageContent,
          vehicleId: vehicleId
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error('❌ Erreur API:', result);
        throw new Error(result.error || 'Erreur envoi message');
      }

      console.log('✅ Message envoyé:', result.messageId);
      return result.messageId;
    } catch (err) {
      console.error('❌ Erreur envoi message:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Envoyer un message dans une conversation existante
  const sendMessage = async (conversationId: string, content: string, currentUserId: string) => {
    try {
      setLoading(true);
      setError(null);

      // Récupérer le token d'authentification
      const { data: { session } } = await supabase.auth.getSession();
      console.log('🔑 Session récupérée:', session ? 'OK' : 'NOK', session?.access_token ? 'Token OK' : 'Pas de token');
      if (!session?.access_token) {
        throw new Error('Session expirée - veuillez vous reconnecter');
      }

      // Extraire les IDs du conversationId (format: vehicleId|user1Id|user2Id)
      const [vehicleId, user1Id, user2Id] = conversationId.split('|');
      
      // Déterminer le destinataire (l'autre utilisateur dans la conversation)
      const recipientId = user1Id === currentUserId ? user2Id : user1Id;
      
      const response = await fetch('/api/messages-simple/send', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          vehicleId: Number(vehicleId),
          recipientId,
          content: content.trim()
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erreur envoi message');
      }

      const result = await response.json();
      console.log('✅ Message envoyé:', result.messageId);
      return result.messageId;
    } catch (err) {
      console.error('Erreur envoi message:', err);
      setError(err instanceof Error ? err.message : 'Erreur envoi message');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    getOrCreateConversation,
    startConversation,
    sendMessage
  };
}