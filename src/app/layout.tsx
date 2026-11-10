import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import "./globals.css";

const sans = Inter({
  variable: "--font-sans-body",
  subsets: ["latin"],
});

const display = Fraunces({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "Scentoria Prive | Luxury Perfumes",
    template: "%s | Scentoria Prive",
  },
  description:
    "Scentoria Prive — luxury and niche perfumes, authentic bottles and decants, delivered with care.",
  icons: {
    icon: [
      { url: "/favicon.ico?v=16", sizes: "any" },
      { url: "/favicon.png?v=16", type: "image/png", sizes: "512x512" },
      { url: "/icon.png?v=16", type: "image/png", sizes: "512x512" },
    ],
    apple: [{ url: "/apple-icon.png?v=16", type: "image/png", sizes: "180x180" }],
    shortcut: ["/favicon.ico?v=16"],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${sans.variable} ${display.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full min-w-0 flex-col overflow-x-clip bg-bg text-fg" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
