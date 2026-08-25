import type { DailyPoint } from "@/services/analytics";

/**
 * 14-day stacked bar chart, built from divs.
 *
 * No chart library on purpose: this is one chart with fixed dimensions, and a
 * charting dependency would cost more bundle than the whole dashboard. Heights
 * are percentages of the busiest day, so the shape stays readable whether the
 * peak is 3 visits or 3000.
 */
export function AnalyticsChart({ data }: { data: DailyPoint[] }) {
  const peak = Math.max(1, ...data.map((d) => d.views + d.qrScans));

  return (
    <div className="space-y-3">
      <div className="flex items-end justify-between gap-1 sm:gap-2" style={{ height: 160 }}>
        {data.map((point) => {
          const total = point.views + point.qrScans;
          const viewPct = (point.views / peak) * 100;
          const scanPct = (point.qrScans / peak) * 100;
          const label = new Date(point.day).toLocaleDateString("tr-TR", { day: "numeric", month: "short" });

          return (
            <div key={point.day} className="flex flex-1 flex-col items-center gap-1.5">
              <div
                className="flex w-full flex-col justify-end"
                style={{ height: 130 }}
                // Native tooltip + screen-reader text: the numbers must be
                // reachable without hovering a 12px-wide bar.
                title={`${label}: ${point.views} görüntülenme, ${point.qrScans} QR taraması`}
              >
                <span className="sr-only">
                  {label}: {point.views} görüntülenme, {point.qrScans} QR taraması
                </span>
                {scanPct > 0 ? (
                  <div
                    className="bg-primary w-full rounded-t-sm"
                    style={{ height: `${Math.max(scanPct, 2)}%` }}
                    aria-hidden
                  />
                ) : null}
                <div
                  className={`bg-primary/25 w-full ${scanPct > 0 ? "" : "rounded-t-sm"}`}
                  style={{ height: `${Math.max(viewPct, total > 0 ? 2 : 0)}%` }}
                  aria-hidden
                />
              </div>
              <span className="text-muted-foreground hidden text-[10px] tabular-nums sm:block">
                {label.split(" ")[0]}
              </span>
            </div>
          );
        })}
      </div>

      <div className="text-muted-foreground flex items-center justify-center gap-4 text-xs">
        <span className="flex items-center gap-1.5">
          <span className="bg-primary/25 size-2.5 rounded-sm" aria-hidden />
          Görüntülenme
        </span>
        <span className="flex items-center gap-1.5">
          <span className="bg-primary size-2.5 rounded-sm" aria-hidden />
          QR taraması
        </span>
      </div>
    </div>
  );
}
