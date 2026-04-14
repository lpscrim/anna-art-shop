import type { Metadata, Viewport } from "next";

import "./globals.css";
import { Header } from "./_components/Sections/Header";
import { Footer } from "./_components/Sections/Footer";
import { CartShell } from "./_components/Cart/CartShell";


function getSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit;

  const vercel = process.env.VERCEL_URL;
  if (vercel) return `https://${vercel}`;

  return "https://annamaiaart.com";
}

const siteUrl = new URL(getSiteUrl()).origin;


const seoKeywords = [
  "landscape art",
  "fine art",
  "visual art",
  "nature art",
  "oil painting",
  "portfolio",
  "art shop",
  "art for sale",
  "art prints",
  "original art",
  "art collection",
  "art gallery",
  "artwork",];



export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Art Shop",
    template: "%s | Art Shop",
  },
  description:
    "Portfolio website showcasing landscape art.",
  alternates: {
    canonical: "/",
  },
  keywords: seoKeywords,
  category: "art",
  authors: [{ name: "Annamaiaart" }],
  creator: "Annamaiaart",
  publisher: "Art Shop",
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName: "Art Shop",
    title: "Art Shop",
    description:
      "Portfolio website showcasing landscape art.",
    locale: "en_GB",
  },
  twitter: {
    card: "summary_large_image",
    title: "Art Shop",
    description:
      "Portfolio website showcasing landscape art.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" >
      <body
        className="antialiased bg-background text-foreground w-full"
      >
        <CartShell>
          <Header />
          {children}
          <Footer />
        </CartShell>
      </body>
    </html>
  );
}
