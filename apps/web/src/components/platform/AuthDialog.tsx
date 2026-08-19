import { useAuthActions } from "@convex-dev/auth/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface AuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function friendlyAuthError(err: unknown, mode: "signIn" | "signUp"): string {
  const message = err instanceof Error ? err.message : "Authentication failed";
  if (message.includes("Invalid password")) {
    return "Password must be at least 8 characters.";
  }
  if (message.includes("already exists") || message.includes("AccountAlreadyExists")) {
    return "An account with this email already exists. Try signing in instead.";
  }
  if (mode === "signIn" && (message.includes("InvalidAccountId") || message.includes("InvalidSecret"))) {
    return "Wrong email or password.";
  }
  return message;
}

export function AuthDialog({ open, onOpenChange }: AuthDialogProps) {
  const { signIn } = useAuthActions();
  const [mode, setMode] = useState<"signIn" | "signUp">("signIn");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    try {
      const params =
        mode === "signUp"
          ? { email: email.trim(), password, flow: "signUp" as const, ...(name.trim() ? { name: name.trim() } : {}) }
          : { email: email.trim(), password, flow: "signIn" as const };

      const result = await signIn("password", params);

      if (!result.signingIn) {
        throw new Error(
          mode === "signIn"
            ? "Wrong email or password."
            : "Could not create account. Try signing in if you already have one.",
        );
      }

      onOpenChange(false);
    } catch (err) {
      setError(friendlyAuthError(err, mode));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{mode === "signIn" ? "Sign in to Snapbuild" : "Create your Snapbuild account"}</DialogTitle>
        </DialogHeader>
        <p className="text-xs text-muted-foreground -mt-2">
          Required to upload images and deploy sites. Password must be 8+ characters.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "signUp" && (
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete={mode === "signIn" ? "current-password" : "new-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Please wait..." : mode === "signIn" ? "Sign in" : "Create account"}
          </Button>
          <button
            type="button"
            className="w-full text-sm text-muted-foreground hover:text-foreground"
            onClick={() => {
              setMode(mode === "signIn" ? "signUp" : "signIn");
              setError(null);
            }}
          >
            {mode === "signIn" ? "Need an account? Sign up" : "Already have an account? Sign in"}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
