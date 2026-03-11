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

  return "https://example.com";
}

const siteUrl = new URL(getSiteUrl()).origin;


const seoKeywords = [
  "photography",
  "fine art photography",
  "visual art",
  "portfolio",
  // TODO: Add your keywords here
];



export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Art Shop",
    template: "%s | Art Shop",
  },
  description:
    "Portfolio website showcasing photography and visual art projects.",
  alternates: {
    canonical: "/",
  },
  keywords: seoKeywords,
  category: "Photography",
  authors: [{ name: "Your Name" }],
  creator: "Your Name",
  publisher: "Art Shop",
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName: "Art Shop",
    title: "Art Shop",
    description:
      "Portfolio website showcasing photography and visual art projects.",
    locale: "en_GB",
  },
  twitter: {
    card: "summary_large_image",
    title: "Art Shop",
    description:
      "Portfolio website showcasing photography and visual art projects.",
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
