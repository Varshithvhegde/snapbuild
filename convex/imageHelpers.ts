import { getAuthUserId } from "@convex-dev/auth/server";
import { internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";

export const getUserIdInternal = internalQuery({
  args: {},
  handler: async (ctx) => getAuthUserId(ctx),
});

export const countByUserInternal = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const images = await ctx.db
      .query("userImages")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    return images.length;
  },
});

export const saveRecordInternal = internalMutation({
  args: {
    userId: v.id("users"),
    r2Key: v.string(),
    publicUrl: v.string(),
    filename: v.string(),
    mimeType: v.string(),
    sizeBytes: v.number(),
    width: v.optional(v.number()),
    height: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return ctx.db.insert("userImages", {
      userId: args.userId,
      r2Key: args.r2Key,
      publicUrl: args.publicUrl,
      filename: args.filename,
      mimeType: args.mimeType,
      sizeBytes: args.sizeBytes,
      width: args.width,
      height: args.height,
    });
  },
});
