import { getAuthUserId } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";
import {
  action,
  internalMutation,
  internalQuery,
  query,
} from "./_generated/server";
import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import { normalizeFileList, prepareDeployBundle } from "./lib/staticSite";
import { requireAuthUserId } from "./lib/auth";
import { fileMapFromEntries, isBundledProject } from "./lib/projectBuildDetect";

const fileValidator = v.object({
  path: v.string(),
  content: v.string(),
});

export const getSiteInternal = internalQuery({
  args: { siteId: v.id("sites") },
  handler: async (ctx, args) => {
    return ctx.db.get(args.siteId);
  },
});

export const createDeployment = internalMutation({
  args: {
    siteId: v.id("sites"),
    userId: v.id("users"),
    fileCount: v.number(),
  },
  handler: async (ctx, args) => {
    return ctx.db.insert("deployments", {
      siteId: args.siteId,
      userId: args.userId,
      status: "building",
      fileCount: args.fileCount,
    });
  },
});

export const markLive = internalMutation({
  args: {
    deploymentId: v.id("deployments"),
    siteId: v.id("sites"),
    deployedUrl: v.string(),
    files: v.array(fileValidator),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    await ctx.db.patch(args.deploymentId, {
      status: "live",
      deployedUrl: args.deployedUrl,
      completedAt: now,
    });
    await ctx.db.patch(args.siteId, {
      status: "deployed",
      deployedUrl: args.deployedUrl,
      files: args.files,
      lastDeployedAt: now,
    });
    const site = await ctx.db.get(args.siteId);
    if (site) {
      await ctx.db.insert("siteSnapshots", {
        siteId: args.siteId,
        userId: site.userId,
        label: "Deploy",
        files: args.files,
      });
    }
  },
});

export const markFailed = internalMutation({
  args: {
    deploymentId: v.id("deployments"),
    buildLog: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.deploymentId, {
      status: "failed",
      buildLog: args.buildLog,
      completedAt: Date.now(),
    });
  },
});

function hasIndexHtml(files: Array<{ path: string }>): boolean {
  return files.some((f) => {
    const p = f.path.replace(/^\/+/, "");
    return p === "index.html";
  });
}

/** Static HTML export for React Sandpack projects */
function exportStaticHtml(
  files: Record<string, string>,
): Array<{ path: string; content: string }> {
  const normalized = normalizeFileList(
    Object.entries(files).map(([path, content]) => ({ path, content })),
  );
  const fileMap = Object.fromEntries(
    normalized.map((f) => [f.path, f.content]),
  );

  const indexHtml = fileMap["index.html"];
  if (indexHtml) {
    return normalized;
  }

  const appTsx = files["src/App.tsx"] ?? files["/src/App.tsx"];
  if (appTsx) {
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>My Site</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>body { margin: 0; font-family: system-ui, sans-serif; }</style>
</head>
<body>
  <div id="root"></div>
  <script type="module">
    document.getElementById('root').innerHTML = \`${appTsx.replace(/`/g, "\\`").replace(/\$/g, "\\$")}\`;
  </script>
</body>
</html>`;
    return [{ path: "index.html", content: html }];
  }

  return normalized;
}

export const deploy = action({
  args: {
    siteId: v.id("sites"),
    files: v.optional(v.array(fileValidator)),
  },
  handler: async (ctx, args): Promise<{
    deploymentId: Id<"deployments">;
    deployedUrl: string;
    status: "live";
  }> => {
    const userId = await requireAuthUserId(ctx);

    const site: Doc<"sites"> | null = await ctx.runQuery(
      internal.deployments.getSiteInternal,
      { siteId: args.siteId },
    );
    if (!site) throw new Error("Site not found");
    if (site.userId !== userId) throw new Error("Not authorized to deploy this site");

    const files = args.files ?? site.files;
    const normalized = normalizeFileList(
      files.map((f) => ({
        path: f.path.replace(/^\/+/, ""),
        content: f.content,
      })),
    );

    const fileMap = fileMapFromEntries(normalized);
    let deployFiles: Array<{ path: string; content: string }>;

    if (isBundledProject(fileMap)) {
      deployFiles = await ctx.runAction(internal.buildSite.bundleForDeploy, {
        files: normalized,
      });
    } else {
      deployFiles = exportStaticHtml(
        Object.fromEntries(normalized.map((f) => [f.path, f.content])),
      );
    }

    deployFiles = prepareDeployBundle(deployFiles);

    if (!hasIndexHtml(deployFiles)) {
      throw new Error("Deployment requires index.html at the root");
    }

    const deploymentId: Id<"deployments"> = await ctx.runMutation(
      internal.deployments.createDeployment,
      {
        siteId: args.siteId,
        userId: site.userId,
        fileCount: deployFiles.length,
      },
    );

    try {
      const result: { deployedUrl: string; r2Prefix: string } =
        await ctx.runAction(internal.r2.uploadSiteToR2, {
          siteId: args.siteId,
          slug: site.slug,
          files: deployFiles,
        });

      await ctx.runMutation(internal.deployments.markLive, {
        deploymentId,
        siteId: args.siteId,
        deployedUrl: result.deployedUrl,
        files: deployFiles,
      });

      return {
        deploymentId,
        deployedUrl: result.deployedUrl,
        status: "live" as const,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Deploy failed";
      await ctx.runMutation(internal.deployments.markFailed, {
        deploymentId,
        buildLog: message,
      });
      throw err;
    }
  },
});

export const history = query({
  args: { siteId: v.id("sites") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const site = await ctx.db.get(args.siteId);
    if (!site || site.userId !== userId) return [];

    return ctx.db
      .query("deployments")
      .withIndex("by_site", (q) => q.eq("siteId", args.siteId))
      .order("desc")
      .take(20);
  },
});
