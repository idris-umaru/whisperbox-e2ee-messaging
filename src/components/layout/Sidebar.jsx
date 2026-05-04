import { LogOut, Plus, Search, ShieldCheck } from "lucide-react";
import { ChatList } from "../chat/ChatList";
import { getInitials } from "../../utils/helpers";

export function Sidebar({
  activePeer,
  conversations,
  onLogout,
  onSearchChange,
  onSelectPeer,
  searchResults,
  searchTerm,
  user,
}) {
  return (
    <aside className="sidebar">
      <header className="sidebar-header">
        <div className="profile-block">
          <div className="avatar">{getInitials(user.display_name)}</div>
          <div>
            <strong>{user.display_name}</strong>
            <span>@{user.username}</span>
          </div>
        </div>
        <button
          className="icon-button"
          onClick={onLogout}
          title="Log out"
          type="button"
        >
          <LogOut size={18} aria-hidden="true" />
        </button>
      </header>

      <div className="security-strip">
        <ShieldCheck size={18} aria-hidden="true" />
        <span>Private key unlocked in memory</span>
      </div>

      <label className="search-box">
        <Search size={18} aria-hidden="true" />
        <input
          placeholder="Search users"
          value={searchTerm}
          onChange={(event) => onSearchChange(event.target.value)}
        />
      </label>

      {searchResults.length > 0 ? (
        <div className="search-results">
          {searchResults.map((result) => (
            <button key={result.id} type="button" onClick={() => onSelectPeer(result)}>
              <Plus size={16} aria-hidden="true" />
              <span>{result.display_name}</span>
              <small>@{result.username}</small>
            </button>
          ))}
        </div>
      ) : null}

      <ChatList
        activePeer={activePeer}
        conversations={conversations}
        onSelectPeer={onSelectPeer}
      />
    </aside>
  );
}
