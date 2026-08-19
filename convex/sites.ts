import { getAuthUserId } from "@convex-dev/auth/server";
import { mutation, query } from "./_generated/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { v } from "convex/values";
import { buildSlug } from "./lib/utils";

const fileValidator = v.object({
  path: v.string(),
  content: v.string(),
});

async function requireUser(ctx: MutationCtx | QueryCtx) {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new Error("Not authenticated");
  return userId;
}

async function uniqueSlug(ctx: any, base: string): Promise<string> {
  let slug = buildSlug(base);
  for (let i = 0; i < 10; i++) {
    const existing = await ctx.db
      .query("sites")
      .withIndex("by_slug", (q: any) => q.eq("slug", slug))
      .first();
    if (!existing) return slug;
    slug = buildSlug(base);
  }
  throw new Error("Could not generate unique slug");
}

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    return ctx.db
      .query("sites")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
  },
});

export const get = query({
  args: { siteId: v.id("sites") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const site = await ctx.db.get(args.siteId);
    if (!site || site.userId !== userId) return null;
    return site;
  },
});

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    return ctx.db
      .query("sites")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    templateId: v.optional(v.id("templates")),
    files: v.optional(v.array(fileValidator)),
    slug: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);

    let files = args.files ?? [];
    let framework = "html";

    if (args.templateId) {
      const template = await ctx.db.get(args.templateId);
      if (template) {
        files = template.files;
        framework = template.framework;
      }
    }

    const slug = args.slug
      ? args.slug.toLowerCase().replace(/[^a-z0-9-]/g, "")
      : await uniqueSlug(ctx, args.name);

    const siteId = await ctx.db.insert("sites", {
      userId,
      name: args.name,
      slug,
      description: args.description,
      templateId: args.templateId,
      status: "draft",
      files,
      framework,
    });

    return { siteId, slug };
  },
});

export const update = mutation({
  args: {
    siteId: v.id("sites"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    files: v.optional(v.array(fileValidator)),
    customDomain: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const site = await ctx.db.get(args.siteId);
    if (!site || site.userId !== userId) throw new Error("Site not found");

    const patch: Record<string, unknown> = {};
    if (args.name !== undefined) patch.name = args.name;
    if (args.description !== undefined) patch.description = args.description;
    if (args.files !== undefined) patch.files = args.files;
    if (args.customDomain !== undefined) patch.customDomain = args.customDomain;

    await ctx.db.patch(args.siteId, patch);
    return args.siteId;
  },
});

export const saveDraft = mutation({
  args: {
    siteId: v.id("sites"),
    files: v.array(fileValidator),
  },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const site = await ctx.db.get(args.siteId);
    if (!site || site.userId !== userId) throw new Error("Site not found");

    await ctx.db.patch(args.siteId, { files: args.files });
    await ctx.db.insert("siteSnapshots", {
      siteId: args.siteId,
      userId,
      label: "Auto-save",
      files: args.files,
    });
    return args.siteId;
  },
});

export const remove = mutation({
  args: { siteId: v.id("sites") },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const site = await ctx.db.get(args.siteId);
    if (!site || site.userId !== userId) throw new Error("Site not found");
    await ctx.db.delete(args.siteId);
    return { deleted: true };
  },
});
