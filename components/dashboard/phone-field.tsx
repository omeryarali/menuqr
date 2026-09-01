"use client";

import { useState } from "react";

import { Input } from "@/components/ui/input";
import { groupTrNational, TR_DIAL_CODE, trNationalDigits } from "@/lib/phone";

/**
 * Phone input with a fixed +90.
 *
 * The country code is furniture rather than something to type, forget or
 * mistype, and the box holds only the national part. Submitting just those
 * digits is enough: the schema normalizes with the same parser, so pasting a
 * full "+90 532 …" in here still lands on one stored shape.
 *
 * A legacy value that does not parse is shown verbatim instead of dropped, so
 * the owner sees what is stored and can fix it.
 */
export function PhoneField({ defaultValue }: { defaultValue?: string | null }) {
  const [value, setValue] = useState(() => {
    const national = trNationalDigits(defaultValue);
    return national ? groupTrNational(national) : (defaultValue ?? "");
  });

  return (
    <div className="flex items-center gap-1.5">
      <span className="text-muted-foreground shrink-0 text-sm">{TR_DIAL_CODE}</span>
      <Input
        id="phone"
        name="phone"
        type="tel"
        inputMode="tel"
        autoComplete="tel-national"
        placeholder="532 123 45 67"
        maxLength={32}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        // Group on blur, not on every keystroke: rewriting the value while
        // typing fights the caret on mobile keyboards.
        onBlur={(event) => {
          const national = trNationalDigits(event.target.value);
          if (national) setValue(groupTrNational(national));
        }}
      />
    </div>
  );
}
