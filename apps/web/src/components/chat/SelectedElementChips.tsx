import { MousePointerClick } from "lucide-react";
import { selectionLabel } from "@/lib/previewElementPicker";
import type { ElementBlock } from "@/types";

export function SelectedElementChips({ elements }: { elements: ElementBlock[] }) {
  if (elements.length === 0) return null;

  return (
    <div className="flex flex-col gap-2 mb-2">
      {elements.length > 1 && (
        <p className="text-[10px] font-medium text-violet-600">
          {elements.length} elements selected
        </p>
      )}
      <div className="flex flex-wrap gap-1.5">
        {elements.map((el) => (
          <div
            key={el.id}
            className="inline-flex items-center gap-1.5 rounded-lg border border-violet-500/30 bg-violet-500/10 px-2 py-1 max-w-full"
          >
            <MousePointerClick size={11} className="shrink-0 text-violet-600" />
            <div className="min-w-0">
              <p className="text-[10px] font-medium truncate max-w-[160px]">
                {selectionLabel({
                  id: el.id,
                  tag: el.tag,
                  selector: el.selector,
                  classes: el.classes,
                  text: el.text,
                  idAttr: el.idAttr,
                })}
              </p>
              <p className="text-[10px] text-violet-600/70 truncate max-w-[180px] font-mono">
                {el.selector}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
