import { Suspense } from "react";
import type { Metadata } from "next";
import { getProjects } from "../_data/projects";
import { WorkGallery } from "../_components/Sections/Work/WorkGallery";

export const metadata: Metadata = {
  title: "Work",
  description:
    "Browse landscape and abstract paintings by Anna Maia. Oil on canvas, mixed media, and original artwork available to purchase.",
};



export default async function WorkPage() {
  const projects = await getProjects();

  // Count categories
  const categoryCounts = projects.reduce((acc, project) => {
    project.categories.forEach((category) => {
      acc[category] = (acc[category] || 0) + 1;
    });
    return acc;
  }, {} as Record<string, number>);

  // Sort by count (descending)
  const sortedCategories = Object.entries(categoryCounts).sort(
    (a, b) => b[1] - a[1]
  );

  return (
    <main>
      <Suspense fallback={null}>
        <WorkGallery 
          projects={projects} 
          categoryCounts={sortedCategories} 
        />
      </Suspense>
    </main>
  );
}
