import { useAction, useMutation, useQuery } from "convex/react";
import { useRef, useState } from "react";
import { api } from "@convex/api";
import { Button } from "@/components/ui/button";
import { inferImageMimeType } from "@/lib/imageUtils";

interface ImageLibraryProps {
  /** Attach image to the next chat message so the AI can use the URL. */
  onSelectForChat?: (url: string, filename: string) => void;
  /** Insert image directly into the current page HTML. */
  onInsertIntoPage?: (url: string, filename: string) => void;
}

export function ImageLibrary({ onSelectForChat, onInsertIntoPage }: ImageLibraryProps) {
  const images = useQuery(api.images.list);
  const uploadImage = useAction(api.images.upload);
  const removeImage = useMutation(api.images.remove);
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function selectForChat(url: string, filename: string) {
    onSelectForChat?.(url, filename);
    setSuccess(`"${filename}" added to chat — click more images or send when ready`);
  }

  async function handleUpload(files: FileList | File[]) {
    const list = Array.from(files).filter((f) =>
      f.type.startsWith("image/") ||
      /\.(jpe?g|png|gif|webp|heic|heif|svg)$/i.test(f.name),
    );
    if (list.length === 0) return;

    setUploading(true);
    setError(null);
    setSuccess(null);
    try {
      let attached = 0;
      for (const file of list) {
        const buffer = await file.arrayBuffer();
        const saved = await uploadImage({
          data: buffer,
          filename: file.name,
          mimeType: inferImageMimeType(file.name, file.type),
          sizeBytes: file.size,
        });
        if (saved.url) {
          selectForChat(saved.url, file.name);
          attached++;
        }
      }
      if (attached > 1) {
        setSuccess(`${attached} images uploaded and attached to chat`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Upload or click thumbnails to attach images to chat. Select multiple files at once, or click several library images before sending.
      </p>
      <div className="flex items-center gap-2 flex-wrap">
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp,.jpg,.jpeg,.png,.gif,.webp"
          multiple
          className="hidden"
          onChange={(e) => {
            const files = e.target.files;
            if (files?.length) void handleUpload(files);
            e.target.value = "";
          }}
        />
        <Button size="sm" variant="outline" onClick={() => inputRef.current?.click()} disabled={uploading}>
          {uploading ? "Uploading..." : "Upload images"}
        </Button>
        {error && <span className="text-xs text-destructive">{error}</span>}
        {success && <span className="text-xs text-emerald-600">{success}</span>}
        {!uploading && error?.includes("Not authenticated") && (
          <span className="text-xs text-muted-foreground">Use Sign in (top right) first.</span>
        )}
      </div>
      {(images ?? []).length === 0 && !uploading && (
        <p className="text-xs text-muted-foreground">No images yet.</p>
      )}
      <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
        {(images ?? []).map((img) => (
          <div key={img._id} className="relative group aspect-square rounded-lg overflow-hidden border bg-muted">
            <button
              type="button"
              className="w-full h-full"
              onClick={() => img.url && selectForChat(img.url, img.filename)}
              title="Add to chat for AI"
            >
              <img src={img.url ?? ""} alt={img.filename} className="w-full h-full object-cover" />
            </button>
            {onInsertIntoPage && img.url && (
              <button
                type="button"
                className="absolute bottom-1 left-1 bg-black/70 text-white text-[9px] px-1 rounded opacity-0 group-hover:opacity-100"
                onClick={(e) => {
                  e.stopPropagation();
                  onInsertIntoPage(img.url!, img.filename);
                  setSuccess(`Inserted ${img.filename} into page`);
                }}
                title="Insert into current page"
              >
                + page
              </button>
            )}
            <button
              type="button"
              className="absolute top-1 right-1 bg-black/60 text-white text-[10px] px-1 rounded opacity-0 group-hover:opacity-100"
              onClick={(e) => {
                e.stopPropagation();
                removeImage({ imageId: img._id }).catch((err) => {
                  setError(err instanceof Error ? err.message : "Delete failed");
                });
              }}
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
