import { useState } from "react";
import { Login } from "../components/auth/Login";
import { Register } from "../components/auth/Register";
import { Navbar } from "../components/layout/Navbar";
import { LAST_USERNAME_KEY } from "../constants";

export function AuthPage({ onLogin, onRegister }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({
    username: sessionStorage.getItem(LAST_USERNAME_KEY) ?? "",
    displayName: "",
    password: "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const isRegistering = mode === "register";

  function updateField(field, value) {
    const nextValue =
      field === "username" ? value.replace(/\s/g, "").toLowerCase() : value;

    setForm((current) => ({ ...current, [field]: nextValue }));
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
