import type { Metadata, Viewport } from "next";
import { getSiteUrl } from './_lib/siteUrl';

import "./globals.css";
import { Header } from "./_components/Sections/Header";
import { Footer } from "./_components/Sections/Footer";
import { CartShell } from "./_components/Cart/CartShell";
import MailingListPopup from "./_components/MailingListPopup";

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
    default: "Annamaiaart",
    template: "%s | Annamaiaart",
  },
  description:
    "The portfolio of AnnaMaiaArt showcasing landscape and abstract paintings.",
  keywords: seoKeywords,
  category: "art",
  authors: [{ name: "Anna Maia" }],
  creator: "Anna Maia",
  publisher: "Anna Maia",
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName: "Annamaiaart",
    title: "Annamaiaart",
    description:
      "The portfolio of AnnaMaiaArt showcasing landscape and abstract paintings.",
    locale: "en_GB",
  },
  twitter: {
    card: "summary_large_image",
    title: "Annamaiaart",
    description:
      "The portfolio of AnnaMaiaArt showcasing landscape and abstract paintings.",
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
          <MailingListPopup />
        </CartShell>
      </body>
    </html>
  );
}
