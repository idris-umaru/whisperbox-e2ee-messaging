import { Wifi, WifiOff } from "lucide-react";
import { getInitials } from "../../utils/helpers";

export function ChatHeader({ peer, status }) {
  return (
    <header className="chat-header">
      <div className="profile-block">
        <div className="avatar">{getInitials(peer.display_name)}</div>
        <div>
          <strong>{peer.display_name}</strong>
          <span>@{peer.username}</span>
        </div>
      </div>
      <div className={`connection ${status}`}>
        {status === "online" ? (
          <Wifi size={17} aria-hidden="true" />
        ) : (
          <WifiOff size={17} aria-hidden="true" />
        )}
        <span>{status}</span>
      </div>
    </header>
  );
}
