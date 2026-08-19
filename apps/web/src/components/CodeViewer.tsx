import { useState, useMemo, useCallback } from "react";
import {
  SandpackProvider,
  SandpackLayout,
  SandpackCodeEditor,
  SandpackPreview,
  SandpackConsole,
  RoundedButton,
} from "@codesandbox/sandpack-react";
import type { SandpackPredefinedTemplate } from "@codesandbox/sandpack-react";
import { Terminal } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/hooks/useTheme";
import { useT } from "../i18n";
import { SandpackListener } from "./code-viewer/SandpackListener";
import { ActiveFileSync } from "./code-viewer/ActiveFileSync";
import { PreviewElementPickerBridge } from "./code-viewer/PreviewElementPickerBridge";
import { ViewToolbar } from "./code-viewer/ViewToolbar";
import { FileExplorer } from "./code-viewer/FileExplorer";
import type { ViewMode, DeviceSize } from "./code-viewer/ViewToolbar";
import type { ProjectFiles, PreviewElementSelection } from "../types";
import { normalizeStaticFiles } from "@/lib/staticSite";
import { injectPreviewPickerScript } from "@/lib/previewElementPicker";

interface CodeViewerProps {
  files: ProjectFiles;
  currentFile: string;
  onFileSelect: (path: string) => void;
  onFileChange: (path: string, content: string) => void;
  onRenameFile: (oldPath: string, newPath: string) => void;
  onDeleteFile: (path: string) => void;
  onMoveFile: (sourcePath: string, targetFolder: string) => void;
  template: string;
  sandpackKey: number;
  selectMode?: boolean;
  onSelectModeChange?: (enabled: boolean) => void;
  onPreviewElementSelect?: (selection: PreviewElementSelection) => void;
}

export function CodeViewer({
  files,
  currentFile,
  onFileSelect,
  onFileChange,
  onRenameFile,
  onDeleteFile,
  onMoveFile,
  template,
  sandpackKey,
  selectMode = false,
  onSelectModeChange,
  onPreviewElementSelect,
}: CodeViewerProps) {
  const t = useT();
  const [viewMode, setViewMode] = useState<ViewMode>("preview");
  const [deviceSize, setDeviceSize] = useState<DeviceSize>("desktop");
  const [showConsole, setShowConsole] = useState(false);
  const isDark = useTheme();

  const sandpackFiles = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(normalizeStaticFiles(files)).map(([path, content]) => {
          const sandpackPath = path.startsWith("/") ? path : `/${path}`;
          let code = content;
          if (sandpackPath === "/index.html" || sandpackPath.endsWith("/index.html")) {
            code = injectPreviewPickerScript(content);
          }
          return [sandpackPath, { code }];
        }),
      ),
    [files],
  );

  const handlePreviewElementSelect = useCallback(
    (selection: PreviewElementSelection) => {
      onPreviewElementSelect?.(selection);
    },
    [onPreviewElementSelect],
  );

  const sandpackCurrentFile = currentFile.startsWith("/")
    ? currentFile
    : `/${currentFile}`;

  const handleCreateFile = (path: string) => {
    const p = path.startsWith("/") ? path.slice(1) : path;
    if (!files[p]) {
      onFileChange(p, "// New file\n");
      onFileSelect(p);
    }
  };

  const handleCreateFolder = (path: string) => {
    const p = path.startsWith("/") ? path.slice(1) : path;
    // Use trailing "/" to represent empty folder, no .gitkeep needed
    if (!files[`${p}/`]) onFileChange(`${p}/`, "");
  };

  return (
    <div className="editor w-full h-full flex flex-col bg-background">
      <ViewToolbar
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        deviceSize={deviceSize}
        onDeviceSizeChange={setDeviceSize}
        files={files}
        selectMode={selectMode}
        onSelectModeChange={onSelectModeChange}
      />

      <div className="flex-1 overflow-hidden relative bg-muted/50">
        <SandpackProvider
          key={sandpackKey}
          template={template as SandpackPredefinedTemplate}
          theme={isDark ? "dark" : "light"}
          files={sandpackFiles}
          options={{ activeFile: sandpackCurrentFile }}
          style={{ height: "100%" }}
        >
          <SandpackListener onFileChange={onFileChange} externalFiles={files} />
          <ActiveFileSync currentFile={currentFile} />
          <PreviewElementPickerBridge
            enabled={selectMode && viewMode === "preview"}
            onElementSelect={handlePreviewElementSelect}
          />
          <SandpackLayout>
            {/* Preview */}
            <div
              className={cn(
                "transition-all duration-300 mx-auto relative",
                viewMode === "preview" ? "block" : "hidden",
                deviceSize === "desktop" && "w-full h-full",
                deviceSize !== "desktop" &&
                  "my-4 shadow-lg border rounded-lg overflow-hidden bg-background",
              )}
              style={
                deviceSize === "tablet"
                  ? { width: 768, height: 1024, maxHeight: "calc(100% - 2rem)" }
                  : deviceSize === "mobile"
                    ? {
                        width: 375,
                        height: 667,
                        maxHeight: "calc(100% - 2rem)",
                      }
                    : { height: "100%" }
              }
            >
              {selectMode && (
                <div className="absolute top-2 left-1/2 -translate-x-1/2 z-20 px-3 py-1.5 rounded-full bg-violet-600 text-white text-xs shadow-lg pointer-events-none">
                  {t.toolbar.selectElementHint}
                </div>
              )}
              <div className="grid grid-rows-3 h-full">
                <div
                  className={cn(
                    "transition-all duration-300 ease-in-out",
                    showConsole ? "row-span-2" : "row-span-3",
                  )}
                >
                  <SandpackPreview
                    showNavigator
                    showOpenInCodeSandbox={false}
                    showRefreshButton
                    actionsChildren={
                      <RoundedButton
                        onClick={() => setShowConsole(!showConsole)}
                        title={showConsole ? t.console.hide : t.console.show}
                      >
                        <Terminal size={16} />
                      </RoundedButton>
                    }
                  />
                </div>
                <div
                  className={cn(
                    "overflow-hidden border-t",
                    showConsole ? "row-span-1" : "max-h-0 border-t-0",
                  )}
                >
                  <SandpackConsole showSyntaxError={true} />
                </div>
              </div>
            </div>

            {/* Code editor */}
            <div
              className={cn(
                "h-full w-full overflow-hidden",
                viewMode === "code" ? "flex" : "hidden",
              )}
            >
              <div className="w-56 border-r h-full shrink-0 overflow-hidden flex flex-col">
                <FileExplorer
                  files={files}
                  currentFile={currentFile}
                  onFileSelect={onFileSelect}
                  onCreateFile={handleCreateFile}
                  onCreateFolder={handleCreateFolder}
                  onRenameFile={onRenameFile}
                  onDeleteFile={onDeleteFile}
                  onMoveFile={onMoveFile}
                />
              </div>
              <div className="flex flex-col flex-1 h-full overflow-x-auto min-w-0">
                <SandpackCodeEditor
                  showTabs={false}
                  showLineNumbers
                  showInlineErrors
                  wrapContent={false}
                  closableTabs={false}
                />
              </div>
            </div>
          </SandpackLayout>
        </SandpackProvider>
      </div>
    </div>
  );
}
