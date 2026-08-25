import { NextResponse, type NextRequest } from "next/server";

import { z } from "zod";

import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/track — records one public-menu event.
 *
 * Called fire-and-forget from the menu page (see components/menu/menu-tracker).
 * Always answers 204, whatever happens: the response must not reveal whether a
 * slug exists, and a failed count must never break the customer's menu.
 *
 * Deliberately client-triggered rather than counted during the server render:
 * the render also runs for crawlers and link-preview fetchers, which would
 * inflate every number. Requiring a browser that executes JS is a crude bot
 * filter, but it is the difference between "roughly real" and "meaningless".
 */
const bodySchema = z.object({
  slug: z.string().min(1).max(60),
  // Mirrors the CHECK in 0005_analytics.sql.
  eventType: z.enum(["view", "qr_scan"]),
});

const noContent = () => new NextResponse(null, { status: 204 });

export async function POST(request: NextRequest) {
  let parsed;
  try {
    parsed = bodySchema.safeParse(await request.json());
  } catch {
    return noContent();
  }
  if (!parsed.success) return noContent();

  const { slug, eventType } = parsed.data;
  const supabase = await createClient();

  // RLS scopes this to published restaurants for anonymous callers, so a draft
  // slug simply resolves to nothing and records no event.
  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("id, owner_id")
    .eq("slug", slug)
    .maybeSingle();

  if (!restaurant) return noContent();

  // Don't count the owner previewing their own menu — otherwise the numbers
  // mostly measure how often they open the dashboard.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user?.id === restaurant.owner_id) return noContent();

  await supabase.from("menu_events").insert({
    restaurant_id: restaurant.id,
    event_type: eventType,
  });

  return noContent();
}
