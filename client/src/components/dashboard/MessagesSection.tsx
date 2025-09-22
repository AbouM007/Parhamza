// client/src/components/dashboard/MessagesSection.tsx
import React from "react";
import { MessageCircle, ArrowLeft } from "lucide-react";
import { useDashboardMessages } from "@/hooks/useDashboardMessages";

interface MessagesSectionProps {
  loadingMessages: boolean;
  dashboardConversations: any[];
  selectedConversation: any;
  setSelectedConversation: (conv: any) => void;
  setActiveTab: (tab: string) => void;
  newMessage: string;
  setNewMessage: (msg: string) => void;
  sendingMessage: boolean;
  handleSendMessage: () => void;
}

export default function MessagesSection({
  loadingMessages,
  dashboardConversations,
  selectedConversation,
  setSelectedConversation,
  setActiveTab,
  newMessage,
  setNewMessage,
  sendingMessage,
  handleSendMessage,
}: MessagesSectionProps) {
  if (loadingMessages) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <MessageCircle className="h-12 w-12 text-teal-600 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">Chargement des messages...</p>
        </div>
      </div>
    );
  }

  // Préparation des conversations
  const messages = dashboardConversations.map((conv: any) => {
    const other = conv.other_user || {};
    const avatarUrl =
      other.avatar ||
      (other.type === "professional" ? other.company_logo : null);

    const initials = (other.name || "")
      .trim()
      .split(/\s+/)
      .map((n: string) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

    return {
      id: conv.id,
      fromUser: other.name,
      userType: other.type || "individual",
      vehicleTitle: conv.vehicle_title,
      vehicleId: conv.vehicle_id,
      otherUserId: conv.other_user_id || other.id,
      lastMessage: conv.last_message,
      timestamp: new Date(conv.last_message_at || new Date()),
      unread: conv.unread_count > 0,
      avatarUrl,
      initials,
      messages: [],
    };
  });

  const currentConversation = dashboardConversations[0]
    ? (() => {
        const c = dashboardConversations[0];
        const other = c.other_user || {};
        const avatarUrl =
          other.avatar ||
          (other.type === "professional" ? other.company_logo : null);
        const initials = (other.name || "")
          .trim()
          .split(/\s+/)
          .map((n: string) => n[0])
          .join("")
          .slice(0, 2)
          .toUpperCase();

        return {
          id: c.id,
          fromUser: other.name,
          userType: other.type || "individual",
          vehicleTitle: c.vehicle_title,
          vehicleId: c.vehicle_id,
          otherUserId: c.other_user_id || other.id,
          avatarUrl,
          initials,
          messages: [],
        };
      })()
    : null;

  const activeConversation = selectedConversation || currentConversation;

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Messages</h1>
          <p className="text-gray-600 mt-2 text-lg">
            Gérez vos conversations !
          </p>
        </div>
        <div>
          <button
            type="button"
            onClick={() => setActiveTab("overview")}
            className="inline-flex items-center px-5 py-3 rounded-xl border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400 text-sm font-semibold shadow-sm transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            <span>Retour au tableau de bord</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 min-h-[500px] max-h-[calc(100vh-300px)] mb-8">
        {/* Liste des conversations */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Conversations</h2>
          </div>
          <div className="overflow-y-auto">
            {messages.length === 0 ? (
              <div className="p-6 text-center">
                <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Aucune conversation</p>
                <p className="text-sm text-gray-400 mt-2">
                  Les messages des acheteurs apparaîtront ici
                </p>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  onClick={() => setSelectedConversation(message)}
                  className={`p-6 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors ${
                    activeConversation?.id === message.id
                      ? "bg-primary-bolt-50 border-r-4 border-r-primary-bolt-500"
                      : ""
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    {/* Avatar */}
                    <div className="w-12 h-12 rounded-full overflow-hidden border border-gray-200">
                      {message.avatarUrl ? (
                        <img
                          src={message.avatarUrl}
                          alt={message.fromUser}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-r from-primary-bolt-500 to-primary-bolt-600 flex items-center justify-center text-white font-semibold">
                          {message.initials}
                        </div>
                      )}
                    </div>

                    {/* Infos conversation */}
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-semibold text-gray-900">
                            {message.fromUser}
                          </h3>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              message.userType === "professional"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {message.userType === "professional"
                              ? "Pro"
                              : "Part."}
                          </span>
                        </div>
                        {message.unread && (
                          <div className="w-3 h-3 bg-primary-bolt-500 rounded-full"></div>
                        )}
                      </div>
                      <a
                        href={`/?vehicle=${message.vehicleId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-gray-600 mb-1 hover:underline block"
                      >
                        📝 {message.vehicleTitle}
                      </a>
                      <p className="text-xs text-gray-400 mt-1">
                        {message.timestamp.toLocaleDateString("fr-FR")} à{" "}
                        {message.timestamp.toLocaleTimeString("fr-FR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Zone de conversation */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-lg border border-gray-100 flex flex-col">
          {activeConversation ? (
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-primary-bolt-50 to-primary-bolt-100">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-full overflow-hidden border border-gray-200">
                    {activeConversation.avatarUrl ? (
                      <img
                        src={activeConversation.avatarUrl}
                        alt={activeConversation.fromUser}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-r from-primary-bolt-500 to-primary-bolt-600 flex items-center justify-center text-white font-semibold">
                        {activeConversation.initials ||
                          activeConversation.fromUser
                            .split(" ")
                            .map((n: string) => n[0])
                            .join("")}
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">
                      {activeConversation.fromUser}
                    </h3>
                    <a
                      href={`/?vehicle=${activeConversation.vehicleId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-gray-600 hover:underline"
                    >
                      {activeConversation.vehicleTitle}
                    </a>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div
                id="messages-container"
                className="flex-1 p-6 overflow-y-auto space-y-4 max-h-[calc(100vh-400px)]"
              >
                {[...activeConversation.messages]
                  .sort(
                    (a, b) =>
                      new Date(a.timestamp).getTime() -
                      new Date(b.timestamp).getTime(),
                  )
                  .map((msg: any) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.isOwn ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-sm px-4 py-3 rounded-2xl ${
                          msg.isOwn
                            ? "bg-primary-bolt-500 text-white"
                            : "bg-gray-100 text-gray-900"
                        }`}
                      >
                        <p
                          className={`text-xs font-semibold mb-1 ${
                            msg.isOwn
                              ? "text-primary-bolt-100"
                              : "text-gray-600"
                          }`}
                        >
                          {msg.isOwn ? "Vous" : activeConversation.fromUser}
                        </p>
                        <p className="text-sm">{msg.content}</p>
                        <p
                          className={`text-xs mt-2 ${
                            msg.isOwn
                              ? "text-primary-bolt-100"
                              : "text-gray-500"
                          }`}
                        >
                          {msg.timestamp
                            ? `${msg.timestamp.toLocaleDateString("fr-FR", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })} à ${msg.timestamp.toLocaleTimeString(
                                "fr-FR",
                                {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                },
                              )}`
                            : ""}
                        </p>
                      </div>
                    </div>
                  ))}
              </div>

              {/* Zone de saisie */}
              <div className="p-6 border-t border-gray-200">
                <div className="flex items-center space-x-4">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) =>
                      e.key === "Enter" &&
                      !sendingMessage &&
                      handleSendMessage()
                    }
                    placeholder="Tapez votre message..."
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-bolt-500 focus:border-primary-bolt-500"
                    disabled={sendingMessage}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() || sendingMessage}
                    className="bg-primary-bolt-500 hover:bg-primary-bolt-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl font-semibold transition-colors"
                  >
                    {sendingMessage ? "Envoi..." : "Envoyer"}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <MessageCircle className="h-10 w-10 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Sélectionnez une conversation
                </h3>
                <p className="text-gray-600">
                  Choisissez une conversation pour commencer à échanger.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
