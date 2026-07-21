"use client";

import Image from "next/image";
import { useState } from "react";

import { Check, Copy, Download } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const SIZES = [256, 512, 1024, 2048] as const;

export function QrCard({
  name,
  slug,
  menuUrl,
  previewDataUrl,
  isPublished,
}: {
  name: string;
  slug: string;
  menuUrl: string;
  previewDataUrl: string;
  isPublished: boolean;
}) {
  const [size, setSize] = useState<string>("512");
  const [copied, setCopied] = useState(false);

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
          {/* The preview is a data: URL generated on the server, so it needs no
              network fetch and no next/image loader. */}
          <Image
            src={previewDataUrl}
            alt={`${name} menüsüne yönlendiren karekod`}
            width={200}
            height={200}
            unoptimized
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

        <div className="grid grid-cols-2 gap-2">
          {/* Plain links, not fetch+blob: the browser handles the download and
              Content-Disposition names the file. */}
          <Button
            variant="outline"
            render={<a href={`/api/qr/${slug}?format=png&size=${size}&download=1`} download />}
          >
            <Download className="size-4" aria-hidden />
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
