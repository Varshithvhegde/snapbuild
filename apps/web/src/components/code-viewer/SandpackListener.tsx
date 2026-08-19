import { useEffect, useMemo, useRef } from "react";
import { useSandpack, useSandpackConsole } from "@codesandbox/sandpack-react";
import { useSandpackStore, type ConsoleLogData } from "@/store/sandpack";
import { stripPreviewArtifacts } from "@/lib/staticSite";

interface SandpackListenerProps {
  onFileChange: (path: string, content: string) => void;
  externalFiles: Record<string, string>;
}

export function SandpackListener({ onFileChange, externalFiles }: SandpackListenerProps) {
  const { sandpack } = useSandpack();
  const { files, activeFile } = sandpack;
  const code = files[activeFile]?.code;
  const { logs } = useSandpackConsole({
    resetOnPreviewRestart: true,
    showSyntaxError: true,
  });
  const setConsoleLogs = useSandpackStore((s) => s.setConsoleLogs);
  const skipSyncUntilRef = useRef(0);
  const externalFingerprint = useMemo(
    () => JSON.stringify(externalFiles),
    [externalFiles],
  );

  // Parent updated files (e.g. image insert) — don't let stale Sandpack state overwrite them.
  useEffect(() => {
    skipSyncUntilRef.current = Date.now() + 750;
  }, [externalFingerprint]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (Date.now() < skipSyncUntilRef.current) return;
      if (!code || !activeFile) return;

      const normalizedPath = activeFile.startsWith("/")
        ? activeFile.slice(1)
        : activeFile;

      let cleaned = code;
      if (normalizedPath.endsWith(".html")) {
        cleaned = stripPreviewArtifacts(code);
      }

      const external =
        externalFiles[normalizedPath] ?? externalFiles[`/${normalizedPath}`];
      if (external !== undefined && cleaned === external) return;

      onFileChange(normalizedPath, cleaned);
    }, 500);
    return () => clearTimeout(timer);
  }, [code, activeFile, onFileChange, externalFiles]);

  useEffect(() => {
    setConsoleLogs(logs as ConsoleLogData[]);
  }, [logs]);

  return null;
}
