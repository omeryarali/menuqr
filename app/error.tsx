"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";

/**
 * Root error boundary. Next strips the real message in production and leaves
 * only `digest`, so log it here and show the user something honest but generic.
 */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">Bir şeyler ters gitti</h1>
      <p className="text-muted-foreground max-w-sm text-sm text-pretty">
        Sayfa yüklenemedi. Tekrar deneyin — sorun sürerse ayrıntılar sunucu kayıtlarında.
      </p>
      {error.digest ? <code className="text-muted-foreground text-xs">Kod: {error.digest}</code> : null}
      <Button onClick={reset} variant="outline" className="mt-2">
        Tekrar dene
      </Button>
    </div>
  );
}
