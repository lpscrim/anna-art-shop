// app/about/AboutGallery.tsx
'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';

export default function AboutGallery({ images }: { images: string[] }) {
  const [lightbox, setLightbox] = useState<string | null>(null);

  useEffect(() => {
    if (lightbox) {
      // Lock scroll
      document.body.style.overflow = 'hidden';
    } else {
      // Unlock scroll
      document.body.style.overflow = '';
    }

    return () => {
      // Ensure scroll is unlocked on component unmount
      document.body.style.overflow = '';
    };
  }, [lightbox]);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (lightbox && event.target instanceof HTMLElement && !event.target.closest('.lightbox-container')) {
        console.log('Lightbox clicked outside, closing...');
        setLightbox(null);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [lightbox]);

  if (!images.length) return null;

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {images.map((url, i) => {
          return (
            <button
              key={url}
              className="relative aspect-square overflow-hidden rounded-xs cursor-crosshair group"
              onClick={() => setLightbox(url)}
              aria-label={`View image ${i + 1} larger`}
            >
              <Image
                src={url}
                alt={`Exhibition image ${i + 1}`}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105 w-full h-full"
                sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
              />
            </button>
          );
        })}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-950 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm lightbox-container"
          onClick={() => setLightbox(null)}
        >
          <div className="relative max-w-5xl max-h-[80svh] w-full h-full" onClick={() => setLightbox(null)}>
            <Image
              src={lightbox}
              alt=""
              fill
              className="object-contain"
              sizes="100vw"
            />
          </div>

        </div>
      )}
    </>
  );
}

