import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth, useQuery } from "convex/react";
import { useState } from "react";
import { api } from "@convex/api";
import type { Id } from "@convex/dataModel";
import { AuthDialog } from "./AuthDialog";
import { DeployButton } from "./DeployButton";
import { ImageLibrary } from "./ImageLibrary";
import { TemplateGallery } from "./TemplateGallery";
import { VisualEditor } from "./VisualEditor";
import { Button } from "@/components/ui/button";

interface PlatformShellProps {
  children: React.ReactNode;
  files: Record<string, string>;
  onLoadTemplate: (files: Record<string, string>, framework: string) => void;
  onImageForChat: (url: string, filename: string) => void;
  onInsertImageIntoPage?: (url: string, filename: string) => void;
  onVisualEditSave: (html: string) => void;
  conversationId?: string;
  siteId?: Id<"sites">;
  deployedUrl?: string | null;
  siteName?: string;
  onDeployed?: (url: string, siteId: Id<"sites">) => void;
  authOpen?: boolean;
  onAuthOpenChange?: (open: boolean) => void;
}

export function PlatformShell({
  children,
  files,
  onLoadTemplate,
  onImageForChat,
  onInsertImageIntoPage,
  onVisualEditSave,
  conversationId,
  siteId,
  deployedUrl,
  siteName,
  onDeployed,
  authOpen: authOpenProp,
  onAuthOpenChange,
}: PlatformShellProps) {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const { signOut } = useAuthActions();
  const user = useQuery(api.users.currentUser, isAuthenticated ? {} : "skip");
  const sites = useQuery(api.sites.list, isAuthenticated ? {} : "skip");

  const [authOpenLocal, setAuthOpenLocal] = useState(false);
  const authOpen = authOpenProp ?? authOpenLocal;
  const setAuthOpen = onAuthOpenChange ?? setAuthOpenLocal;
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [imagesOpen, setImagesOpen] = useState(false);
  const [visualEditOpen, setVisualEditOpen] = useState(false);

  const htmlContent = files["index.html"] ?? files["/index.html"] ?? "";
  const hasFiles = Object.keys(files).length > 0;

  return (
    <div className="h-screen flex flex-col">
      <header className="flex items-center justify-between gap-2 px-3 py-2 border-b bg-background shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-bold text-sm truncate">Snapbuild</span>
          {deployedUrl && (
            <a href={deployedUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] text-emerald-600 truncate hidden sm:inline">
              live
            </a>
          )}
        </div>

        <div className="flex items-center gap-1.5 flex-wrap justify-end">
          <Button size="sm" variant="outline" onClick={() => setTemplatesOpen(true)}>
            Templates
          </Button>

          {isAuthenticated && (
            <>
              <Button size="sm" variant="outline" onClick={() => setImagesOpen(!imagesOpen)}>
                Images
              </Button>
              {htmlContent && (
                <Button size="sm" variant="outline" onClick={() => setVisualEditOpen(true)}>
                  Edit
                </Button>
              )}
              {hasFiles && (
                <DeployButton
                  key={conversationId ?? "default"}
                  conversationKey={conversationId}
                  files={files}
                  siteId={siteId}
                  deployedUrl={deployedUrl}
                  siteName={siteName}
                  onDeployed={onDeployed}
                />
              )}
            </>
          )}

          {isLoading ? null : isAuthenticated ? (
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-muted-foreground hidden sm:inline truncate max-w-[100px]">
                {user?.email ?? "Account"}
              </span>
              <Button size="sm" variant="ghost" onClick={() => signOut()}>Out</Button>
            </div>
          ) : (
            <Button size="sm" onClick={() => setAuthOpen(true)}>Sign in</Button>
          )}
        </div>
      </header>

      {imagesOpen && (
        <div className="border-b p-3 bg-muted/30 shrink-0">
          {isAuthenticated ? (
            <ImageLibrary
              onSelectForChat={onImageForChat}
              onInsertIntoPage={htmlContent ? onInsertImageIntoPage : undefined}
            />
          ) : (
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground">
                Sign in to upload images to cloud storage — the AI needs a permanent URL to use them in your site.
              </p>
              <Button size="sm" onClick={() => setAuthOpen(true)}>Sign in</Button>
            </div>
          )}
        </div>
      )}

      {isAuthenticated && sites && sites.length > 0 && (
        <div className="border-b px-3 py-1.5 flex gap-2 overflow-x-auto shrink-0 text-xs">
          {sites.slice(0, 5).map((s) => (
            <span key={s._id} className="whitespace-nowrap text-muted-foreground">
              {s.name}{s.deployedUrl ? " ✓" : ""}
            </span>
          ))}
        </div>
      )}

      <div className="flex-1 min-h-0 overflow-hidden">{children}</div>

      <AuthDialog open={authOpen} onOpenChange={setAuthOpen} />
      <TemplateGallery
        open={templatesOpen}
        onOpenChange={setTemplatesOpen}
        onSelect={(t) => {
          const fileMap = Object.fromEntries(t.files.map((f) => [f.path, f.content]));
          onLoadTemplate(fileMap, t.framework);
        }}
      />

      {visualEditOpen && htmlContent && (
        <VisualEditor
          html={htmlContent}
          files={files}
          onChange={(html) => onVisualEditSave(html)}
          onClose={() => setVisualEditOpen(false)}
        />
      )}
    </div>
  );
}
