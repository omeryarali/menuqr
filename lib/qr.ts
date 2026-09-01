import "server-only";

import QRCode from "qrcode";

import { env } from "@/lib/env";

export type QrFormat = "png" | "svg";

/**
 * The menu URL a human sees: shown in the dashboard, copied to the clipboard,
 * shared on WhatsApp. Deliberately clean — a link pasted into a chat is not a
 * QR scan and must not be counted as one.
 */
export function menuUrl(slug: string): string {
  return `${env.NEXT_PUBLIC_SITE_URL}/menu/${slug}`;
}

/**
 * The URL encoded *into* the QR image. The ?src=qr marker is the only way to
 * tell a scan apart from any other visit — the server sees an identical request
 * either way. Keep these two functions in sync: if the marker ever changes,
 * every already-printed code keeps sending the old one.
 */
export function qrTargetUrl(slug: string): string {
  return `${menuUrl(slug)}?src=qr`;
}

/**
 * Error correction level M tolerates ~15% damage — the practical floor for a
 * code printed on a table tent that will get wet and scratched.
 */
const OPTIONS = {
  errorCorrectionLevel: "M",
  margin: 2,
} as const;

export const QR_MIN_SIZE = 128;
export const QR_MAX_SIZE = 2048;
export const QR_DEFAULT_SIZE = 512;

/** Clamps to a sane range so a hand-edited ?size= can't ask for a 40k bitmap. */
export function clampSize(input: string | null): number {
  // Number(null) and Number("") are 0, not NaN, so an absent ?size= has to be
  // caught here or it clamps to the minimum instead of the default.
  if (!input?.trim()) return QR_DEFAULT_SIZE;

  const parsed = Number(input);
  if (!Number.isFinite(parsed)) return QR_DEFAULT_SIZE;
  return Math.min(QR_MAX_SIZE, Math.max(QR_MIN_SIZE, Math.round(parsed)));
}

/**
 * The call to action printed under the code. Fixed for now: a per-restaurant
 * string would have to fit the same box at every size, which is a layout
 * problem worth solving only once someone actually needs it.
 */
export const QR_CAPTION = "Menü için okutun";

/*
 * Framed-code geometry, in modules — the code's own unit, so the frame keeps
 * its proportions whatever the version (and therefore module count) turns out
 * to be.
 */
const QUIET_ZONE = 4;
const FRAME_GAP = 2.5;
const OUTER_MARGIN = 1.5;
const FRAME_STROKE = 0.6;
const FRAME_RADIUS = 3;

const XML_ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&apos;",
};

const escapeXml = (value: string) => value.replace(/[&<>"']/g, (char) => XML_ESCAPES[char]);

/** One path for the whole symbol: horizontal runs of dark modules. */
function modulesPath(modules: QRCode.BitMatrix, offset: number): string {
  const size = modules.size;
  const parts: string[] = [];

  for (let row = 0; row < size; row++) {
    let col = 0;
    while (col < size) {
      if (!modules.get(row, col)) {
        col++;
        continue;
      }
      let run = 1;
      while (col + run < size && modules.get(row, col + run)) run++;
      parts.push(`M${col + offset} ${row + offset}h${run}v1h-${run}z`);
      col += run;
    }
  }

  return parts.join("");
}

/**
 * The code inside a frame, with the call to action under it.
 *
 * Built by hand from QRCode.create rather than wrapping the library's own SVG
 * output: the frame has to be positioned in module units, and string-surgery on
 * someone else's markup would break the day their renderer changes.
 *
 * Self-contained on purpose — no external font, no CSS — because the browser
 * rasterizes this same string to produce the PNG download, and an SVG drawn
 * into a canvas cannot load anything.
 */
export function renderFramedQrSvg(
  text: string,
  size = QR_DEFAULT_SIZE,
  caption = QR_CAPTION,
): string {
  const { modules } = QRCode.create(text, { errorCorrectionLevel: OPTIONS.errorCorrectionLevel });

  const inset = OUTER_MARGIN + FRAME_GAP + QUIET_ZONE;
  const width = modules.size + inset * 2;
  // The caption band grows with the code so the text keeps its relative size.
  const captionBand = Math.max(7, width * 0.12);
  const height = width + captionBand;
  const fontSize = captionBand * 0.55;

  // Centred between the code's bottom edge and the frame, then nudged down by
  // half a cap height. An explicit baseline rather than dominant-baseline,
  // which not every SVG renderer honours.
  const captionY = (width - inset + height - OUTER_MARGIN) / 2 + fontSize * 0.35;

  const round = (value: number) => Number(value.toFixed(2));

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${round((size * height) / width)}"`,
    ` viewBox="0 0 ${round(width)} ${round(height)}" role="img" aria-label="${escapeXml(caption)}">`,
    `<rect width="${round(width)}" height="${round(height)}" fill="#ffffff"/>`,
    `<rect x="${OUTER_MARGIN}" y="${OUTER_MARGIN}"`,
    ` width="${round(width - OUTER_MARGIN * 2)}" height="${round(height - OUTER_MARGIN * 2)}"`,
    ` rx="${FRAME_RADIUS}" fill="none" stroke="#000000" stroke-width="${FRAME_STROKE}"/>`,
    `<path fill="#000000" shape-rendering="crispEdges" d="${modulesPath(modules, inset)}"/>`,
    `<text x="${round(width / 2)}" y="${round(captionY)}" text-anchor="middle" fill="#000000"`,
    ` font-family="system-ui, -apple-system, Segoe UI, Roboto, sans-serif"`,
    ` font-size="${round(fontSize)}">${escapeXml(caption)}</text>`,
    `</svg>`,
  ].join("");
}

export async function renderQrPng(text: string, size: number): Promise<Buffer> {
  return QRCode.toBuffer(text, { ...OPTIONS, type: "png", width: size });
}

export async function renderQrSvg(text: string, size: number): Promise<string> {
  return QRCode.toString(text, { ...OPTIONS, type: "svg", width: size });
}

/** Data URL for previewing in an <img> without a second network round trip. */
export async function renderQrDataUrl(text: string, size = 256): Promise<string> {
  return QRCode.toDataURL(text, { ...OPTIONS, width: size });
}
