import type { Metadata } from "next";
import { Chonburi, Cormorant_Garamond, Sarabun } from "next/font/google";
import "./globals.css";
import "./temple.css";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { Providers } from "./providers";
import { SITE_URL } from "@/lib/site";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-cormorant",
  display: "swap",
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
});

const sarabun = Sarabun({
  subsets: ["latin", "thai"],
  variable: "--font-sarabun",
  display: "swap",
  weight: ["300", "400", "500", "600"],
});

const chonburi = Chonburi({
  subsets: ["latin", "thai"],
  variable: "--font-chonburi",
  display: "swap",
  weight: "400",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Good, Bad & Ugly Thailand — Honest Thailand Insights",
    template: "%s | Good, Bad & Ugly Thailand",
  },
  description:
    "An honest guide to Thailand through articles, practical courses and individual advice.",
  keywords: [
    "Thailand expat",
    "living in Thailand",
    "Thailand travel tips",
    "move to Thailand",
    "Thailand visa",
    "Chiang Mai expat",
    "Thailand cost of living",
  ],
  authors: [{ name: "Good, Bad & Ugly Thailand" }],
  creator: "Good, Bad & Ugly Thailand",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://goodbadanduglythailand.com",
    siteName: "Good, Bad & Ugly Thailand",
    title: "Good, Bad & Ugly Thailand — Honest Thailand Insights",
    description:
      "Real, unfiltered advice on living, working, and thriving in Thailand.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Good, Bad & Ugly Thailand",
    description:
      "Real, unfiltered advice on living, working, and thriving in Thailand.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${cormorant.variable} ${sarabun.variable} ${chonburi.variable}`}>
      <body className="bg-cream font-sans text-charcoal antialiased min-h-screen flex flex-col">
        <Providers>
          <Nav />
          <main id="main" className="flex-1">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
