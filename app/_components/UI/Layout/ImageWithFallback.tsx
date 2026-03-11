'use client'
import { useEffect, useState } from 'react'
import Image from 'next/image'

const ERROR_IMG_SRC =
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODgiIGhlaWdodD0iODgiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgc3Ryb2tlPSIjMDAwIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBvcGFjaXR5PSIuMyIgZmlsbD0ibm9uZSIgc3Ryb2tlLXdpZHRoPSIzLjciPjxyZWN0IHg9IjE2IiB5PSIxNiIgd2lkdGg9IjU2IiBoZWlnaHQ9IjU2IiByeD0iNiIvPjxwYXRoIGQ9Im0xNiA1OCAxNi0xOCAzMiAzMiIvPjxjaXJjbGUgY3g9IjUzIiBjeT0iMzUiIHI9IjciLz48L3N2Zz4KCg=='

const DEFAULT_BLUR_DATA_URL =
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGxpbmVhckdyYWRpZW50IGlkPSJnIiB4MT0iMCIgeTE9IjAiIHgyPSIxIiB5Mj0iMSI+PHN0b3Agb2Zmc2V0PSIwIiBzdG9wLWNvbG9yPSIjMTExIi8+PHN0b3Agb2Zmc2V0PSIxIiBzdG9wLWNvbG9yPSIjMjIyIi8+PC9saW5lYXJHcmFkaWVudD48cmVjdCB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIGZpbGw9InVybCgjZykiLz48L3N2Zz4='

const blurDataUrlCache = new Map<string, string>()

interface ImageWithFallbackProps {
  src: string;  // Supabase Storage public URL
  alt: string;
  className?: string;
  fill?: boolean;
  width?: number;
  height?: number;
  sizes?: string;
  priority?: boolean;
  blurDataURL?: string;
  disableBlurPlaceholder?: boolean;
  fetchBlurPlaceholder?: boolean;
  unoptimized?: boolean;
  quality?: number | string;
  onLoad?: (e: React.SyntheticEvent<HTMLImageElement>) => void;
}

export function ImageWithFallback({
  src,
  alt,
  className,
  fill = true,
  width,
  height,
  sizes,
  priority = false,
  blurDataURL: blurDataURLProp,
  disableBlurPlaceholder = false,
  fetchBlurPlaceholder = false,
  unoptimized = true,
  quality,
  onLoad,
  ...rest
}: ImageWithFallbackProps) {
  const [didError, setDidError] = useState(false)

  const [fetchedBlur, setFetchedBlur] = useState<
    { src: string; blurDataURL: string } | null
  >(null)

  const blurDataURL = disableBlurPlaceholder
    ? undefined
    : blurDataURLProp ??
      blurDataUrlCache.get(src) ??
      (fetchedBlur?.src === src ? fetchedBlur?.blurDataURL : undefined)

  const handleError = () => {
    setDidError(true)
  }

  useEffect(() => {
    if (!fetchBlurPlaceholder) return
    if (disableBlurPlaceholder) return
    if (!src) return
    if (blurDataURLProp) return
    if (blurDataUrlCache.has(src)) return

    const controller = new AbortController()

    fetch(`/api/blur?src=${encodeURIComponent(src)}`, {
      signal: controller.signal,
    })
      .then(async (res) => {
        if (!res.ok) return null
        return (await res.json()) as { blurDataURL?: string }
      })
      .then((data) => {
        const next = data?.blurDataURL
        if (!next) return
        blurDataUrlCache.set(src, next)
        setFetchedBlur({ src, blurDataURL: next })
      })
      .catch(() => {})

    return () => controller.abort()
  }, [src, blurDataURLProp, disableBlurPlaceholder, fetchBlurPlaceholder])

  if (didError) {
    return (
      <div
        className={`inline-block bg-gray-100 text-center align-middle ${className ?? ''}`}
      >
        <div className="flex items-center justify-center w-full h-full">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={ERROR_IMG_SRC} alt="Error loading image" data-original-url={src} />
        </div>
      </div>
    )
  }

  const computedSizes =
    sizes ?? (fill ? '100vw' : width ? `${width}px` : undefined)

  return (
    <Image
      src={src}
      alt={alt}
      className={className}
      fill={fill}
      width={!fill ? width : undefined}
      height={!fill ? height : undefined}
      sizes={computedSizes}
      quality={typeof quality === 'number' ? quality : undefined}
      priority={priority}
      loading={priority ? 'eager' : 'lazy'}
      unoptimized={unoptimized}
      placeholder={disableBlurPlaceholder ? 'empty' : 'blur'}
      blurDataURL={disableBlurPlaceholder ? undefined : blurDataURL ?? DEFAULT_BLUR_DATA_URL}
      onLoad={onLoad}
      onError={handleError}
      {...rest}
    />
  )
}
