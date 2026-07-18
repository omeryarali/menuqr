import type { Metadata } from "next";
import { Geist_Mono, Karla, Playfair_Display_SC } from "next/font/google";

import { Toaster } from "@/components/ui/sonner";

import "./globals.css";

/**
 * Type pairing from the MenuQR design system (design-system/menuqr/MASTER.md):
 * Karla for UI/body, Playfair Display SC for display headings. latin-ext is
 * required — without it Turkish ğ/ş/ı render from a fallback font.
 *
 * Karla registers as --font-sans, which is what the Tailwind theme actually
 * reads (the previous Geist setup exposed --font-geist-sans and was silently
 * never applied).
 */
const karla = Karla({
  subsets: ["latin", "latin-ext"],
  variable: "--font-sans",
  display: "swap",
});

const playfairSC = Playfair_Display_SC({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "700"],
  variable: "--font-display",
  display: "swap",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: {
    default: "MenuQR",
    template: "%s · MenuQR",
  },
  description: "Restoranlar için QR menü. Menünü hazırla, yayınla, karekodu yazdır.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="tr"
      className={`${karla.variable} ${playfairSC.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        {children}
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
