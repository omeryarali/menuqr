import { parseOpeningHours } from "@/lib/opening-hours";
import type { Category, Product, Restaurant } from "@/types/database";

export type ReadinessCheck = {
  id: string;
  label: string;
  done: boolean;
  href: string;
};

export type Readiness = {
  checks: ReadinessCheck[];
  done: number;
  total: number;
  percent: number;
  /** Not yet done, in the order they should be tackled. */
  remaining: ReadinessCheck[];
};

/**
 * How complete one restaurant's menu is.
 *
 * Exists because features keep shipping that owners never discover — three of
 * four restaurants had no opening hours the week after that shipped. This turns
 * "we built it" into "you can see it's missing, here's the link".
 *
 * Pure, and computed from data the dashboard already loads, so showing it costs
 * no extra queries. Every check is achievable: a list that can't reach 100% is
 * just nagging.
 *
 * Order is the order you'd actually do them, with publishing last — it is the
 * finish line, not a prerequisite.
 */
export function getRestaurantReadiness(
  restaurant: Restaurant,
  categories: Category[],
  products: Product[],
): Readiness {
  const mine = {
    categories: categories.filter((c) => c.restaurant_id === restaurant.id),
    products: products.filter((p) => p.restaurant_id === restaurant.id),
  };

  const manage = `/dashboard/restaurants/${restaurant.id}`;
  const scoped = (path: string) => `${path}?restaurant=${restaurant.id}`;

  const checks: ReadinessCheck[] = [
    {
      id: "categories",
      label: "Kategori ekleyin",
      done: mine.categories.length > 0,
      href: scoped("/dashboard/categories"),
    },
    {
      id: "products",
      label: "Ürün ekleyin",
      done: mine.products.length > 0,
      href: scoped("/dashboard/products"),
    },
    {
      id: "contact",
      label: "Adres veya telefon ekleyin",
      done: Boolean(restaurant.address?.trim() || restaurant.phone?.trim()),
      href: manage,
    },
    {
      id: "hours",
      label: "Çalışma saatlerini girin",
      done: parseOpeningHours(restaurant.opening_hours) !== null,
      href: manage,
    },
    {
      id: "description",
      label: "Kısa bir açıklama yazın",
      done: Boolean(restaurant.description?.trim()),
      href: manage,
    },
    {
      // A menu with no photos still works, so this is a suggestion — one image
      // is enough to tick it rather than demanding every dish have one.
      id: "images",
      label: "Ürünlere görsel ekleyin",
      done: mine.products.some((p) => Boolean(p.image_url)),
      href: scoped("/dashboard/products"),
    },
    {
      id: "published",
      label: "Menüyü yayınlayın",
      done: restaurant.is_published,
      href: manage,
    },
  ];

  const done = checks.filter((check) => check.done).length;

  return {
    checks,
    done,
    total: checks.length,
    percent: Math.round((done / checks.length) * 100),
    remaining: checks.filter((check) => !check.done),
  };
}
