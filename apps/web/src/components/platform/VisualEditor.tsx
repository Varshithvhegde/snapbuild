import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { preparePreviewHtml, stripEditorArtifacts } from "@/lib/staticSite";

interface VisualEditorProps {
  html: string;
  files: Record<string, string>;
  onChange: (html: string) => void;
  onClose: () => void;
}

/** Simple visual editor for static HTML — tap elements with data-editable to edit text/images */
export function VisualEditor({ html, files, onChange, onClose }: VisualEditorProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [editType, setEditType] = useState<"text" | "image">("text");

  const previewHtml = preparePreviewHtml(html, files);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const contentDoc = iframe.contentDocument;
    if (!contentDoc) return;
    const doc: Document = contentDoc;

    doc.open();
    doc.write(previewHtml);
    doc.close();

    const style = doc.createElement("style");
    style.setAttribute("data-snapbuild-editor", "true");
    style.textContent = `
      [data-editable] { cursor: pointer; outline: 2px dashed transparent; transition: outline 0.15s; }
      [data-editable]:hover { outline-color: #6366f1; }
      [data-editable].selected { outline-color: #6366f1; background: rgba(99,102,241,0.08); }
    `;
    doc.head.appendChild(style);

    function handleClick(e: Event) {
      const target = (e.target as HTMLElement).closest("[data-editable]") as HTMLElement | null;
      if (!target) return;
      e.preventDefault();
      e.stopPropagation();

      doc.querySelectorAll(".selected").forEach((el) => el.classList.remove("selected"));
      target.classList.add("selected");

      const key = target.getAttribute("data-editable") ?? "element";
      setSelectedKey(key);

      if (target.tagName === "IMG") {
        setEditType("image");
        setEditValue(target.getAttribute("src") ?? "");
      } else {
        setEditType("text");
        setEditValue(target.textContent ?? "");
      }
    }

    doc.body.addEventListener("click", handleClick);
    return () => doc.body.removeEventListener("click", handleClick);
  }, [previewHtml]);

  function applyEdit() {
    const iframe = iframeRef.current;
    const doc = iframe?.contentDocument;
    if (!doc || !selectedKey) return;

    const el = doc.querySelector(`[data-editable="${selectedKey}"]`) as HTMLElement | null;
    if (!el) return;

    if (editType === "image" && el.tagName === "IMG") {
      (el as HTMLImageElement).src = editValue;
    } else {
      el.textContent = editValue;
    }

    const cleaned = stripEditorArtifacts(doc.documentElement.outerHTML);
    onChange(cleaned.replace(/^<html><head>/, "<!DOCTYPE html>\n<html lang=\"en\">\n<head>"));
  }

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      <header className="flex items-center justify-between px-4 py-3 border-b">
        <div>
          <h2 className="font-semibold">Visual Editor</h2>
          <p className="text-xs text-muted-foreground">Tap highlighted elements to edit text or images</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={onClose}>Done</Button>
        </div>
      </header>
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        <div className="flex-1 bg-muted/30 p-4 overflow-auto">
          <iframe
            ref={iframeRef}
            title="Visual preview"
            className="w-full max-w-2xl mx-auto bg-white rounded-lg shadow-lg border min-h-[70vh]"
            sandbox="allow-scripts allow-same-origin"
          />
        </div>
        {selectedKey && (
          <aside className="w-full md:w-80 border-t md:border-t-0 md:border-l p-4 space-y-4 bg-background">
            <div>
              <Label className="text-xs text-muted-foreground">Editing: {selectedKey}</Label>
              {editType === "text" ? (
                <Input
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="mt-2"
                />
              ) : (
                <Input
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  placeholder="Image URL"
                  className="mt-2"
                />
              )}
            </div>
            <Button className="w-full" onClick={applyEdit}>Apply</Button>
          </aside>
        )}
      </div>
    </div>
  );
}
