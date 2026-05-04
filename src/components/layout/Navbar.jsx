import { Lock } from "lucide-react";

export function Navbar() {
  return (
    <>
      <div className="brand-mark">
        <Lock size={28} aria-hidden="true" />
      </div>
      <div>
        <p className="eyebrow">End-to-end encrypted</p>
        <h1>WhisperBox</h1>
        <p className="auth-copy">
          Messages are encrypted before they leave this device. The server
          receives ciphertext only.
        </p>
      </div>
    </>
  );
}
