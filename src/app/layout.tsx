import type { Metadata } from "next";
import localFont from "next/font/local";
import { DM_Sans, Playfair_Display } from "next/font/google";
import "./globals.css";

const sans = DM_Sans({
  variable: "--font-sans-body",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const tommy = localFont({
  src: "../fonts/MADETommySoft.otf",
  variable: "--font-tommy",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Scentoria | Luxury Perfumes",
    template: "%s | Scentoria",
  },
  description:
    "Scentoria — luxury and niche perfumes, authentic bottles and decants, delivered with care.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${sans.variable} ${playfair.variable} ${tommy.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-bg text-fg" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
