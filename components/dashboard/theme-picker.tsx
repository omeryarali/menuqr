import { MENU_THEMES } from "@/lib/themes";

/**
 * Radio-card picker for the public-menu theme. Pure markup + native radios —
 * the selected value submits as `theme` with the surrounding <form>, and the
 * checked styling is driven by `has-[:checked]` so no client JS is needed.
 */
export function ThemePicker({ value }: { value?: string }) {
  const selected = MENU_THEMES.some((t) => t.id === value) ? value : MENU_THEMES[0].id;

  return (
    <fieldset className="space-y-3">
      <legend className="text-sm font-medium">Menü teması</legend>
      <p className="text-muted-foreground text-sm">Müşterilerinizin gördüğü genel menünün görünümü.</p>

      <div className="grid gap-3 sm:grid-cols-3">
        {MENU_THEMES.map((theme) => (
          <label
            key={theme.id}
            className="group has-[:checked]:border-foreground has-[:checked]:ring-foreground/15 relative flex cursor-pointer flex-col gap-3 rounded-lg border p-3 transition-colors has-[:checked]:ring-2 hover:border-foreground/30"
          >
            <input
              type="radio"
              name="theme"
              value={theme.id}
              defaultChecked={theme.id === selected}
              className="sr-only"
            />

            {/* Mini menu preview built from the theme's swatch colors. */}
            <div
              className="flex h-16 flex-col justify-center gap-1.5 rounded-md px-3"
              style={{ backgroundColor: theme.swatch.bg }}
            >
              <span
                className="h-2 w-2/3 rounded-full"
                style={{ backgroundColor: theme.swatch.fg, opacity: 0.85 }}
              />
              <span className="h-1.5 w-full rounded-full" style={{ backgroundColor: theme.swatch.fg, opacity: 0.3 }} />
              <span className="h-1.5 w-1/3 rounded-full" style={{ backgroundColor: theme.swatch.accent }} />
            </div>

            <div className="space-y-0.5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{theme.label}</span>
                <span
                  className="border-foreground group-has-[:checked]:bg-foreground flex size-4 items-center justify-center rounded-full border"
                  aria-hidden
                >
                  <span className="bg-background size-1.5 rounded-full opacity-0 group-has-[:checked]:opacity-100" />
                </span>
              </div>
              <p className="text-muted-foreground text-xs leading-snug">{theme.description}</p>
            </div>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
