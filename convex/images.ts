import { action, mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { requireAuthUserId } from "./lib/auth";
import { getAuthUserId } from "@convex-dev/auth/server";

const MAX_IMAGES_FREE = 100;
const MAX_BYTES = 10 * 1024 * 1024;

const EXT_TO_MIME: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  webp: "image/webp",
  svg: "image/svg+xml",
};

function inferMimeType(filename: string, provided?: string): string {
  if (provided && provided.startsWith("image/")) return provided;
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  return EXT_TO_MIME[ext] ?? "image/jpeg";
}

export const upload = action({
  args: {
    data: v.bytes(),
    filename: v.string(),
    mimeType: v.string(),
    sizeBytes: v.number(),
    width: v.optional(v.number()),
    height: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<{ imageId: Id<"userImages">; url: string }> => {
    const userId = await requireAuthUserId(ctx);

    const mimeType = inferMimeType(args.filename, args.mimeType);
    if (!mimeType.startsWith("image/")) {
      throw new Error("Only image files are allowed");
    }
    if (args.sizeBytes > MAX_BYTES) {
      throw new Error("Max file size is 10MB");
    }

    const count = await ctx.runQuery(internal.imageHelpers.countByUserInternal, {
      userId,
    });
    if (count >= MAX_IMAGES_FREE) {
      throw new Error("Free tier limit: 100 images");
    }

    const uploaded = await ctx.runAction(internal.r2.uploadUserImageToR2, {
      userId,
      data: args.data,
      filename: args.filename,
      mimeType,
    });

    const imageId = await ctx.runMutation(internal.imageHelpers.saveRecordInternal, {
      userId,
      r2Key: uploaded.r2Key,
      publicUrl: uploaded.publicUrl,
      filename: args.filename,
      mimeType,
      sizeBytes: args.sizeBytes,
      width: args.width,
      height: args.height,
    });

    return { imageId, url: uploaded.publicUrl };
  },
});

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const images = await ctx.db
      .query("userImages")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();

    return images.map((img) => ({
      ...img,
      url: img.publicUrl ?? null,
    }));
  },
});

export const remove = mutation({
  args: { imageId: v.id("userImages") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const image = await ctx.db.get(args.imageId);
    if (!image || image.userId !== userId) throw new Error("Image not found");

    await ctx.db.delete(args.imageId);
    return { deleted: true };
  },
});
