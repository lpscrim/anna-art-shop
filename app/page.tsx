import { Suspense } from "react";
import { About } from "./_components/Sections/Home/About";
import { Contact } from "./_components/Sections/Home/Contact";
import { Hero } from "./_components/Sections/Home/Hero";
import { Projects } from "./_components/Sections/Home/Projects";
import { ProjectsSkeleton } from "./_components/Sections/Home/ProjectsSkeleton";

function OrganizationJsonLd() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://annamaiaart.com";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Annamaiaart",
    url: siteUrl,
    description:
      "The portfolio of AnnaMaiaArt showcasing landscape and abstract paintings.",
    sameAs: ["https://www.instagram.com/annamaiaart/"],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

export default function Home() {
  return (
    <main className="min-h-lvh">
      <OrganizationJsonLd />
      <Hero />
      <Suspense fallback={<ProjectsSkeleton />}>
        <Projects />
      </Suspense>
      <About />
      <Contact />
    </main>
  );
}
