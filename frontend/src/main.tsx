import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { bootstrapConfig } from "./config/bootstrap";

(async () => {
  await bootstrapConfig();

  ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
})();
