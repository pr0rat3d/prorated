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
          lineHeight: 1, color: BRAND.gray,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
        {visible ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a13.16 13.16 0 0 1-1.67 2.68" />
            <path d="M6.61 6.61A13.526 13.526 0 0 0 1 12s4 8 11 8a9.26 9.26 0 0 0 5.39-1.61" />
            <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
            <line x1="1" y1="1" x2="23" y2="23" />
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        )}
      </button>
    </div>
  );
}
