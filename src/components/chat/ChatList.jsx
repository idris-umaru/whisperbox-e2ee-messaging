import { formatTime } from "../../utils/formatDate";
import { getInitials, getPeerId } from "../../utils/helpers";

export function ChatList({ activePeer, conversations, onSelectPeer }) {
  return (
    <nav className="conversation-list" aria-label="Conversations">
      {conversations.length === 0 ? (
        <p className="muted empty-copy">No conversations yet.</p>
      ) : null}

      {conversations.map((conversation) => {
        const active = getPeerId(activePeer) === conversation.user_id;

        return (
          <button
            className={active ? "conversation active" : "conversation"}
            key={conversation.user_id}
            type="button"
            onClick={() => onSelectPeer(conversation)}
          >
            <div className="avatar sm">{getInitials(conversation.display_name)}</div>
            <span>
              <strong>{conversation.display_name}</strong>
              <small>@{conversation.username}</small>
            </span>
            <time>{formatTime(conversation.last_message_at)}</time>
          </button>
        );
      })}
    </nav>
  );
}
