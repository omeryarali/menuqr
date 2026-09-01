"use client";

import { useMemo, useState, useTransition } from "react";

import { Loader2, TrendingUp } from "lucide-react";
import { toast } from "sonner";

import { FieldError } from "@/components/shared/field-error";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { bulkUpdatePrices } from "@/lib/actions/products";
import {
  parsePriceInput,
  previewPriceChange,
  priceChangeIssue,
  type PriceChange,
  type PriceDirection,
  type PriceMode,
  type RoundingStep,
} from "@/lib/pricing";
import { formatPrice } from "@/lib/utils/format";
import { PRICE_CHANGE_MESSAGES } from "@/lib/validators/pricing";

export type PricableProduct = {
  id: string;
  name: string;
  price: number;
  categoryId: string;
  currency: string;
};

const ROUNDING_LABELS: Record<string, string> = {
  "0": "Yuvarlama yok",
  "1": "En yakın 1",
  "5": "En yakın 5",
  "10": "En yakın 10",
};

/**
 * Bulk price editor.
 *
 * The preview is the confirmation step: a bulk reprice cannot be undone, so the
 * owner sees every old -> new pair before anything is written and the apply
 * button states the exact number of products it will touch.
 *
 * The server recomputes the prices from the same spec with the same function,
 * so what is previewed here and what gets saved cannot drift apart.
 */
export function BulkPriceDialog({
  products,
  categories,
}: {
  products: PricableProduct[];
  categories: { id: string; name: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [scope, setScope] = useState("all");
  const [mode, setMode] = useState<PriceMode>("percent");
  const [direction, setDirection] = useState<PriceDirection>("increase");
  const [value, setValue] = useState("10");
  const [rounding, setRounding] = useState("0");
  const [pending, startTransition] = useTransition();

  const change: PriceChange = useMemo(
    () => ({
      mode,
      direction,
      // An empty box is not an error, just nothing to do yet.
      value: parsePriceInput(value) ?? 0,
      rounding: Number(rounding) as RoundingStep,
    }),
    [mode, direction, value, rounding],
  );

  // The direction selector owns the sign, so a typed "-10" is rejected instead
  // of quietly turning a raise into a discount. computeNewPrice treats the same
  // spec as a no-op, which is why the preview below empties out on its own.
  const issue = priceChangeIssue(change);
  const error = issue ? PRICE_CHANGE_MESSAGES[issue] : null;

  const scoped = useMemo(
    () => (scope === "all" ? products : products.filter((p) => p.categoryId === scope)),
    [products, scope],
  );

  const preview = useMemo(() => previewPriceChange(scoped, change), [scoped, change]);
  const currency = scoped[0]?.currency ?? "TRY";

  function apply() {
    if (error) return;

    startTransition(async () => {
      const result = await bulkUpdatePrices(
        preview.map((row) => row.id),
        change,
      );

      if (result.status === "error") {
        toast.error(result.message ?? "Güncellenemedi.");
        return;
      }
      toast.success(
        result.status === "success" && result.message ? result.message : "Fiyatlar güncellendi.",
      );
      setOpen(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" disabled={products.length === 0} />}>
        <TrendingUp className="size-4" aria-hidden />
        Toplu fiyat
      </DialogTrigger>

      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Toplu fiyat güncelleme</DialogTitle>
          <DialogDescription>
            Değişiklik uygulanmadan önce tüm yeni fiyatları aşağıda görürsünüz.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="bulk-scope">Kapsam</Label>
            <Select
              value={scope}
              onValueChange={(next) => next && setScope(next)}
              items={{ all: "Tüm ürünler", ...Object.fromEntries(categories.map((c) => [c.id, c.name])) }}
            >
              <SelectTrigger id="bulk-scope">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm ürünler</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="bulk-direction">İşlem</Label>
              <Select
                value={direction}
                onValueChange={(next) => next && setDirection(next as PriceDirection)}
                items={{ increase: "Zam", decrease: "İndirim" }}
              >
                <SelectTrigger id="bulk-direction">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="increase">Zam</SelectItem>
                  <SelectItem value="decrease">İndirim</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bulk-mode">Tür</Label>
              <Select
                value={mode}
                onValueChange={(next) => next && setMode(next as PriceMode)}
                items={{ percent: "Yüzde (%)", amount: "Sabit tutar" }}
              >
                <SelectTrigger id="bulk-mode">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percent">Yüzde (%)</SelectItem>
                  <SelectItem value="amount">Sabit tutar</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="bulk-value">{mode === "percent" ? "Oran (%)" : "Tutar"}</Label>
              {/* Text, not type="number": a Turkish keyboard types "1,5" and a
                  number input silently reports that as empty. min= would be
                  ignored here anyway, so the sign is checked in code. */}
              <Input
                id="bulk-value"
                inputMode="decimal"
                value={value}
                aria-invalid={error ? true : undefined}
                onChange={(event) => setValue(event.target.value)}
              />
              <FieldError messages={error ? [error] : undefined} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bulk-rounding">Yuvarlama</Label>
              <Select
                value={rounding}
                onValueChange={(next) => next && setRounding(next)}
                items={ROUNDING_LABELS}
              >
                <SelectTrigger id="bulk-rounding">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ROUNDING_LABELS).map(([step, label]) => (
                    <SelectItem key={step} value={step}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-lg border">
            <p className="border-b px-3 py-2 text-sm font-medium">
              {preview.length > 0 ? `${preview.length} ürünün fiyatı değişecek` : "Değişecek fiyat yok"}
            </p>

            {preview.length > 0 ? (
              <ul className="max-h-52 divide-y overflow-y-auto">
                {preview.map((row) => (
                  <li key={row.id} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                    <span className="min-w-0 truncate">{row.name}</span>
                    <span className="flex shrink-0 items-center gap-2 tabular-nums">
                      <span className="text-muted-foreground line-through">
                        {formatPrice(row.from, currency)}
                      </span>
                      <span className="font-medium">{formatPrice(row.to, currency)}</span>
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground px-3 py-4 text-sm">Bir oran veya tutar girin.</p>
            )}
          </div>

          <Button
            className="w-full"
            onClick={apply}
            disabled={pending || Boolean(error) || preview.length === 0}
          >
            {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
            {preview.length > 0 ? `${preview.length} ürünü güncelle` : "Güncelle"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
