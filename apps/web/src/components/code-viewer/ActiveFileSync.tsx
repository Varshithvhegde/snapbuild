import { useEffect } from "react";
import { useSandpack } from "@codesandbox/sandpack-react";

/** Keep Sandpack editor in sync when user picks a file in FileExplorer. */
export function ActiveFileSync({ currentFile }: { currentFile: string }) {
  const { sandpack } = useSandpack();

  useEffect(() => {
    const path = currentFile.startsWith("/") ? currentFile : `/${currentFile}`;
    if (sandpack.files[path] && sandpack.activeFile !== path) {
      sandpack.setActiveFile(path);
    }
  }, [currentFile, sandpack]);

  return null;
}
