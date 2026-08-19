import { useEffect, useState } from "react";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { ChatInterface } from "./components/ChatInterface";
import { CodeViewer } from "./components/CodeViewer";
import { SettingsDialog } from "./components/SettingsDialog";
import { PlatformShell } from "./components/platform/PlatformShell";
import { useAppState } from "./hooks/useAppState";
import { useGenerator } from "./hooks/useGenerator";
import { useIsMobile } from "./hooks/useIsMobile";
import { useTheme } from "./hooks/useTheme";
import { useConversationStore, DEFAULT_TITLE } from "./store/conversation";
import { useT } from "./i18n";
import { insertImageIntoHtml } from "./lib/staticSite";
import { detectSandpackTemplate } from "./lib/detectTemplate";
import { repairStaticSiteFiles } from "./lib/staticSiteRepair";
import { TEMPLATE_CUSTOMIZE_PROMPT } from "./lib/designPrompt";
import type { PendingChatImage } from "./lib/pendingImage";
import type { Id } from "@convex/dataModel";
import type { PreviewElementSelection } from "./types";

export default function App() {
  const t = useT();
  const activeId = useConversationStore((s) => s.activeId);
  const activeConv = useConversationStore((s) =>
    s.activeId ? (s.conversations[s.activeId] ?? null) : null,
  );
  const setDeployInfo = useConversationStore((s) => s.setDeployInfo);
  const hasHydrated = useConversationStore((s) => s._hasHydrated);
  const conversations = useConversationStore((s) => s.conversations);
  const createConversation = useConversationStore((s) => s.createConversation);
  const switchConversation = useConversationStore((s) => s.switchConversation);
  const isMobile = useIsMobile();
  useTheme();

  const [chatPrefill, setChatPrefill] = useState("");
  const [pendingChatImages, setPendingChatImages] = useState<PendingChatImage[]>([]);
  const [selectedPreviewElements, setSelectedPreviewElements] = useState<
    PreviewElementSelection[]
  >([]);
  const [previewSelectMode, setPreviewSelectMode] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);

  useEffect(() => {
    if (!hasHydrated) return;
    if (!activeId || !conversations[activeId]) {
      const entries = Object.values(conversations);
      if (entries.length > 0) {
        const latest = entries.sort((a, b) => b.updatedAt - a.updatedAt)[0];
        switchConversation(latest.id);
      } else {
        createConversation();
      }
    }
  }, [hasHydrated]);

  const {
    files,
    setFiles,
    currentFile,
    setCurrentFile,
    messages,
    setMessages,
    isGenerating,
    setIsGenerating,
    settings,
    hasValidSettings,
    isSettingsOpen,
    setIsSettingsOpen,
    handleSaveSettings,
    webSearchSettings,
    handleSaveWebSearchSettings,
    assetSearchSettings,
    handleSaveAssetSearchSettings,
    systemSettings,
    handleSaveSystemSettings,
    template,
    setTemplate,
    sandpackKey,
    restartSandpack,
    isProjectInitialized,
    setIsProjectInitialized,
  } = useAppState();

  const {
    generate,
    stop,
    retry,
    continueTask,
    updateFiles,
    deleteFile,
    renameFile,
    moveFile,
    compressContext,
    review,
  } = useGenerator({
    settings,
    webSearchSettings,
    assetSearchSettings,
    files,
    setMessages,
    setFiles,
    setIsGenerating,
    setTemplate,
    restartSandpack,
    setIsProjectInitialized,
  });

  useEffect(() => {
    restartSandpack();
    setSelectedPreviewElements([]);
    setPreviewSelectMode(false);
  }, [activeId]);

  // Fix template mismatch: static HTML sites must use "static" Sandpack template
  useEffect(() => {
    if (!hasHydrated || Object.keys(files).length === 0) return;
    const detected = detectSandpackTemplate(files);
    if (detected !== template) {
      setTemplate(detected);
      restartSandpack();
    }
  }, [activeId, hasHydrated]);

  // Repair broken static sites (missing tailwind token mappings, picker script leaks, styles.css)
  useEffect(() => {
    if (!hasHydrated || Object.keys(files).length === 0) return;
    const repaired = repairStaticSiteFiles(files);
    const changed = Object.keys(repaired).length !== Object.keys(files).length ||
      Object.entries(repaired).some(([k, v]) => files[k] !== v);
    if (changed) {
      setFiles(repaired);
      restartSandpack();
    }
  }, [activeId, hasHydrated]);

  function handleLoadTemplate(
    templateFiles: Record<string, string>,
    framework: string,
  ) {
    setFiles(templateFiles);
    setTemplate(framework === "html" ? "static" : "vite-react-ts");
    setCurrentFile(templateFiles["index.html"] ? "index.html" : "src/App.tsx");
    setIsProjectInitialized(true);
    restartSandpack();
    setChatPrefill(TEMPLATE_CUSTOMIZE_PROMPT);
  }

  function handleImageForChat(url: string, filename: string) {
    setPendingChatImages((prev) => {
      if (prev.some((img) => img.url === url)) return prev;
      return [...prev, { url, filename }];
    });
  }

  function handleInsertImageIntoPage(url: string, filename: string) {
    const indexKey = files["index.html"] ? "index.html" : files["/index.html"] ? "/index.html" : null;
    if (!indexKey || !url) return;
    const updated = insertImageIntoHtml(files[indexKey], url, filename);
    updateFiles(indexKey.replace(/^\//, ""), updated);
    setCurrentFile("index.html");
    if (template !== "static") {
      setTemplate("static");
    }
    setIsProjectInitialized(true);
  }

  function handlePreviewElementSelect(selection: PreviewElementSelection) {
    setSelectedPreviewElements((prev) => {
      if (prev.some((el) => el.selector === selection.selector)) return prev;
      return [...prev, selection];
    });
  }

  function handleVisualEditSave(html: string) {
    updateFiles("index.html", html);
    setCurrentFile("index.html");
  }

  if (!hasHydrated) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">{t.app.loading}</p>
      </div>
    );
  }

  const editor = (
    <ResizablePanelGroup className="flex h-full w-full bg-background">
      <ResizablePanel
        className="h-full w-full md:w-100 md:flex-1 shrink-0 overflow-hidden"
        defaultSize="30%"
        minSize={360}
        maxSize={isMobile ? "100%" : "50%"}
      >
        <ChatInterface
          messages={messages}
          isGenerating={isGenerating}
          hasValidSettings={hasValidSettings}
          onGenerate={generate}
          onStop={stop}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onSetFiles={(f) => setFiles(f)}
          files={files}
          template={template}
          sandpackKey={sandpackKey}
          isProjectInitialized={isProjectInitialized}
          onCompressContext={compressContext}
          onRetry={retry}
          onContinue={continueTask}
          onReview={review}
          chatPrefill={chatPrefill}
          onPrefillConsumed={() => setChatPrefill("")}
          pendingChatImages={pendingChatImages}
          onClearPendingChatImages={() => setPendingChatImages([])}
          onRemovePendingChatImage={(url) =>
            setPendingChatImages((prev) => prev.filter((img) => img.url !== url))
          }
          onRequireAuth={() => setAuthOpen(true)}
          selectedPreviewElements={selectedPreviewElements}
          onRemovePreviewElement={(id) =>
            setSelectedPreviewElements((prev) => prev.filter((el) => el.id !== id))
          }
          onClearPreviewElements={() => setSelectedPreviewElements([])}
        />
      </ResizablePanel>

      {!isMobile ? (
        <>
          <ResizableHandle className="hidden md:flex" />
          <ResizablePanel className="w-full h-full min-w-0 hidden md:flex overflow-hidden">
            {isProjectInitialized && !isMobile ? (
              <CodeViewer
                files={files}
                currentFile={currentFile}
                onFileSelect={setCurrentFile}
                onFileChange={updateFiles}
                onRenameFile={renameFile}
                onDeleteFile={deleteFile}
                onMoveFile={moveFile}
                template={template}
                sandpackKey={sandpackKey}
                selectMode={previewSelectMode}
                onSelectModeChange={setPreviewSelectMode}
                onPreviewElementSelect={handlePreviewElementSelect}
              />
            ) : (
              <div className="flex w-full h-full min-w-0 items-center justify-center bg-muted/30">
                <div className="text-center max-w-md px-6">
                  <div className="text-5xl mb-6">🚀</div>
                  <h2 className="text-xl font-semibold text-foreground mb-2">
                    {t.app.startBuilding}
                  </h2>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Pick a template or describe your site. Deploy to a live URL when ready.
                  </p>
                </div>
              </div>
            )}
          </ResizablePanel>
        </>
      ) : null}

      <SettingsDialog
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSave={handleSaveSettings}
        webSearchSettings={webSearchSettings}
        onSaveWebSearch={handleSaveWebSearchSettings}
        assetSearchSettings={assetSearchSettings}
        onSaveAssetSearch={handleSaveAssetSearchSettings}
        systemSettings={systemSettings}
        onSaveSystem={handleSaveSystemSettings}
      />
    </ResizablePanelGroup>
  );

  const siteName =
    activeConv?.title && activeConv.title !== DEFAULT_TITLE
      ? activeConv.title
      : `Site ${new Date().toLocaleDateString()}`;

  return (
    <PlatformShell
      files={files}
      conversationId={activeId ?? undefined}
      siteId={activeConv?.siteId as Id<"sites"> | undefined}
      deployedUrl={activeConv?.deployedUrl ?? null}
      siteName={siteName}
      onDeployed={(url, id) => setDeployInfo(id, url)}
      onLoadTemplate={handleLoadTemplate}
      onImageForChat={handleImageForChat}
      onInsertImageIntoPage={handleInsertImageIntoPage}
      authOpen={authOpen}
      onAuthOpenChange={setAuthOpen}
      onVisualEditSave={handleVisualEditSave}
    >
      {editor}
    </PlatformShell>
  );
}
