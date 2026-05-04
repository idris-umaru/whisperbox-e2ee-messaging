import { Loader2 } from "lucide-react";

export function Loader({ label = "Loading" }) {
  return (
    <div className="loading-row">
      <Loader2 className="spin" size={20} aria-hidden="true" />
      {label}
    </div>
  );
}
