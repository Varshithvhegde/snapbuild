import { mutation } from "./_generated/server";
import { STARTER_TEMPLATES } from "./seedData";

export const seedTemplates = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("templates").first();
    if (existing) {
      return { seeded: false, message: "Templates already exist" };
    }

    for (const template of STARTER_TEMPLATES) {
      await ctx.db.insert("templates", template);
    }

    return { seeded: true, count: STARTER_TEMPLATES.length };
  },
});
