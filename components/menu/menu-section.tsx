import { ChevronDown, Star } from "lucide-react";

import { MenuImage } from "@/components/menu/menu-image";
import { ProductDescription } from "@/components/menu/product-description";
import { ProductName } from "@/components/menu/product-name";
import { localize, type Locale, type MenuStrings } from "@/lib/i18n";
import { formatPrice } from "@/lib/utils/format";
import type { CategoryWithProducts } from "@/types/database";

/**
 * One collapsible category.
 *
 * Native <details>/<summary> rather than React state: it works with JavaScript
 * off, the browser gives keyboard and screen-reader behaviour for free, and the
 * products stay in the DOM while collapsed — crawlers and link previews still
 * see the whole menu. The page's own @media print block forces every section
 * open on paper.
 */
export function MenuSection({
  category,
  currency,
  locale,
  strings,
  defaultOpen = false,
}: {
  category: CategoryWithProducts;
  currency: string;
  locale: Locale;
  strings: MenuStrings;
  /** Set for a single-category menu, which would otherwise open on a blank page. */
  defaultOpen?: boolean;
}) {
  const categoryText = localize(category, category.translations, locale);
  const headingStyle: React.CSSProperties = {
    fontFamily: "var(--menu-heading-font)",
    fontWeight: "var(--menu-heading-weight)" as React.CSSProperties["fontWeight"],
    letterSpacing: "var(--menu-heading-tracking)",
  };

  const count = category.products.length;

  return (
    <section aria-labelledby={`category-${category.id}`}>
      <details className="group menu-section" open={defaultOpen}>
        {/* list-none and the webkit rule drop the browser's own disclosure
            triangle; the chevron below is the affordance. */}
        <summary className="flex cursor-pointer list-none items-center gap-3 [&::-webkit-details-marker]:hidden">
          <h2 id={`category-${category.id}`} className="text-xl" style={headingStyle}>
            {categoryText.name}
          </h2>

          {count > 0 ? (
            <span className="shrink-0 text-xs whitespace-nowrap" style={{ color: "var(--menu-muted)" }}>
              {count} {count === 1 ? strings.itemOne : strings.itemMany}
            </span>
          ) : null}

          {/* Hairline filling the row, anchoring the section title. */}
          <span aria-hidden className="h-px flex-1" style={{ backgroundColor: "var(--menu-border)" }} />

          <ChevronDown
            aria-hidden
            className="menu-section-chevron size-4 shrink-0 transition-transform duration-200 group-open:rotate-180"
            style={{ color: "var(--menu-accent)" }}
          />
        </summary>

        <div className="space-y-5 pt-5">
          {categoryText.description ? (
            <p className="text-sm" style={{ color: "var(--menu-muted)" }}>
              {categoryText.description}
            </p>
          ) : null}

          <ul className="flex flex-col gap-4">
            {category.products.map((product) => {
              const text = localize(product, product.translations, locale);
              return (
              <li
                key={product.id}
                className="flex gap-4"
                style={{ opacity: product.is_available ? 1 : 0.5 }}
              >
                {product.image_url ? (
                  <MenuImage src={product.image_url} alt={text.name} productId={product.id} strings={strings} />
                ) : null}

                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2">
                    <ProductName productId={product.id} name={text.name} strings={strings} />
                    {product.is_featured ? (
                      <span
                        className="inline-flex shrink-0 items-center gap-1 text-[0.7rem] whitespace-nowrap"
                        style={{ color: "var(--menu-accent)" }}
                        title={strings.featured}
                      >
                        <Star className="size-3 fill-current" aria-hidden />
                        {strings.featured}
                      </span>
                    ) : null}
                    {!product.is_available ? (
                      <span className="text-[0.7rem] whitespace-nowrap" style={{ color: "var(--menu-muted)" }}>
                        {strings.soldOut}
                      </span>
                    ) : null}

                    {/* Dotted leader between name and price — a menu-typography staple. */}
                    <span
                      aria-hidden
                      className="relative -top-1 min-w-6 flex-1 border-b border-dotted"
                      style={{ borderColor: "var(--menu-border)" }}
                    />

                    <span
                      className="shrink-0 font-medium tabular-nums"
                      style={{ color: "var(--menu-accent)", fontFamily: "var(--menu-heading-font)" }}
                    >
                      {formatPrice(product.price, currency)}
                    </span>
                  </div>

                  {text.description ? (
                    <ProductDescription productId={product.id} text={text.description} strings={strings} />
                  ) : null}
                </div>
              </li>
              );
            })}
          </ul>
        </div>
      </details>
    </section>
  );
}
