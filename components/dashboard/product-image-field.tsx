"use client";

import { useRef, useState } from "react";

import { ImagePlus, Link2, Loader2, Trash2, Upload } from "lucide-react";

import { FieldError } from "@/components/shared/field-error";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import {
  ACCEPTED_IMAGE_TYPES,
  buildImagePath,
  MAX_IMAGE_BYTES,
  PRODUCT_IMAGE_BUCKET,
} from "@/lib/storage";

type Props = {
  defaultValue?: string | null;
  /** Owning restaurant of the currently selected category — the upload folder. */
  restaurantId?: string;
  errors?: string[];
};

/**
 * Picks a product photo: upload a file, or paste a URL.
 *
 * Uploads go straight from the browser to Supabase Storage rather than through
 * a server action — a 5 MB file would otherwise be base64'd into the action
 * payload and back out again. Storage's RLS is what authorizes the write, so
 * nothing is trusted to the client beyond the file itself.
 *
 * Whatever ends up chosen is mirrored into a hidden `imageUrl` input, so the
 * surrounding form submits exactly as it did when this was a plain text field.
 */
export function ProductImageField({ defaultValue, restaurantId, errors }: Props) {
  const [url, setUrl] = useState(defaultValue ?? "");
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [previewFailed, setPreviewFailed] = useState(false);

  const fileInput = useRef<HTMLInputElement>(null);

  async function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    // Let the same file be re-picked after an error, which needs the input reset.
    event.target.value = "";
    if (!file) return;

    setUploadError(null);

    if (!restaurantId) {
      setUploadError("Önce bir kategori seçin.");
      return;
    }
    // Storage enforces both of these too; checking here just turns a failed
    // round trip into an instant, readable message.
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      setUploadError("Yalnızca JPG, PNG, WebP veya AVIF yükleyebilirsiniz.");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setUploadError("Görsel en fazla 5 MB olabilir.");
      return;
    }

    setUploading(true);
    try {
      const supabase = createClient();
      const path = buildImagePath(restaurantId, file);

      const { error } = await supabase.storage.from(PRODUCT_IMAGE_BUCKET).upload(path, file, {
        cacheControl: "31536000",
        upsert: false,
      });
      if (error) throw error;

      const { data } = supabase.storage.from(PRODUCT_IMAGE_BUCKET).getPublicUrl(path);
      setUrl(data.publicUrl);
      setPreviewFailed(false);
      setShowUrlInput(false);
    } catch {
      setUploadError("Yükleme başarısız oldu. Lütfen tekrar deneyin.");
    } finally {
      setUploading(false);
    }
  }

  function clear() {
    setUrl("");
    setUploadError(null);
    setPreviewFailed(false);
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="product-image-upload">Görsel</Label>

      {/* The real form value. Everything above is just a way to set it. */}
      <input type="hidden" name="imageUrl" value={url} />

      <div className="flex items-start gap-3">
        <div className="bg-muted flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border">
          {url && !previewFailed ? (
            // Any pasted host is possible here, and this is a dashboard-only
            // preview rather than menu output — plain <img> is correct.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={url}
              alt="Seçilen görselin önizlemesi"
              className="size-full object-cover"
              onError={() => setPreviewFailed(true)}
            />
          ) : (
            <ImagePlus className="text-muted-foreground size-6" aria-hidden />
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={uploading}
              onClick={() => fileInput.current?.click()}
            >
              {uploading ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : (
                <Upload className="size-4" aria-hidden />
              )}
              {uploading ? "Yükleniyor…" : "Dosya yükle"}
            </Button>

            {url ? (
              <Button type="button" variant="ghost" size="sm" onClick={clear} disabled={uploading}>
                <Trash2 className="size-4" aria-hidden />
                Kaldır
              </Button>
            ) : null}
          </div>

          <input
            id="product-image-upload"
            ref={fileInput}
            type="file"
            accept={ACCEPTED_IMAGE_TYPES.join(",")}
            className="sr-only"
            onChange={handleFile}
          />

          <button
            type="button"
            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-xs underline underline-offset-4"
            onClick={() => setShowUrlInput((open) => !open)}
          >
            <Link2 className="size-3" aria-hidden />
            {showUrlInput ? "Adres alanını gizle" : "veya bir görsel adresi yapıştır"}
          </button>

          {showUrlInput ? (
            <Input
              type="url"
              inputMode="url"
              placeholder="https://…"
              value={url}
              onChange={(event) => {
                setUrl(event.target.value);
                setPreviewFailed(false);
              }}
              aria-label="Görsel adresi"
            />
          ) : null}

          {previewFailed && url ? (
            <p className="text-muted-foreground text-xs">Bu adresten görsel yüklenemedi.</p>
          ) : null}
          {uploadError ? <p className="text-destructive text-sm">{uploadError}</p> : null}
          <FieldError messages={errors} />
        </div>
      </div>
    </div>
  );
}
