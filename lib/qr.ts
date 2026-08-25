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
  const parsed = Number(input);
  if (!Number.isFinite(parsed)) return QR_DEFAULT_SIZE;
  return Math.min(QR_MAX_SIZE, Math.max(QR_MIN_SIZE, Math.round(parsed)));
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
