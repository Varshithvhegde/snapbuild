import { ConvexReactClient } from "convex/react";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import type { ReactNode } from "react";

const convexUrl = import.meta.env.VITE_CONVEX_URL as string;

if (!convexUrl) {
  console.warn("VITE_CONVEX_URL is not set. Run `npx convex dev` and add it to .env.local");
}

export const convex = new ConvexReactClient(convexUrl ?? "https://placeholder.convex.cloud");

export function ConvexAppProvider({ children }: { children: ReactNode }) {
  return (
    <ConvexAuthProvider client={convex}>
      {children}
    </ConvexAuthProvider>
  );
}
