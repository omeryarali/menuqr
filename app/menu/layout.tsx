import { Fraunces } from "next/font/google";

/**
 * Display serif for the "classic" menu theme, scoped to /menu routes so the
 * dashboard doesn't pay for it. Exposed as --font-menu-serif, which
 * globals.css wires into [data-menu-theme="classic"].
 */
const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-menu-serif",
  display: "swap",
});

export default function MenuLayout({ children }: { children: React.ReactNode }) {
  return <div className={fraunces.variable}>{children}</div>;
}
