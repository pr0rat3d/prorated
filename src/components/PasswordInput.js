// src/components/PasswordInput.js
// Drop-in replacement for <input type="password"> with a show/hide toggle.
// Each instance manages its own visibility state, so rendering several in a
// loop (e.g. current/new/confirm password fields) gives each an independent
// toggle with no extra state needed from the parent.
import { useState } from "react";
import { BRAND } from "./UI";

export default function PasswordInput({ style, wrapperStyle, ...props }) {
  const [visible, setVisible] = useState(false);

  return (
    <div style={{ position: "relative", ...wrapperStyle }}>
      <input
        {...props}
        type={visible ? "text" : "password"}
        style={{ ...style, paddingRight: 40 }}
      />
      <button
        type="button"
        onClick={() => setVisible(v => !v)}
        tabIndex={-1}
        aria-label={visible ? "Hide password" : "Show password"}
        style={{
          position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)",
          background: "none", border: "none", cursor: "pointer", padding: 6,
          fontSize: 15, lineHeight: 1, color: BRAND.gray,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
        {visible ? "🙈" : "👁️"}
      </button>
    </div>
  );
}
