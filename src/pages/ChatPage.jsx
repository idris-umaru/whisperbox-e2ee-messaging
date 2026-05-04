import { useEffect } from "react";
import { ChatWindow } from "../components/chat/ChatWindow";
import { Sidebar } from "../components/layout/Sidebar";
import { useMessages } from "../hooks/useMessages";
import { useChatStore } from "../store/useChatStore";

export function ChatPage({ authNotice, onLogout, session }) {
  const clearChat = useChatStore((state) => state.clearChat);
  const setNotice = useChatStore((state) => state.setNotice);
  const chat = useMessages(session);

  useEffect(() => {
    if (authNotice) {
      setNotice(authNotice);
    }
  }, [authNotice, setNotice]);

  async function logout() {
    await onLogout();
    clearChat();
  }

  return (
    <main className="app-shell">
      <Sidebar
        activePeer={chat.activePeer}
        conversations={chat.conversations}
        onLogout={logout}
        onSearchChange={chat.setSearchTerm}
        onSelectPeer={chat.selectPeer}
        searchResults={chat.searchResults}
        searchTerm={chat.searchTerm}
        user={session.user}
      />

      <ChatWindow
        activePeer={chat.activePeer}
        busy={chat.busy}
        canSend={chat.canSend}
        composerError={chat.composerError}
        currentUserId={chat.currentUserId}
        draft={chat.draft}
        messages={chat.messages}
        notice={chat.notice}
        onDraftChange={chat.setDraft}
        onSendMessage={chat.sendMessage}
        status={chat.status}
      />
    </main>
  );
}
