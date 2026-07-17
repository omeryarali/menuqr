import { formatPrice } from "@/lib/utils/format";
import { cn } from "@/lib/utils";
import type { CategoryWithProducts } from "@/types/database";

export function MenuSection({ category, currency }: { category: CategoryWithProducts; currency: string }) {
  return (
    <section aria-labelledby={`category-${category.id}`} className="space-y-4">
      <div className="space-y-1">
        <h2 id={`category-${category.id}`} className="text-xl font-semibold tracking-tight">
          {category.name}
        </h2>
        {category.description ? (
          <p className="text-muted-foreground text-sm">{category.description}</p>
        ) : null}
      </div>

      <ul className="divide-y">
        {category.products.map((product) => (
          <li
            key={product.id}
            className={cn("flex items-start justify-between gap-4 py-3", !product.is_available && "opacity-55")}
          >
            <div className="min-w-0 space-y-0.5">
              <p className="font-medium text-pretty">
                {product.name}
                {!product.is_available ? (
                  <span className="text-muted-foreground ml-2 text-xs font-normal">Tükendi</span>
                ) : null}
              </p>
              {product.description ? (
                <p className="text-muted-foreground text-sm text-pretty">{product.description}</p>
              ) : null}
            </div>
            <p className="shrink-0 font-medium tabular-nums">{formatPrice(product.price, currency)}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
