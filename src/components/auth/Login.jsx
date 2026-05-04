import { AlertTriangle, KeyRound, Loader2 } from "lucide-react";
import { Button } from "../common/Button";

export function Login({ busy, error, form, onChange, onSubmit }) {
  return (
    <form className="auth-form" onSubmit={onSubmit}>
      <label>
        Username, not email
        <input
          autoComplete="username"
          maxLength={32}
          required
          value={form.username}
          onChange={(event) => onChange("username", event.target.value)}
        />
      </label>

      <label>
        Password
        <input
          autoComplete="current-password"
          maxLength={128}
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
        Unlock private key
      </Button>
    </form>
  );
}
