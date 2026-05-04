import { useState } from "react";
import { Login } from "../components/auth/Login";
import { Register } from "../components/auth/Register";
import { Navbar } from "../components/layout/Navbar";

export function AuthPage({ onLogin, onRegister }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({
    username: "",
    displayName: "",
    password: "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const isRegistering = mode === "register";

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");

    try {
      if (isRegistering) {
        await onRegister(form);
      } else {
        await onLogin(form);
      }
    } catch (caught) {
      setError(caught.message || "Authentication failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-shell">
      <section className="auth-panel">
        <Navbar />

        <div className="mode-switch" role="tablist" aria-label="Authentication mode">
          <button
            type="button"
            className={mode === "login" ? "active" : ""}
            onClick={() => setMode("login")}
          >
            Sign in
          </button>
          <button
            type="button"
            className={mode === "register" ? "active" : ""}
            onClick={() => setMode("register")}
          >
            Create account
          </button>
        </div>

        {isRegistering ? (
          <Register
            busy={busy}
            error={error}
            form={form}
            onChange={updateField}
            onSubmit={submit}
          />
        ) : (
          <Login
            busy={busy}
            error={error}
            form={form}
            onChange={updateField}
            onSubmit={submit}
          />
        )}
      </section>
    </main>
  );
}
