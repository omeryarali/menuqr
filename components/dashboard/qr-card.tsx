"use client";

import { useMemo, useState } from "react";

import Link from "next/link";

import { Check, Copy, Download, Loader2, Printer } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const SIZES = [256, 512, 1024, 2048] as const;

export function QrCard({
  id,
  name,
  slug,
  menuUrl,
  qrSvg,
  isPublished,
}: {
  id: string;
  name: string;
  slug: string;
  menuUrl: string;
  /** The framed artwork, rendered on the server. Preview, SVG and PNG all
   *  come from this one string, so they cannot drift apart. */
  qrSvg: string;
  isPublished: boolean;
}) {
  const [size, setSize] = useState<string>("512");
  const [copied, setCopied] = useState(false);
  const [rendering, setRendering] = useState(false);

  const svgUrl = useMemo(
    () => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(qrSvg)}`,
    [qrSvg],
  );

  /**
   * PNG from the same SVG, drawn in the browser.
   *
   * The server cannot rasterize the caption without a font rasterizer, so the
   * canvas does it here: the SVG is self-contained, which is the one thing
   * drawImage requires of it.
   */
  async function downloadPng() {
    setRendering(true);
    try {
      const px = Number(size);
      const image = new window.Image();

      await new Promise<void>((resolve, reject) => {
        image.onload = () => resolve();
        image.onerror = () => reject(new Error("SVG could not be decoded"));
        image.src = svgUrl;
      });

      const canvas = document.createElement("canvas");
      canvas.width = px;
      // The framed artwork is taller than it is wide; keep its own ratio.
      canvas.height = Math.round((px * image.naturalHeight) / image.naturalWidth);

      const context = canvas.getContext("2d");
      if (!context) throw new Error("Canvas 2D unavailable");
      context.drawImage(image, 0, 0, canvas.width, canvas.height);

      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/png"),
      );
      if (!blob) throw new Error("Canvas produced no blob");

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${slug}-qr.png`;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("PNG oluşturulamadı. SVG olarak indirmeyi deneyin.");
    } finally {
      setRendering(false);
    }
  }

  async function copyUrl() {
    try {
      await navigator.clipboard.writeText(menuUrl);
      setCopied(true);
      toast.success("Menü adresi kopyalandı.");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API needs a secure context and can be blocked by permissions.
      toast.error("Kopyalanamadı. Adresi seçip elle kopyalayın.");
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <CardTitle className="truncate">{name}</CardTitle>
            <CardDescription className="truncate">{menuUrl}</CardDescription>
          </div>
          <Badge variant={isPublished ? "default" : "secondary"}>{isPublished ? "Yayında" : "Taslak"}</Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex justify-center rounded-lg border bg-white p-4">
          {/* Plain img: a data: URL of our own SVG, which next/image would only
              hand back unchanged. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={svgUrl}
            alt={`${name} menüsüne yönlendiren karekod`}
            className="w-full max-w-[220px]"
          />
        </div>

        {!isPublished ? (
          <p className="text-muted-foreground text-xs">
            Bu restoran taslak. Karekod sizin için çalışır, ancak siz yayınlayana kadar müşteri
            taradığında 404 döner.
          </p>
        ) : null}

        <div className="flex items-center gap-2">
          {/* Base UI emits null when a selection is cleared; this Select has no
              clear affordance, so ignore it rather than widening the state.
              items map so the trigger shows "512px", not the bare value "512". */}
          <Select
            value={size}
            onValueChange={(value) => value && setSize(value)}
            items={Object.fromEntries(SIZES.map((s) => [String(s), `${s}px`]))}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SIZES.map((option) => (
                <SelectItem key={option} value={String(option)}>
                  {option}px
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant="outline" size="icon" onClick={copyUrl} aria-label="Menü adresini kopyala">
            {copied ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}
          </Button>
        </div>

        <Button variant="secondary" className="w-full" render={<Link href={`/qr-print/${id}`} />}>
          <Printer className="size-4" aria-hidden />
          Yazdırılabilir kart
        </Button>

        <div className="grid grid-cols-2 gap-2">
          {/* The SVG stays a plain link: the route returns the same artwork and
              Content-Disposition names the file. */}
          {/* PNG is built here rather than fetched: the route cannot draw the
              caption without a font rasterizer. */}
          <Button variant="outline" onClick={downloadPng} disabled={rendering}>
            {rendering ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : (
              <Download className="size-4" aria-hidden />
            )}
            PNG
          </Button>
          <Button
            variant="outline"
            render={<a href={`/api/qr/${slug}?format=svg&size=${size}&download=1`} download />}
          >
            <Download className="size-4" aria-hidden />
            SVG
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
