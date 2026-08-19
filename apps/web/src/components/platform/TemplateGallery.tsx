import { useQuery } from "convex/react";
import { useMemo, useState } from "react";
import { api } from "@convex/api";
import type { Id } from "@convex/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface TemplateGalleryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (template: { id: Id<"templates">; files: Array<{ path: string; content: string }>; framework: string }) => void;
}

const CATEGORIES = [
  { value: "", label: "All" },
  { value: "portfolio", label: "Portfolio" },
  { value: "landing", label: "Landing" },
  { value: "link-in-bio", label: "Link in Bio" },
  { value: "saas", label: "SaaS" },
  { value: "agency", label: "Agency" },
  { value: "blog", label: "Blog" },
  { value: "ecommerce", label: "Shop" },
];

export function TemplateGallery({ open, onOpenChange, onSelect }: TemplateGalleryProps) {
  const [category, setCategory] = useState("");
  const [search, setSearch] = useState("");
  const templates = useQuery(api.templates.list, {
    category: category || undefined,
    q: search || undefined,
  });

  const filtered = useMemo(() => templates ?? [], [templates]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle>Choose a template</DialogTitle>
          <p className="text-sm text-muted-foreground">Start with a design, then customize with AI or visual edit</p>
        </DialogHeader>
        <div className="px-6 py-3 flex gap-2 flex-wrap items-center">
          <Input
            placeholder="Search templates..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-xs"
          />
          <div className="flex gap-1 flex-wrap">
            {CATEGORIES.map((c) => (
              <Button
                key={c.value}
                size="sm"
                variant={category === c.value ? "default" : "outline"}
                onClick={() => setCategory(c.value)}
              >
                {c.label}
              </Button>
            ))}
          </div>
        </div>
        <div className="overflow-y-auto p-6 pt-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {!templates ? (
            <p className="text-sm text-muted-foreground col-span-2">Loading templates...</p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground col-span-2">No templates found. Run `npm run seed` after starting Convex.</p>
          ) : (
            filtered.map((t) => (
              <button
                key={t._id}
                type="button"
                onClick={() => {
                  onSelect({ id: t._id, files: t.files, framework: t.framework });
                  onOpenChange(false);
                }}
                className="text-left rounded-xl border overflow-hidden hover:border-primary transition group"
              >
                <div className="aspect-video bg-muted overflow-hidden">
                  <img src={t.thumbnailUrl} alt={t.name} className="w-full h-full object-cover group-hover:scale-105 transition" />
                </div>
                <div className="p-4">
                  <h3 className="font-semibold">{t.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{t.description}</p>
                  <div className="flex gap-1 mt-2 flex-wrap">
                    {t.tags.slice(0, 3).map((tag) => (
                      <span key={tag} className="text-[10px] bg-muted px-2 py-0.5 rounded-full">{tag}</span>
                    ))}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
