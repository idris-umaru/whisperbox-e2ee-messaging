import { AlertTriangle, Loader2, MessageCircle, Send } from "lucide-react";
import { MAX_MESSAGE_LENGTH } from "../../constants";

export function MessageInput({
  busy,
  canSend,
  draft,
  error,
  onChange,
  onSubmit,
}) {
  return (
    <form className="composer" onSubmit={onSubmit}>
      {error ? (
        <p className="form-error composer-error" role="alert">
          <AlertTriangle size={16} aria-hidden="true" />
          {error}
        </p>
      ) : null}
      <div className="composer-row">
        <MessageCircle size={20} aria-hidden="true" />
        <textarea
          maxLength={MAX_MESSAGE_LENGTH}
          placeholder="Write an encrypted message"
          rows={1}
          value={draft}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              onSubmit(event);
            }
          }}
        />
        <button className="send-button" disabled={!canSend} type="submit">
          {busy ? (
            <Loader2 className="spin" size={18} aria-hidden="true" />
          ) : (
            <Send size={18} aria-hidden="true" />
          )}
        </button>
      </div>
    </form>
  );
}
