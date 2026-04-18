"use client";

import { useState, useCallback } from "react";
import { useSwipeable } from "react-swipeable";
import { ImageWithFallback } from "./ImageWithFallback";

interface SwipeGalleryProps {
  images: string[];
  alt: string;
  className?: string;
}

export function SwipeGallery({ images, alt, className = "" }: SwipeGalleryProps) {
  const [index, setIndex] = useState(0);

  const goNext = useCallback(() => {
    setIndex((i) => Math.min(i + 1, images.length - 1));
  }, [images.length]);

  const goPrev = useCallback(() => {
    setIndex((i) => Math.max(i - 1, 0));
  }, []);

  const handlers = useSwipeable({
    onSwipedLeft: goNext,
    onSwipedRight: goPrev,
    trackMouse: true,
  });

  if (images.length === 0) return null;
  if (images.length === 1) {
    return (
      <ImageWithFallback
        src={images[0]}
        alt={alt}
        width={1600}
        height={900}
        fill={false}
        className={className}
      />
    );
  }

  return (
    <div {...handlers} className="relative select-none">
      <ImageWithFallback
        key={images[index]}
        src={images[index]}
        alt={`${alt} ${index + 1}`}
        width={1600}
        height={900}
        fill={false}
        className={className}
      />

      {/* Dots */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
        {images.map((_, i) => (
          <button
            key={i}
            onClick={() => setIndex(i)}
            aria-label={`Go to image ${i + 1}`}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              i === index ? "bg-white/90 scale-110" : "bg-white/40"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
