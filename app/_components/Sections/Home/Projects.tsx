import { getProjects } from "@/app/_data/projects";
import Button from "@/app/_components/UI/Layout/Button";
import { Card } from "@/app/_components/UI/Layout/Card";
import Link from "next/link";

export async function Projects() {
  const projects = await getProjects();

  // Show featured projects; fall back to 4 most recent if none are marked
  const featured = projects.filter((p) => p.featured);
  const displayed = featured.length > 0 ? featured.slice(0, 4) : projects.slice(0, 4);

  return (
    <section id="work" className="min-h-screen px-6 py-24 ">
      <div className=" mx-auto">
        <div className="mb-16 xl:mb-24">
          <h2 className="text-3xl md:text-5xl tracking-tight">
            Recent work
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {displayed.map((project, idx) => (
            <Link
              key={project.id}
              href={`/work?project=${project.id}`}
              className={`cursor-crosshair${idx === 3 ? " hidden md:block" : ""}`}
            >
              <div className="relative group">
                <Card
                  imageUrl={project.imageUrl}
                  title={project.title}
                  categories={project.categories}
                  galleryImages={project.galleryImages}
                  year={project.year}
                  imageSizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  imageWidth={900}
                  imageHeight={1125}
                />
                <div className="absolute inset-x-0 text-lg top-4 px-4 group-hover:opacity-100 opacity-0 flex flex-col group-hover:mt-2 z-60 transition-all duration-500 pointer-events-none max-w-full">
                  <div className="hidden md:flex flex-wrap gap-x-4 gap-y-1 text-background wrap-break-word max-w-full">
                    <span className="font-semibold">{project.title}</span>
                    <span>{project.year}</span>
                  </div>
                  {project.stock_level === 0 && (
                    <span className="text-background">N/A</span>
                  )}
                </div>
                <div className="md:hidden text-base px-4 py-2 bg-background text-foreground/90 flex flex-col z-50 pointer-events-none max-w-full">
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mx-auto wrap-break-word max-w-full">
                    <span className="font-semibold">{project.title},</span>
                    <span>{project.dimensions},</span>
                    <span>£{project.price_hw / 100}</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
        <div className="mt-24 text-center  ">
          <Button size="xl">
            <Link href="/work">See More</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
