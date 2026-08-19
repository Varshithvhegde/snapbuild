import { useEffect, useRef, useCallback } from "react";
import {
  injectPreviewPickerIntoDocument,
  PICKER_MESSAGE,
  type PreviewElementSelection,
  createPreviewElementSelection,
} from "@/lib/previewElementPicker";

interface PreviewElementPickerBridgeProps {
  enabled: boolean;
  onElementSelect: (selection: PreviewElementSelection) => void;
}

function findPreviewIframe(): HTMLIFrameElement | null {
  return document.querySelector(
    'iframe.preview-iframe, iframe[class*="preview-iframe"]',
  );
}

function postToPreview(iframe: HTMLIFrameElement, enabled: boolean) {
  iframe.contentWindow?.postMessage(
    { type: PICKER_MESSAGE.setEnabled, enabled },
    "*",
  );
}

function tryInjectPicker(iframe: HTMLIFrameElement) {
  try {
    const doc = iframe.contentDocument;
    if (doc) injectPreviewPickerIntoDocument(doc);
  } catch {
    /* cross-origin — rely on script injected via preview HTML */
  }
}

/** Wires Sandpack preview iframe ↔ chat element tags via postMessage. */
export function PreviewElementPickerBridge({
  enabled,
  onElementSelect,
}: PreviewElementPickerBridgeProps) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;

  const syncIframe = useCallback((iframe: HTMLIFrameElement | null) => {
    if (!iframe) return;
    iframeRef.current = iframe;
    tryInjectPicker(iframe);
    postToPreview(iframe, enabledRef.current);
  }, []);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.data?.type === PICKER_MESSAGE.selected && event.data.payload) {
        const p = event.data.payload;
        onElementSelect(
          createPreviewElementSelection({
            tag: p.tag,
            selector: p.selector,
            classes: p.classes ?? [],
            text: p.text,
            idAttr: p.id,
            href: p.href,
            src: p.src,
          }),
        );
        return;
      }
      if (event.data?.type === PICKER_MESSAGE.ready) {
        syncIframe(findPreviewIframe());
      }
    };

    window.addEventListener("message", onMessage);

    const iframe = findPreviewIframe();
    syncIframe(iframe);

    const onLoad = () => syncIframe(findPreviewIframe());
    iframe?.addEventListener("load", onLoad);

    const observer = new MutationObserver(() => {
      const next = findPreviewIframe();
      if (next && next !== iframeRef.current) {
        next.addEventListener("load", onLoad);
        syncIframe(next);
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      window.removeEventListener("message", onMessage);
      iframe?.removeEventListener("load", onLoad);
      observer.disconnect();
    };
  }, [onElementSelect, syncIframe]);

  useEffect(() => {
    syncIframe(iframeRef.current ?? findPreviewIframe());
  }, [enabled, syncIframe]);

  return null;
}
