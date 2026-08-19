import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  ...authTables,

  users: defineTable({
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    image: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    phone: v.optional(v.string()),
    phoneVerificationTime: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),
    plan: v.optional(v.union(v.literal("free"), v.literal("pro"))),
  }).index("email", ["email"]),

  sites: defineTable({
    userId: v.id("users"),
    name: v.string(),
    slug: v.string(),
    description: v.optional(v.string()),
    templateId: v.optional(v.id("templates")),
    status: v.union(
      v.literal("draft"),
      v.literal("deployed"),
      v.literal("archived"),
    ),
    files: v.array(
      v.object({
        path: v.string(),
        content: v.string(),
      }),
    ),
    framework: v.optional(v.string()),
    deployedUrl: v.optional(v.string()),
    customDomain: v.optional(v.string()),
    lastDeployedAt: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_slug", ["slug"]),

  deployments: defineTable({
    siteId: v.id("sites"),
    userId: v.id("users"),
    status: v.union(
      v.literal("pending"),
      v.literal("building"),
      v.literal("live"),
      v.literal("failed"),
    ),
    deployedUrl: v.optional(v.string()),
    fileCount: v.number(),
    buildLog: v.optional(v.string()),
    completedAt: v.optional(v.number()),
  })
    .index("by_site", ["siteId"])
    .index("by_user", ["userId"]),

  siteSnapshots: defineTable({
    siteId: v.id("sites"),
    userId: v.id("users"),
    label: v.optional(v.string()),
    files: v.array(
      v.object({
        path: v.string(),
        content: v.string(),
      }),
    ),
  }).index("by_site", ["siteId"]),

  userImages: defineTable({
    userId: v.id("users"),
    storageId: v.optional(v.id("_storage")),
    r2Key: v.optional(v.string()),
    publicUrl: v.optional(v.string()),
    filename: v.string(),
    mimeType: v.string(),
    sizeBytes: v.number(),
    width: v.optional(v.number()),
    height: v.optional(v.number()),
  }).index("by_user", ["userId"]),

  templates: defineTable({
    name: v.string(),
    description: v.string(),
    framework: v.union(
      v.literal("react"),
      v.literal("vue"),
      v.literal("svelte"),
      v.literal("html"),
    ),
    category: v.union(
      v.literal("portfolio"),
      v.literal("landing"),
      v.literal("blog"),
      v.literal("ecommerce"),
      v.literal("saas"),
      v.literal("agency"),
      v.literal("personal"),
      v.literal("link-in-bio"),
    ),
    thumbnailUrl: v.string(),
    tags: v.array(v.string()),
    featured: v.boolean(),
    files: v.array(
      v.object({
        path: v.string(),
        content: v.string(),
      }),
    ),
  })
    .index("by_category", ["category"])
    .index("by_featured", ["featured"]),
});
