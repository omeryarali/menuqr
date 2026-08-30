"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Globe } from "lucide-react";

import { BASE_LOCALE, LOCALES, LOCALE_LABELS, type Locale } from "@/lib/i18n";

/**
 * Language switcher for the public menu.
 *
 * The choice lives in the URL, not in state or a cookie, so a customer who
 * shares the link passes their language along with it — and the page stays a
 * server render. The base locale drops the parameter entirely, keeping the
 * canonical Turkish URL clean and identical to what the QR code encodes.
 */
export function LanguageSwitcher({ current, label }: { current: Locale; label: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function switchTo(locale: Locale) {
    const params = new URLSearchParams(searchParams);
    if (locale === BASE_LOCALE) params.delete("lang");
    else params.set("lang", locale);

    // Scanning a QR sets ?src=qr; carrying it through a language switch would
    // count one visit as several scans.
    params.delete("src");

    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  return (
    <div
      className="inline-flex items-center gap-1 rounded-full border p-0.5"
      style={{ borderColor: "var(--menu-border)" }}
      role="group"
      aria-label={label}
    >
      <Globe className="ml-2 size-3" style={{ color: "var(--menu-muted)" }} aria-hidden />
      {LOCALES.map((locale) => {
        const active = locale === current;
        return (
          <button
            key={locale}
            type="button"
            onClick={() => switchTo(locale)}
            aria-current={active ? "true" : undefined}
            className="rounded-full px-2.5 py-1 text-xs transition-opacity hover:opacity-80"
            style={
              active
                ? { backgroundColor: "var(--menu-accent)", color: "var(--menu-bg)" }
                : { color: "var(--menu-muted)" }
            }
          >
            {LOCALE_LABELS[locale]}
          </button>
        );
      })}
    </div>
  );
}
