import { Button } from "@/components/ui/button";
import { useT } from "../../i18n";
import { DESIGN_STARTER_PROMPTS } from "../../lib/designPrompt";

interface EmptyStateProps {
  onSelectSuggestion: (text: string) => void;
}

export function EmptyState({ onSelectSuggestion }: EmptyStateProps) {
  const t = useT();
  const suggestions = [
    { icon: "🚀", label: t.empty.suggestions.landing, prompt: DESIGN_STARTER_PROMPTS.landing },
    { icon: "🎨", label: t.empty.suggestions.portfolio, prompt: DESIGN_STARTER_PROMPTS.portfolio },
    { icon: "🍝", label: t.empty.suggestions.localBusiness, prompt: DESIGN_STARTER_PROMPTS.localBusiness },
    { icon: "✨", label: t.empty.suggestions.animated, prompt: DESIGN_STARTER_PROMPTS.animated },
    { icon: "⚡", label: t.empty.suggestions.oneShot, prompt: DESIGN_STARTER_PROMPTS.oneShot },
  ];

  return (
    <div className="flex-1 flex flex-col items-center justify-center py-12 text-center">
      <img className="w-16 h-16 mb-4" src="/logo.svg" alt="logo" />
      <h3 className="text-base font-semibold mb-2">{t.empty.title}</h3>
      <p className="text-sm text-muted-foreground max-w-xs mb-6">
        {t.empty.desc}
      </p>
      <div className="space-y-2 w-full max-w-xs">
        {suggestions.map(({ icon, label, prompt }) => (
          <Button
            key={label}
            variant="outline"
            className="w-full justify-start h-auto py-2.5 text-left"
            onClick={() => onSelectSuggestion(prompt)}
          >
            <span className="text-base mr-2">{icon}</span>
            <span className="text-sm">{label}</span>
          </Button>
        ))}
      </div>
    </div>
  );
}
