import type { Id } from "../_generated/dataModel";

type AuthCtx = {
  auth: {
    getUserIdentity: () => Promise<{ subject: string } | null>;
  };
};

/** Get authenticated user id inside an action (runQuery does NOT inherit auth). */
export async function requireAuthUserId(ctx: AuthCtx): Promise<Id<"users">> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Not authenticated");
  }
  const userId = identity.subject.split("|")[0];
  if (!userId) {
    throw new Error("Not authenticated");
  }
  return userId as Id<"users">;
}
