"use client";

import { Card } from "../../UI/Layout/Card";

interface Project {
  id: number;
  title: string;
  categories: string[];
  medium: string;
  dimensions: string;
  year: string;
  display_date: string;
  featured: boolean;
  imageUrl: string;
  galleryImages?: string[];
  text?: string;
  price_hw: number;
  stock_level: number;
  stripe_price_id: string | null;
  type: "artwork" | "print";
}

export interface MainGalleryProps {
  selectedCategories: string[];
  setSelectedCategories: React.Dispatch<React.SetStateAction<string[]>>;
  inStockOnly: boolean;
  setInStockOnly: React.Dispatch<React.SetStateAction<boolean>>;
  filteredProjects: Project[];
  totalCount: number;
  inStockCount: number;
  sortedVisibleCategories: [string, number][];
  toggleCategory: (cat: string) => void;
  onCardClick: (index: number, project: Project) => void;
  getStockLevel: (project: Project) => number;
  selectedType: "artwork" | "print" | null;
  onTypeToggle: (type: "artwork" | "print") => void;
  artworkCount: number;
  printCount: number;
  showCategories: boolean;
  showYearFilter: boolean;
  availableYears: string[];
  selectedYear: string | null;
  onYearToggle: (year: string) => void;
}

export function MainGallery({
  selectedCategories,
  setSelectedCategories,
  inStockOnly,
  setInStockOnly,
  filteredProjects,
  totalCount,
  inStockCount,
  sortedVisibleCategories,
  toggleCategory,
  onCardClick,
  getStockLevel,
  selectedType,
  onTypeToggle,
  artworkCount,
  printCount,
  showCategories,
  showYearFilter,
  availableYears,
  selectedYear,
  onYearToggle,
}: MainGalleryProps) {
  return (
    <>
      <div className="pt-12 pb-4 px-0 rounded-xs flex flex-wrap gap-4 w-full">
        <div className="xl:w-1/2 text-base sm:text-lg py-4">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => {
                setSelectedCategories([]);
                setInStockOnly(false);
              }}
              className={`cursor-crosshair transition-opacity tracking-wide ${selectedCategories.length === 0 && !inStockOnly ? "text-foreground" : "text-foreground/50"}`}
            >
              All [{totalCount}]
            </button>
            <button
              onClick={() => {
                setInStockOnly(!inStockOnly);
              }}
              className={`cursor-crosshair transition-opacity tracking-wide ${inStockOnly ? "text-foreground font-semibold" : "text-foreground/50"}`}
            >
              Available [{inStockCount}]
            </button>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            <button
              onClick={() => onTypeToggle("artwork")}
              className={`cursor-crosshair transition-opacity tracking-wide ${selectedType === "artwork" ? "text-foreground font-semibold" : "text-foreground/50"}`}
            >
              Original [{artworkCount}]
            </button>
            <button
              onClick={() => onTypeToggle("print")}
              className={`cursor-crosshair transition-opacity tracking-wide ${selectedType === "print" ? "text-foreground font-semibold" : "text-foreground/50"}`}
            >
              Print [{printCount}]
            </button>
          </div>
          {showYearFilter && availableYears.length > 1 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {availableYears.map((yr) => (
                <button
                  key={yr}
                  onClick={() => onYearToggle(yr)}
                  className={`cursor-crosshair transition-opacity tracking-wide ${
                    selectedYear === yr
                      ? "text-foreground font-semibold"
                      : "text-foreground/50"
                  }`}
                >
                  &apos;{yr.slice(2)}
                </button>
              ))}
            </div>
          )}
          {showCategories && (
            <div className="flex flex-wrap gap-0 mt-2">
              {sortedVisibleCategories.map(([category, count]) => {
                const categoryStr = String(category);
                const isSelected = selectedCategories.includes(categoryStr);
                const isUnselectable = count === 0;
                return (
                  <span
                    key={categoryStr}
                    className="inline-flex items-center text-base sm:text-lg transition-opacity"
                  >
                    <button
                      onClick={() =>
                        !isUnselectable && toggleCategory(categoryStr)
                      }
                      disabled={isUnselectable}
                      className={`pr-1 py-1 rounded transition-colors cursor-crosshair tracking-wide text-foreground ${isSelected ? "underline font-semibold" : ""} ${isUnselectable ? "opacity-30 cursor-not-allowed" : "hover:bg-background/10"}`}
                    >
                      {categoryStr}{" "}
                      <span className="text-foreground/60">[{count}]</span>
                    </button>
                  </span>
                );
              })}
            </div>
          )}
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 px-0">
        {filteredProjects.map((project, idx) => (
          <div key={project.id} className="relative group">
            <Card
              key={project.id}
              categories={project.categories}
              imageUrl={project.imageUrl}
              galleryImages={project.galleryImages}
              year={project.year}
              title={project.title}
              imageSizes="(min-width: 1280px) 25vw, (min-width: 768px) 33vw, 50vw"
              imageWidth={900}
              imageHeight={1125}
              imageQuality="auto:eco"
              handleOnClick={() => onCardClick(idx, project)}
            />
            <div className="absolute inset-x-0 text-lg top-4 px-4 group-hover:opacity-100 opacity-0 flex flex-col group-hover:mt-2 z-60 transition-all duration-500 pointer-events-none max-w-full">
              <div className="hidden md:flex flex-wrap gap-x-4 gap-y-1 text-background wrap-break-word max-w-full">
                <span className="font-medium tracking-wider">{project.title}</span>
                <span className="">{project.year}</span>
              </div>
              {getStockLevel(project) === 0 && (
                <h3 className="text-background text-base">Sold</h3>
              )}
            </div>
            <div className="md:hidden text-base px-4 py-2 bg-background text-foreground/90 group-hover:opacity-100 opacity-100 flex flex-col z-50 transition-all duration-500 pointer-events-none max-w-full">
              <div className="flex flex-wrap gap-x-4 gap-y-1 mx-auto wrap-break-word max-w-full">
                <span className="font-semibold">{project.title},</span>
                <span className="">{project.dimensions},</span>
                <span className="">£{project.price_hw/100}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
