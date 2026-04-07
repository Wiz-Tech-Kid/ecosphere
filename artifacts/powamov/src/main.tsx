import { createRoot } from "react-dom/client";
import { setBaseUrl } from "@workspace/api-client-react";
import App from "./App";
import "./index.css";

function normalizeApiBaseUrl(rawValue: string | undefined): string | null {
  const trimmedValue = rawValue?.trim();
  return trimmedValue ? trimmedValue.replace(/\/+$/, "") : null;
}

setBaseUrl(normalizeApiBaseUrl(import.meta.env.VITE_API_URL));

createRoot(document.getElementById("root")!).render(<App />);
