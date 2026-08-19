import { installProxy } from "./lib/proxy";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ConvexAppProvider } from "./lib/convex";
import { ErrorBoundary } from "./components/ErrorBoundary";
import App from "./App.tsx";
import "./index.css";

installProxy();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <ConvexAppProvider>
        <App />
      </ConvexAppProvider>
    </ErrorBoundary>
  </StrictMode>,
);
