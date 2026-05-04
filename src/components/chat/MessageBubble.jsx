import { AlertTriangle, Check, Circle, Lock } from "lucide-react";
import { formatTime } from "../../utils/formatDate";

export function MessageBubble({ currentUserId, message }) {
  const mine = message.from_user_id === currentUserId;

  return (
    <article className={mine ? "message mine" : "message"}>
      <p className={message.failed ? "failed-text" : ""}>{message.plaintext}</p>
      <footer>
        <span>
          {message.failed ? (
            <AlertTriangle size={13} aria-hidden="true" />
          ) : (
            <Lock size={13} aria-hidden="true" />
          )}
          {message.failed ? "Decrypt failed" : "E2EE"}
        </span>
        <time>{formatTime(message.created_at)}</time>
        {mine ? (
          message.delivered ? (
            <Check size={13} aria-label="Delivered" />
          ) : (
            <Circle size={10} aria-label="Queued" />
          )
        ) : null}
      </footer>
    </article>
  );
}
