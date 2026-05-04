import { AlertTriangle, ShieldCheck } from "lucide-react";
import { ChatHeader } from "../layout/ChatHeader";
import { Loader } from "../common/Loader";
import { MessageBubble } from "./MessageBubble";
import { MessageInput } from "./MessageInput";

function EmptyConversation() {
  return (
    <section className="empty-state">
      <ShieldCheck size={44} aria-hidden="true" />
      <h2>Select a conversation</h2>
      <p>Search for a user or choose an existing thread to start decrypting messages.</p>
    </section>
  );
}

export function ChatWindow({
  activePeer,
  busy,
  canSend,
  composerError,
  currentUserId,
  draft,
  messages,
  notice,
  onDraftChange,
  onSendMessage,
  status,
}) {
  if (!activePeer) {
    return (
      <section className="chat-pane">
        <EmptyConversation />
      </section>
    );
  }

  return (
    <section className="chat-pane">
      <ChatHeader peer={activePeer} status={status} />

      {notice ? (
        <p className="notice" role="status">
          <AlertTriangle size={16} aria-hidden="true" />
          {notice}
        </p>
      ) : null}

      <div className="messages" aria-live="polite">
        {busy && messages.length === 0 ? (
          <Loader label="Loading encrypted history" />
        ) : null}

        {messages.map((message) => (
          <MessageBubble
            currentUserId={currentUserId}
            key={message.id}
            message={message}
          />
        ))}
      </div>

      <MessageInput
        busy={busy}
        canSend={canSend}
        draft={draft}
        error={composerError}
        onChange={onDraftChange}
        onSubmit={onSendMessage}
      />
    </section>
  );
}
