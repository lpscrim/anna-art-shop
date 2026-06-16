import { ImageWithFallback } from "@/app/_components/UI/Layout/ImageWithFallback";
import { getProjects } from "@/app/_data/projects";
import Button from "@/app/_components/UI/Layout/Button";
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
          {displayed
            .map((project, idx) => (
              <Link
                key={project.id}
                href={`/work?project=${project.id}`}
                className={`group cursor-crosshair${idx === 3 ? " hidden md:block" : ""}`}
              >
                <div className="relative aspect-4/5 bg-muted overflow-hidden mb-4 rounded-xs">
                  <ImageWithFallback
                    src={project.imageUrl}
                    alt={project.title}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    priority={idx < 2}
                    className={`object-cover transition-all duration-500 scale-110 group-hover:scale-115`}
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
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
