import { useAction, useMutation } from "convex/react";
import { useEffect, useState } from "react";
import { api } from "@convex/api";
import type { Id } from "@convex/dataModel";
import { Button } from "@/components/ui/button";

interface DeployButtonProps {
  files: Record<string, string>;
  siteId?: Id<"sites">;
  deployedUrl?: string | null;
  siteName?: string;
  conversationKey?: string;
  onDeployed?: (url: string, siteId: Id<"sites">) => void;
}

export function DeployButton({
  files,
  siteId,
  deployedUrl,
  siteName,
  conversationKey,
  onDeployed,
}: DeployButtonProps) {
  const createSite = useMutation(api.sites.create);
  const deploy = useAction(api.deployments.deploy);
  const [isDeploying, setIsDeploying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setError(null);
  }, [conversationKey, siteId, deployedUrl]);

  async function handleDeploy() {
    setIsDeploying(true);
    setError(null);
    try {
      let targetSiteId = siteId;
      if (!targetSiteId) {
        const created = await createSite({
          name: siteName ?? `Site ${new Date().toLocaleDateString()}`,
          files: Object.entries(files)
            .filter(([p]) => !p.includes("node_modules"))
            .map(([path, content]) => ({
              path: path.replace(/^\/+/, ""),
              content,
            })),
        });
        targetSiteId = created.siteId;
      }

      const fileArray = Object.entries(files)
        .filter(([p]) => !p.includes("node_modules"))
        .map(([path, content]) => ({
          path: path.replace(/^\/+/, ""),
          content,
        }));

      const result = await deploy({ siteId: targetSiteId, files: fileArray });
      onDeployed?.(result.deployedUrl, targetSiteId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Deploy failed");
    } finally {
      setIsDeploying(false);
    }
  }

  if (deployedUrl) {
    return (
      <div className="flex items-center gap-2 flex-wrap">
        <a
          href={deployedUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-emerald-600 font-medium hover:underline truncate max-w-[180px]"
        >
          {deployedUrl.replace("https://", "")}
        </a>
        <Button size="sm" variant="outline" onClick={handleDeploy} disabled={isDeploying}>
          {isDeploying ? "Building & deploying..." : "Re-deploy"}
        </Button>
        {error && <span className="text-xs text-destructive">{error}</span>}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Button size="sm" onClick={handleDeploy} disabled={isDeploying}>
        {isDeploying ? "Building & deploying..." : "Deploy"}
      </Button>
      {error && <span className="text-xs text-destructive">{error}</span>}
    </div>
  );
}
