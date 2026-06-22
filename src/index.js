import "./index.css";
import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { AuthProvider } from "./hooks/useAuth";
import { LangProvider } from "./hooks/useLang";

class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error) { return { error }; }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 24, fontFamily: "sans-serif", maxWidth: 480, margin: "60px auto" }}>
          <h3 style={{ color: "#991B1B", marginBottom: 8 }}>Something went wrong</h3>
          <pre style={{ fontSize: 12, background: "#FEF2F2", padding: 12, borderRadius: 8, overflowX: "auto", color: "#7F1D1D" }}>{this.state.error.message}{"\n"}{this.state.error.stack}</pre>
          <button onClick={() => window.location.reload()} style={{ marginTop: 12, padding: "8px 16px", background: "#1E3A5F", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer" }}>Reload</button>
        </div>
      );
    }
    return this.props.children;
  }
}

const root = createRoot(document.getElementById("root"));
root.render(
  <ErrorBoundary>
    <LangProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </LangProvider>
  </ErrorBoundary>
);
