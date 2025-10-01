import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export function useUnreadMessages() {
  const [unreadCount, setUnreadCount] = useState(0);
  const { profile } = useAuth();

  const fetchUnreadCount = useCallback(async () => {
    if (!profile?.id) {
      setUnreadCount(0);
      return;
    }

    try {
      const response = await fetch(`/api/messages-simple/user/${profile.id}`);
      if (response.ok) {
        const data = await response.json();
        const conversations = data.conversations || [];
        
        // Compter les messages non lus dans toutes les conversations
        const totalUnread = conversations.reduce((total: number, conv: any) => {
          return total + (conv.unread_count || 0);
        }, 0);
        
        setUnreadCount(totalUnread);
      }
    } catch (error) {
      console.error('Erreur lors du comptage des messages non lus:', error);
      setUnreadCount(0);
    }
  }, [profile?.id]);

  useEffect(() => {
    fetchUnreadCount();
    
    // Actualiser le compteur toutes les 30 secondes
    const interval = setInterval(fetchUnreadCount, 30000);
    
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  // Retourner également la fonction de rechargement pour permettre l'actualisation manuelle
  return { unreadCount, refreshUnreadCount: fetchUnreadCount };
}