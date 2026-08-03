import { Agentation } from "agentation";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
    {import.meta.env.DEV ? (
      <Agentation endpoint="http://localhost:4747" />
    ) : null}
  </StrictMode>,
);
