export function Button({ children, className = "", type = "button", ...props }) {
  return (
    <button className={className || "primary-button"} type={type} {...props}>
      {children}
    </button>
  );
}
