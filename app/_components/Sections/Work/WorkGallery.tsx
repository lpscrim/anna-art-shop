
"use client";

import  { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { PhotoModal } from "./PhotoModal";
import { MainGallery } from "./MainGallery";

interface Project {
  id: number;
  title: string;
  categories: string[];
  year: string;
  imageUrl: string;
  galleryImages?: string[];
  text?: string;
  price_hw: number;
  stock_level: number;
  stripe_price_id: string | null;
}

interface WorkGalleryProps {
  projects: Project[];
  categoryCounts: [string, number][];
}

export function WorkGallery({
  projects,
  categoryCounts,
}: WorkGalleryProps) {

  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [inStockOnly, setInStockOnly] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalImages, setModalImages] = useState<string[]>([]);
  const [modalIndex, setModalIndex] = useState<number>(0);
  const [isProject, setIsProject] = useState<boolean>(false);
  const [name, setName] = useState<string>("");
  const [year, setYear] = useState<string>("");
  const [text, setText] = useState<string>("");
  const [stripePriceId, setStripePriceId] = useState<string | null>(null);
  const [stockLevel, setStockLevel] = useState<number>(0);
  const [priceHw, setPriceHw] = useState<number>(0);

  const lastOpenedProjectIdRef = useRef<number | null>(null);

  // ── Live stock map (single batched poll) ─────────────────────────
  const [liveStock, setLiveStock] = useState<Record<string, number>>({});

  const allPriceIds = useMemo(
    () => projects.map((p) => p.stripe_price_id).filter((id): id is string => !!id),
    [projects]
  );

  useEffect(() => {
    if (allPriceIds.length === 0) return;
    const controller = new AbortController();

    async function pollStock() {
      try {
        const res = await fetch(
          `/api/stock?ids=${encodeURIComponent(allPriceIds.join(','))}`,
          { signal: controller.signal }
        );
        if (!res.ok) return;
        const { stock } = (await res.json()) as { stock: Record<string, number> };
        setLiveStock((prev) => {
          const changed = Object.keys(stock).some((k) => prev[k] !== stock[k]);
          return changed ? stock : prev;
        });
      } catch { /* ignore */ }
    }

    pollStock();
    const id = setInterval(pollStock, 30_000);
    return () => { controller.abort(); clearInterval(id); };
  }, [allPriceIds]);

  // Helper: get live stock for a price ID, falling back to server prop
  const getStock = useCallback(
    (project: Project) =>
      project.stripe_price_id && project.stripe_price_id in liveStock
        ? liveStock[project.stripe_price_id]
        : project.stock_level,
    [liveStock]
  );

  const projectsById = useMemo(() => {
    return new Map(projects.map((p) => [p.id, p] as const));
  }, [projects]);


  // Filtered projects by selected categories and stock filter
  const filteredProjects = useMemo(() => {
    let result = projects;
    if (selectedCategories.length > 0) {
      result = result.filter((p) => selectedCategories.every(cat => p.categories.includes(cat)));
    }
    if (inStockOnly) {
      result = result.filter((p) => getStock(p) > 0);
    }
    return result;
  }, [projects, selectedCategories, inStockOnly, getStock]);

  const inStockCount = useMemo(
    () => projects.filter((p) => getStock(p) > 0).length,
    [projects, getStock]
  );

  // Category counts
  const visibleCategoryCounts: Record<string, number> = filteredProjects.reduce((acc, project) => {
    project.categories.forEach((category) => {
      acc[category] = (acc[category] || 0) + 1;
    });
    return acc;
  }, {} as Record<string, number>);

  // Use the array of [category, count] pairs for all categories
  const sortedVisibleCategories: [string, number][] = categoryCounts
    .map(([cat]) => [cat, visibleCategoryCounts[cat] || 0] as [string, number])
    .sort((a, b) => Number(b[1]) - Number(a[1]));




  // Add/remove category handlers
  const toggleCategory = (cat: string) => {
    if (selectedCategories.includes(cat)) {
      setSelectedCategories(selectedCategories.filter((c) => c !== cat));
    } else if (visibleCategoryCounts[cat] > 0) {
      setSelectedCategories([...selectedCategories, cat]);
    }
  };

  // Handler to open gallery
  const handleCardClick = (index: number, project: typeof projects[number]) => {
    const imgs = [project.imageUrl, ...(project.galleryImages || [])];
    setIsProject(true);
    setName(project.title);
    setYear(project.year);
    setModalImages(imgs);
    setModalIndex(0);
    setText(project.text || "");
    setStripePriceId(project.stripe_price_id ?? null);
    setStockLevel(getStock(project));
    setPriceHw(project.price_hw);
    setModalOpen(true);
  };

  // Deep link: /work?project={project.id}
  useEffect(() => {
    const projectParam = searchParams.get("project");
    if (!projectParam) return;

    const projectId = Number(projectParam);
    if (!Number.isFinite(projectId)) return;

    const project = projectsById.get(projectId);
    if (!project) return;

    if (lastOpenedProjectIdRef.current === projectId && modalOpen) return;
    lastOpenedProjectIdRef.current = projectId;

    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;

      setSelectedCategories([]);
      setInStockOnly(false);

      const imgs = [project.imageUrl, ...(project.galleryImages || [])];
      setIsProject(true);
      setName(project.title);
      setYear(project.year);
      setText(project.text || "");
      setStripePriceId(project.stripe_price_id ?? null);
      setStockLevel(getStock(project));
      setPriceHw(project.price_hw);
      setModalImages(imgs);
      setModalIndex(0);
      setModalOpen(true);
    });

    return () => {
      cancelled = true;
    };
  }, [searchParams, projectsById, modalOpen, getStock]);

  // Keep modal stock in sync with live polling
  const displayedStockLevel = modalOpen && stripePriceId && stripePriceId in liveStock
    ? liveStock[stripePriceId]
    : stockLevel;

  const handleCloseModal = () => {
    setModalOpen(false);

    // If this modal was opened via a deep link, clear the param so it doesn't reopen.
    const projectParam = searchParams.get("project");
    if (!projectParam) return;

    const next = new URLSearchParams(searchParams.toString());
    next.delete("project");
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  const handleThumbClick = (idx: number) => {
    setModalIndex(idx);
  };

  return (
    <section id="work" className="min-h-[75svh] px-6 pt-2 w-full">
      {!modalOpen && <MainGallery
        getStockLevel={getStock}
        selectedCategories={selectedCategories}
        setSelectedCategories={setSelectedCategories}
        inStockOnly={inStockOnly}
        setInStockOnly={setInStockOnly}
        filteredProjects={filteredProjects}
        totalCount={projects.length}
        inStockCount={inStockCount}
        sortedVisibleCategories={sortedVisibleCategories}
        toggleCategory={toggleCategory}
        onCardClick={handleCardClick}
      /> }
      <PhotoModal
        isOpen={modalOpen}
        image={modalImages[modalIndex] || ""}
        images={modalImages}
        index={modalIndex}
        onClose={handleCloseModal}
        onPrev={() => setModalIndex((prev) => (prev > 0 ? prev - 1 : prev))}
        onNext={() => setModalIndex((prev) => (prev < modalImages.length - 1 ? prev + 1 : prev))}
        hasPrev={modalIndex > 0}
        isProject={isProject}
        hasNext={modalIndex < modalImages.length - 1}
        name={name}
        year={year}
        text={text}
        changePhotoId={handleThumbClick}
        stripePriceId={stripePriceId}
        stockLevel={displayedStockLevel}
        priceHw={priceHw}
      />
    </section>
  );

}
