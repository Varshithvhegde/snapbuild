import { query } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {
    category: v.optional(v.string()),
    featured: v.optional(v.boolean()),
    q: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let results;

    if (args.category) {
      results = await ctx.db
        .query("templates")
        .withIndex("by_category", (q) => q.eq("category", args.category as any))
        .collect();
    } else if (args.featured) {
      results = await ctx.db
        .query("templates")
        .withIndex("by_featured", (q) => q.eq("featured", true))
        .collect();
    } else {
      results = await ctx.db.query("templates").collect();
    }

    if (args.q) {
      const q = args.q.toLowerCase();
      results = results.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.tags.some((tag) => tag.toLowerCase().includes(q)),
      );
    }

    return results;
  },
});

export const get = query({
  args: { templateId: v.id("templates") },
  handler: async (ctx, args) => {
    return ctx.db.get(args.templateId);
  },
});
