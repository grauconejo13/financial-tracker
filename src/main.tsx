// =============================================
// ClearPath - Application Entry Point
// Mounts React app with Bootstrap CSS loaded
// =============================================

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "bootstrap/dist/css/bootstrap.min.css";
import App from "./App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);