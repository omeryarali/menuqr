import { env } from "@/lib/env";
import { parseOpeningHours, toSchemaOpeningHours } from "@/lib/opening-hours";
import type { PublicMenu } from "@/types/database";

/**
 * schema.org Restaurant + Menu markup for the public menu.
 *
 * Lets search engines and maps show the hours, address and phone directly in
 * results, which is the closest thing to free distribution a small restaurant
 * gets. Only emitted for published menus — a draft must not be indexable, and
 * the page already sends robots noindex in that case.
 *
 * dangerouslySetInnerHTML is the standard way to emit JSON-LD; the payload is
 * JSON.stringify'd (not interpolated), and `<` is escaped so a product name
 * containing "</script>" cannot break out of the tag.
 */
export function MenuJsonLd({ menu }: { menu: PublicMenu }) {
  if (!menu.is_published) return null;

  const url = `${env.NEXT_PUBLIC_SITE_URL}/menu/${menu.slug}`;

  const payload = {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    name: menu.name,
    url,
    ...(menu.description ? { description: menu.description } : {}),
    ...(menu.phone ? { telephone: menu.phone } : {}),
    ...(menu.address ? { address: { "@type": "PostalAddress", streetAddress: menu.address } } : {}),
    ...(toSchemaOpeningHours(parseOpeningHours(menu.opening_hours))
      ? { openingHoursSpecification: toSchemaOpeningHours(parseOpeningHours(menu.opening_hours)) }
      : {}),
    hasMenu: {
      "@type": "Menu",
      url,
      hasMenuSection: menu.categories.map((category) => ({
        "@type": "MenuSection",
        name: category.name,
        ...(category.description ? { description: category.description } : {}),
        hasMenuItem: category.products.map((product) => ({
          "@type": "MenuItem",
          name: product.name,
          ...(product.description ? { description: product.description } : {}),
          ...(product.image_url ? { image: product.image_url } : {}),
          offers: {
            "@type": "Offer",
            price: product.price,
            priceCurrency: menu.currency,
            availability: product.is_available
              ? "https://schema.org/InStock"
              : "https://schema.org/OutOfStock",
          },
        })),
      })),
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(payload).replace(/</g, "\u003c") }}
    />
  );
}
