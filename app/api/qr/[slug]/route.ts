import { NextResponse, type NextRequest } from "next/server";

import { env } from "@/lib/env";
import { clampSize, renderQrPng, renderQrSvg, type QrFormat } from "@/lib/qr";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/qr/{slug}?format=png|svg&size=512&download=1
 *
 * Scoped to a real restaurant slug on purpose. Accepting an arbitrary ?data=
 * would turn this into an open QR generator anyone could point at a phishing
 * URL while wearing this app's domain.
 */
export async function GET(request: NextRequest, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  const { searchParams } = request.nextUrl;

  const format: QrFormat = searchParams.get("format") === "svg" ? "svg" : "png";
  const size = clampSize(searchParams.get("size"));

  // RLS decides visibility: published to anyone, unpublished to its owner only.
  // So an owner can print codes before going live, but nobody can enumerate
  // other people's draft slugs.
  const supabase = await createClient();
  const { data: restaurant, error } = await supabase
    .from("restaurants")
    .select("slug, name")
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: "Failed to load restaurant" }, { status: 500 });
  }
  if (!restaurant) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const target = `${env.NEXT_PUBLIC_SITE_URL}/menu/${restaurant.slug}`;
  const filename = `${restaurant.slug}-qr.${format}`;
  const disposition = searchParams.get("download") === "1" ? "attachment" : "inline";

  const headers: Record<string, string> = {
    "Content-Disposition": `${disposition}; filename="${filename}"`,
    // Private: the response for a draft restaurant is owner-specific, and a
    // shared/CDN cache must not hand it to the next visitor.
    "Cache-Control": "private, max-age=3600",
  };

  if (format === "svg") {
    const svg = await renderQrSvg(target, size);
    return new NextResponse(svg, {
      headers: { ...headers, "Content-Type": "image/svg+xml; charset=utf-8" },
    });
  }

  const png = await renderQrPng(target, size);
  return new NextResponse(new Uint8Array(png), {
    headers: { ...headers, "Content-Type": "image/png" },
  });
}
