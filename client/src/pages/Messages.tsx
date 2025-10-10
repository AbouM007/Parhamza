import { useState, useEffect, useRef } from "react";
import { MessageCircle, Send, User, ArrowLeft, Clock } from "lucide-react";
import { useMessaging } from "@/hooks/useMessaging";
import { useAuth } from "@/contexts/AuthContext";
import { getUserDisplayName } from "@/lib/utils";

interface Conversation {
  id: string;
  vehicle_id: string;
  vehicle_title: string;
  other_user: {
    id: string;
    name: string;
    displayName?: string;
    email: string;
    avatar?: string;
    type?: "individual" | "professional" | "pending";
    companyName?: string;
  };
  last_message_at: string;
  last_message: string;
  unread_count: number;
  messages?: Message[];
}

interface Message {
  id: string;
  content: string;
  sender_id: string;
  sender_name: string;
  created_at: string;
  is_from_current_user?: boolean;
}

export function Messages() {
  const [selectedConversation, setSelectedConversation] = useState<
    string | null
  >(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const { sendMessage } = useMessaging();
  const { profile, loading: authLoading } = useAuth();

  // Ref pour le scroll automatique vers le bas
  const endRef = useRef<HTMLDivElement>(null);

  // Si pas d'utilisateur connecté, ne pas définir currentUserId
  const currentUserId = profile?.id?.toString();

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation);
    }
  }, [selectedConversation]);

  // Fonction pour gérer le clic sur une conversation
  const handleConversationClick = (conversationId: string) => {
    // Si on clique sur la conversation déjà sélectionnée, forcer le rechargement
    if (selectedConversation === conversationId) {
      console.log("♻️ Rechargement de la conversation déjà ouverte");
      loadMessages(conversationId);
    } else {
      // Sinon, simplement changer la sélection (le useEffect se déclenchera)
      setSelectedConversation(conversationId);
    }
  };

  // Scroll automatique vers le bas à chaque mise à jour des messages
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadConversations = async () => {
    // Ne pas charger si pas d'utilisateur connecté
    if (!currentUserId) {
      setLoading(false);
      return;
    }

    try {
      console.log(
        "📬 Chargement conversations pour utilisateur:",
        currentUserId,
      );

      const response = await fetch(
        `/api/messages-simple/user/${currentUserId}`,
      );

      if (response.ok) {
        const data = await response.json();
        console.log(
          "✅ Conversations reçues:",
          data.conversations?.length || 0,
        );
        setConversations(data.conversations || []);
      } else {
        console.error("❌ Erreur réponse conversations:", response.status);
      }
    } catch (error) {
      console.error("❌ Erreur chargement conversations:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (conversationId: string) => {
    try {
      console.log("💬 Chargement messages pour conversation:", conversationId);

      if (!currentUserId) {
        console.error("❌ Pas d'utilisateur connecté");
        setMessages([]);
        return;
      }

      // Parser l'ID de conversation pour obtenir vehicleId et otherUserId
      // Format: "vehicleId-userId1-userId2"
      const [vehicleId, userId1, userId2] = conversationId.split("-");
      const otherUserId = userId1 === currentUserId ? userId2 : userId1;

      console.log("📡 Chargement depuis API:", { vehicleId, currentUserId, otherUserId });

      // Charger les messages via l'API pour toujours avoir les données fraîches
      const response = await fetch("/api/messages-simple/conversation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vehicleId: parseInt(vehicleId),
          user1Id: currentUserId,
          user2Id: otherUserId,
        }),
      });

      if (response.ok) {
        const messagesData = await response.json();
        console.log("✅ Messages reçus de l'API:", messagesData.length);

        // Récupérer les conversations fraîches pour obtenir le nom
        const conversationsResponse = await fetch(
          `/api/messages-simple/user/${currentUserId}`,
        );
        let otherUserName = "Autre utilisateur";
        
        if (conversationsResponse.ok) {
          const conversationsData = await conversationsResponse.json();
          const currentConv = conversationsData.conversations?.find(
            (c: Conversation) => c.id === conversationId
          );
          if (currentConv) {
            otherUserName = getUserDisplayName(currentConv.other_user as any);
          }
        }

        // Convertir les messages au bon format
        const formattedMessages = messagesData.map((msg: any) => ({
          id: msg.id,
          content: msg.content,
          sender_id: msg.from_user_id,
          sender_name: msg.from_user_id === currentUserId
            ? "Vous"
            : otherUserName,
          created_at: msg.created_at || new Date().toISOString(),
        }));

        setMessages(formattedMessages);
        console.log("✅ Messages formatés chargés:", formattedMessages.length);

        // Marquer les messages comme lus
        const unreadMessageIds = messagesData
          .filter((msg: any) => msg.to_user_id === currentUserId && !msg.read)
          .map((msg: any) => msg.id);

        if (unreadMessageIds.length > 0) {
          fetch("/api/messages-simple/mark-read", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              messageIds: unreadMessageIds,
              userId: currentUserId,
            }),
          });
          // Recharger la liste des conversations après avoir marqué comme lu
          loadConversations();
        }
      } else {
        console.error("❌ Erreur chargement messages:", response.status);
        setMessages([]);
      }
    } catch (error) {
      console.error("Erreur chargement messages:", error);
      setMessages([]);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !currentUserId) return;

    const messageId = await sendMessage(selectedConversation, newMessage);

    if (messageId) {
      setNewMessage("");
      loadMessages(selectedConversation);
      loadConversations(); // Mettre à jour la liste des conversations
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffHours = Math.abs(now.getTime() - date.getTime()) / 36e5;

    if (diffHours < 24) {
      return date.toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else {
      return date.toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
      });
    }
  };

  // Écran de chargement pendant l'authentification
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <MessageCircle className="h-12 w-12 text-teal-600 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600 dark:text-gray-400">
            Vérification de l'authentification...
          </p>
        </div>
      </div>
    );
  }

  // Écran de connexion si pas d'utilisateur connecté
  if (!profile || !currentUserId) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <MessageCircle className="h-16 w-16 text-gray-400 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Connexion requise
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Vous devez être connecté pour accéder à vos messages.
          </p>
          <button
            onClick={() => (window.location.href = "/auth")}
            className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            Se connecter
          </button>
        </div>
      </div>
    );
  }

  // Écran de chargement des conversations
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <MessageCircle className="h-12 w-12 text-teal-600 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600 dark:text-gray-400">
            Chargement des messages...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-900 pb-8">
      <div className="max-w-6xl mx-auto md:py-8 md:px-4">
        <div className="bg-white dark:bg-gray-800 md:rounded-lg md:shadow-lg overflow-hidden">
          <div className="flex h-[calc(100vh-200px)] md:h-[600px]">
            {/* Liste des conversations */}
            <div
              className={`w-full md:w-1/3 border-r border-gray-200 dark:border-gray-700 ${selectedConversation ? "hidden md:block" : ""}`}
            >
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <MessageCircle className="h-5 w-5 text-teal-600" />
                  Messages
                </h2>
              </div>

              <div className="overflow-y-auto h-full">
                {conversations.length === 0 ? (
                  <div className="p-6 text-center">
                    <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">
                      Aucune conversation
                    </p>
                    <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                      Contactez un vendeur pour commencer une conversation
                    </p>
                  </div>
                ) : (
                  conversations.map((conversation) => (
                    <div
                      key={conversation.id}
                      onClick={() => handleConversationClick(conversation.id)}
                      className={`p-4 border-b border-gray-100 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 ${
                        selectedConversation === conversation.id
                          ? "bg-teal-50 dark:bg-teal-900/20"
                          : ""
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center overflow-hidden">
                          {conversation.other_user.avatar ? (
                            <img
                              src={conversation.other_user.avatar}
                              alt={getUserDisplayName(conversation.other_user as any)}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-gray-600 dark:text-gray-300 font-semibold text-sm">
                              {getUserDisplayName(conversation.other_user as any)
                                .charAt(0)
                                .toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-sm truncate">
                              {getUserDisplayName(conversation.other_user as any)}
                            </p>
                            <span className="text-xs text-gray-500">
                              {formatDate(conversation.last_message_at)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                            {conversation.vehicle_title}
                          </p>
                          {conversation.unread_count > 0 && (
                            <span className="inline-block mt-1 px-2 py-1 text-xs bg-teal-600 text-white rounded-full">
                              {conversation.unread_count}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Zone de messages */}
            <div
              className={`flex-1 flex flex-col ${!selectedConversation ? "hidden md:flex" : ""}`}
            >
              {selectedConversation ? (
                (() => {
                  const conv = conversations.find(
                    (c) => c.id === selectedConversation,
                  );
                  return (
                    <>
                      {/* En-tête de la conversation */}
                      <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => setSelectedConversation(null)}
                            className="md:hidden p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                          >
                            <ArrowLeft className="h-5 w-5" />
                          </button>
                          <div className="w-10 h-10 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center overflow-hidden">
                            {conv?.other_user.avatar ? (
                              <img
                                src={conv.other_user.avatar}
                                alt={getUserDisplayName(conv.other_user as any)}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-gray-600 dark:text-gray-300 font-semibold text-sm">
                                {getUserDisplayName(conv?.other_user as any).charAt(0).toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div>
                            <p className="font-medium">
                              {getUserDisplayName(conv?.other_user as any)}
                            </p>
                            <p className="text-sm text-gray-500">
                              {conv?.vehicle_title}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Messages */}
                      <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {messages.map((message) => {
                          const isCurrentUser =
                            message.sender_id === currentUserId;
                          const senderAvatar = isCurrentUser
                            ? profile?.avatar
                            : conv?.other_user?.avatar;
                          const senderName = isCurrentUser
                            ? (profile ? getUserDisplayName(profile) : "Vous")
                            : (conv?.other_user ? getUserDisplayName(conv.other_user as any) : "Utilisateur");
                          const senderInitial =
                            senderName?.charAt(0)?.toUpperCase() || "U";

                          return (
                            <div
                              key={message.id}
                              className={`flex ${isCurrentUser ? "justify-end" : "justify-start"}`}
                            >
                              {!isCurrentUser && (
                                <div className="w-8 h-8 rounded-full flex items-center justify-center mr-2 flex-shrink-0 overflow-hidden bg-gray-300">
                                  {senderAvatar ? (
                                    <img
                                      src={senderAvatar}
                                      alt={senderName}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <span className="text-gray-600 font-semibold text-sm">
                                      {senderInitial}
                                    </span>
                                  )}
                                </div>
                              )}

                              <div
                                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                                  isCurrentUser
                                    ? "bg-teal-600 text-white"
                                    : "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                }`}
                              >
                                <p className="text-sm">{message.content}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <Clock className="h-3 w-3 opacity-70" />
                                  <span className="text-xs opacity-70">
                                    {formatDate(message.created_at)}
                                  </span>
                                </div>
                              </div>

                              {isCurrentUser && (
                                <div className="w-8 h-8 rounded-full flex items-center justify-center ml-2 flex-shrink-0 overflow-hidden bg-teal-100">
                                  {senderAvatar ? (
                                    <img
                                      src={senderAvatar}
                                      alt={senderName}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <span className="text-teal-700 font-semibold text-sm">
                                      {senderInitial}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                        {/* Référence pour le scroll automatique */}
                        <div ref={endRef} />
                      </div>

                      {/* Zone d'envoi */}
                      <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyDown={(e) =>
                              e.key === "Enter" && handleSendMessage()
                            }
                            placeholder="Tapez votre message..."
                            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                          />
                          <button
                            onClick={handleSendMessage}
                            disabled={!newMessage.trim()}
                            className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                          >
                            <Send className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </>
                  );
                })()
              ) : (
                <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                  <div className="text-center">
                    <MessageCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                      Sélectionnez une conversation
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400">
                      Choisissez une conversation dans la liste pour commencer à
                      échanger
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
