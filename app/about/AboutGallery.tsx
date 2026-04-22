'use client';

import Image from 'next/image';
import { useState } from 'react';

export default function AboutGallery({ images }: { images: string[] }) {
  const [orientations, setOrientations] = useState<(boolean | null)[]>(
    () => images.map(() => null)
  );

  function handleLoad(i: number, e: React.SyntheticEvent<HTMLImageElement>) {
    const img = e.currentTarget;
    setOrientations((prev) => {
      const next = [...prev];
      next[i] = img.naturalWidth > img.naturalHeight;
      return next;
    });
  }

  if (!images.length) return null;

  return (
    <div
      className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 auto-rows-[28vw] md:auto-rows-[19vw] lg:auto-rows-[14.5vw] xl:auto-rows-[193px]"
    >
      {images.map((url, i) => {
        // null = unknown (assume portrait while loading so layout is stable)
        const isLandscape = orientations[i] === true;
        return (
          <div
            key={url}
            className="relative overflow-hidden rounded-sm"
            style={{ gridRow: `span ${isLandscape ? 1 : 2}` }}
          >
            <Image
              src={url}
              alt={`Exhibition image ${i + 1}`}
              fill
              className="object-cover"
              sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
              onLoad={(e) => handleLoad(i, e)}
            />
          </div>
        );
      })}
    </div>
  );
}
