import { AlertTriangle, KeyRound, Loader2 } from "lucide-react";
import { Button } from "../common/Button";

export function Register({ busy, error, form, onChange, onSubmit }) {
  return (
    <form className="auth-form" onSubmit={onSubmit}>
      <label>
        Username
        <input
          autoComplete="username"
          maxLength={32}
          minLength={3}
          required
          value={form.username}
          onChange={(event) => onChange("username", event.target.value)}
        />
      </label>

      <label>
        Display name
        <input
          autoComplete="name"
          maxLength={128}
          required
          value={form.displayName}
          onChange={(event) => onChange("displayName", event.target.value)}
        />
      </label>

      <label>
        Password
        <input
          autoComplete="new-password"
          maxLength={128}
          minLength={8}
          required
          type="password"
          value={form.password}
          onChange={(event) => onChange("password", event.target.value)}
        />
      </label>

      {error ? (
        <p className="form-error" role="alert">
          <AlertTriangle size={16} aria-hidden="true" />
          {error}
        </p>
      ) : null}

      <Button className="primary-button" disabled={busy} type="submit">
        {busy ? (
          <Loader2 className="spin" size={18} aria-hidden="true" />
        ) : (
          <KeyRound size={18} aria-hidden="true" />
        )}
        Generate keys and register
      </Button>
    </form>
  );
}
