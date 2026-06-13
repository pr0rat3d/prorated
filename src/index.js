import "./index.css";
import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { AuthProvider } from "./hooks/useAuth";
import { LangProvider } from "./hooks/useLang";

const root = createRoot(document.getElementById("root"));
root.render(
  <LangProvider>
    <AuthProvider>
      <App />
    </AuthProvider>
  </LangProvider>
);
