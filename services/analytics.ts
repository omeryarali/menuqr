import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { MenuEventType } from "@/types/database";

import { listOwnedRestaurantIds } from "./restaurants";

export type AnalyticsTotals = { views: number; qrScans: number };

export type DailyPoint = { day: string; views: number; qrScans: number };

export type RestaurantBreakdown = {
  id: string;
  name: string;
  slug: string;
  isPublished: boolean;
  views: number;
  qrScans: number;
};

export type AnalyticsOverview = {
  allTime: AnalyticsTotals;
  last7: AnalyticsTotals;
  daily: DailyPoint[];
  byRestaurant: RestaurantBreakdown[];
};

const DAILY_WINDOW = 14;

/**
 * Counts rows without transferring them (head + exact count), so a popular
 * menu doesn't drag megabytes of events into the dashboard.
 */
async function countEvents(
  supabase: Awaited<ReturnType<typeof createClient>>,
  restaurantIds: string[],
  eventType: MenuEventType,
  since?: Date,
): Promise<number> {
  let query = supabase
    .from("menu_events")
    .select("id", { count: "exact", head: true })
    .in("restaurant_id", restaurantIds)
    .eq("event_type", eventType);

  if (since) query = query.gte("created_at", since.toISOString());

  const { count, error } = await query;
  if (error) throw new Error(`Failed to count events: ${error.message}`);
  return count ?? 0;
}

/**
 * Dashboard analytics for the signed-in owner.
 *
 * menu_events has no public-read policy (write-only for visitors, owner-only
 * for reads), so RLS alone would already scope this. The explicit restaurant
 * scoping is still here for the `restaurantId` filter and to keep the pattern
 * identical to the other owner-facing services — see services/restaurants.ts.
 */
export async function getAnalyticsOverview(restaurantId?: string): Promise<AnalyticsOverview> {
  const supabase = await createClient();
  const ownedIds = await listOwnedRestaurantIds();

  // Intersect with ownership so a hand-crafted ?restaurant=<someone-else's-id>
  // can't widen the result.
  const scope = restaurantId ? (ownedIds.includes(restaurantId) ? [restaurantId] : []) : ownedIds;

  const empty: AnalyticsOverview = {
    allTime: { views: 0, qrScans: 0 },
    last7: { views: 0, qrScans: 0 },
    daily: [],
    byRestaurant: [],
  };
  if (scope.length === 0) return empty;

  const since7 = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [allViews, allScans, weekViews, weekScans, dailyRows, restaurants] = await Promise.all([
    countEvents(supabase, scope, "view"),
    countEvents(supabase, scope, "qr_scan"),
    countEvents(supabase, scope, "view", since7),
    countEvents(supabase, scope, "qr_scan", since7),
    supabase.rpc("menu_event_daily_counts", {
      p_days: DAILY_WINDOW,
      p_restaurant_id: restaurantId ?? null,
    }),
    supabase.from("restaurants").select("id, name, slug, is_published").in("id", scope),
  ]);

  if (dailyRows.error) throw new Error(`Failed to load daily counts: ${dailyRows.error.message}`);
  if (restaurants.error) throw new Error(`Failed to load restaurants: ${restaurants.error.message}`);

  // The RPC returns one row per (day, event_type) and skips days with no
  // events. Fill the gaps so the chart shows a continuous 14-day axis rather
  // than silently compressing quiet days away.
  const byDay = new Map<string, DailyPoint>();
  for (let i = DAILY_WINDOW - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    const key = d.toISOString().slice(0, 10);
    byDay.set(key, { day: key, views: 0, qrScans: 0 });
  }
  for (const row of dailyRows.data ?? []) {
    const point = byDay.get(row.day);
    if (!point) continue;
    if (row.event_type === "qr_scan") point.qrScans += Number(row.event_count);
    else point.views += Number(row.event_count);
  }

  // Per-restaurant totals: two count queries each. Fine at MVP scale (a handful
  // of restaurants); if an owner ever has dozens, replace with a grouped RPC.
  const byRestaurant = await Promise.all(
    (restaurants.data ?? []).map(async (r) => ({
      id: r.id,
      name: r.name,
      slug: r.slug,
      isPublished: r.is_published,
      views: await countEvents(supabase, [r.id], "view"),
      qrScans: await countEvents(supabase, [r.id], "qr_scan"),
    })),
  );

  byRestaurant.sort((a, b) => b.views + b.qrScans - (a.views + a.qrScans));

  return {
    allTime: { views: allViews, qrScans: allScans },
    last7: { views: weekViews, qrScans: weekScans },
    daily: [...byDay.values()],
    byRestaurant,
  };
}
