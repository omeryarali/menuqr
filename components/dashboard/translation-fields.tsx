import { Languages } from "lucide-react";

import { FieldError } from "@/components/shared/field-error";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { parseTranslations } from "@/lib/i18n";

/**
 * Optional English name/description, collapsed behind a <details>.
 *
 * Collapsed because most menus never translate: leaving two extra fields open
 * in every dialog would tax everyone to serve a minority. Blank fields fall
 * back to the Turkish text on the menu, so a partial translation is fine.
 */
export function TranslationFields({
  translations,
  errors,
}: {
  translations: unknown;
  errors?: { nameEn?: string[]; descriptionEn?: string[] };
}) {
  const en = parseTranslations(translations)?.en;
  const hasAny = Boolean(en?.name || en?.description);

  return (
    <details className="rounded-lg border p-3" open={hasAny}>
      <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-medium">
        <Languages className="text-muted-foreground size-4" aria-hidden />
        İngilizce çeviri
        <span className="text-muted-foreground font-normal">{hasAny ? "· eklendi" : "· isteğe bağlı"}</span>
      </summary>

      <div className="mt-3 space-y-3">
        <p className="text-muted-foreground text-xs">
          Boş bıraktığınız alanlarda Türkçe metin gösterilir.
        </p>

        <div className="space-y-2">
          <Label htmlFor="nameEn">İsim (EN)</Label>
          <Input id="nameEn" name="nameEn" defaultValue={en?.name ?? ""} />
          <FieldError messages={errors?.nameEn} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="descriptionEn">Açıklama (EN)</Label>
          <Textarea id="descriptionEn" name="descriptionEn" rows={2} defaultValue={en?.description ?? ""} />
          <FieldError messages={errors?.descriptionEn} />
        </div>
      </div>
    </details>
  );
}
