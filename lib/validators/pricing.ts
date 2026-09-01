import { z } from "zod";

import {
  MAX_PERCENT,
  priceChangeIssue,
  type PriceChange,
  type PriceChangeIssue,
} from "@/lib/pricing";

/**
 * Turkish wording for every reason a bulk change can be rejected.
 *
 * One map, two readers: the dialog shows it inline under the value input and
 * the action returns it as an ActionState message, so the owner cannot be told
 * two different things about the same number.
 */
export const PRICE_CHANGE_MESSAGES: Record<PriceChangeIssue, string> = {
  "invalid-mode": "Geçersiz değişiklik türü",
  "invalid-direction": "Zam mı indirim mi olduğunu seçin",
  "invalid-rounding": "Geçersiz yuvarlama seçimi",
  "not-a-number": "Geçerli bir sayı girin",
  negative: "Negatif değer girilemez — zam veya indirimi yukarıdan seçin",
  "percent-too-large": `Oran en fazla %${MAX_PERCENT} olabilir`,
  "amount-too-large": "Tutar çok büyük",
};

/**
 * Server-side gate for `bulkUpdatePrices`.
 *
 * The object arrives as a Server Action argument, which is network input like
 * any other — the TypeScript signature proves nothing about it. Shape is
 * checked here; the ranges stay in `priceChangeIssue` so the browser preview
 * and this apply the identical rule.
 */
export const priceChangeSchema = z
  .object(
    {
      mode: z.enum(["percent", "amount"], { error: PRICE_CHANGE_MESSAGES["invalid-mode"] }),
      direction: z.enum(["increase", "decrease"], {
        error: PRICE_CHANGE_MESSAGES["invalid-direction"],
      }),
      value: z.number({ error: PRICE_CHANGE_MESSAGES["not-a-number"] }),
      rounding: z.number({ error: PRICE_CHANGE_MESSAGES["invalid-rounding"] }),
    },
    // A payload that is not even an object would otherwise surface zod's own
    // English default in the toast.
    { error: "Geçersiz fiyat değişikliği" },
  )
  .superRefine((change, ctx) => {
    const issue = priceChangeIssue(change as PriceChange);
    if (issue) ctx.addIssue({ code: "custom", path: ["value"], message: PRICE_CHANGE_MESSAGES[issue] });
  })
  .transform((change) => change as PriceChange);
