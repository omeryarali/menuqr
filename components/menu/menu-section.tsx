import { formatPrice } from "@/lib/utils/format";
import type { CategoryWithProducts } from "@/types/database";

export function MenuSection({ category, currency }: { category: CategoryWithProducts; currency: string }) {
  const headingStyle: React.CSSProperties = {
    fontFamily: "var(--menu-heading-font)",
    fontWeight: "var(--menu-heading-weight)" as React.CSSProperties["fontWeight"],
    letterSpacing: "var(--menu-heading-tracking)",
  };

  return (
    <section aria-labelledby={`category-${category.id}`} className="space-y-5">
      <div className="flex items-center gap-3">
        <h2 id={`category-${category.id}`} className="text-xl" style={headingStyle}>
          {category.name}
        </h2>
        {/* Hairline filling the row, anchoring the section title. */}
        <span aria-hidden className="h-px flex-1" style={{ backgroundColor: "var(--menu-border)" }} />
      </div>

      {category.description ? (
        <p className="-mt-2 text-sm" style={{ color: "var(--menu-muted)" }}>
          {category.description}
        </p>
      ) : null}

      <ul className="flex flex-col gap-4">
        {category.products.map((product) => (
          <li key={product.id} style={{ opacity: product.is_available ? 1 : 0.5 }}>
            <div className="flex items-baseline gap-2">
              <h3 className="font-medium" style={{ fontFamily: "var(--menu-heading-font)" }}>
                {product.name}
              </h3>
              {!product.is_available ? (
                <span className="text-[0.7rem] whitespace-nowrap" style={{ color: "var(--menu-muted)" }}>
                  Tükendi
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

            {product.description ? (
              <p className="mt-1 max-w-prose text-sm leading-relaxed text-pretty" style={{ color: "var(--menu-muted)" }}>
                {product.description}
              </p>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
