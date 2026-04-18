'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { useRef, useCallback } from 'react';

export function Hero() {
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleEnded = useCallback(() => {
    // Pause on first frame for 3 seconds before looping
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = 0;
    video.pause();
    setTimeout(() => video.play(), 3000);
  }, []);

  return (
    <section id="home" className="min-h-svh flex flex-col justify-center items-center">
      {/* Top image strip - Desktop */}
      <div className='absolute bg-black/15 w-full h-full z-9'></div>
      <div className="hidden md:flex w-full h-svh relative overflow-hidden justify-center items-center">
        {/* Static image positioned in background */}
        <Image 
          src="/tree1.JPG" 
          alt="Hero background" 
          fill 
          className="object-cover object-center"
        />
        {/* Animated mask overlays that shrink to reveal image */}
        <motion.div
          className="absolute left-0 right-0 top-0 bg-background"
          initial={{ height: 'calc(50% - 13.5svw)' }}
          animate={{ height: 0 }}
          transition={{ duration: 2, ease: 'easeInOut', delay: 1.5 }}
        />
        <motion.div
          className="absolute left-0 right-0 bottom-0 bg-background"
          initial={{ height: 'calc(50% - 13.5svw)' }}
          animate={{ height: 0 }}
          transition={{ duration: 2, ease: 'easeInOut', delay: 1.5 }}
        />
        <motion.h2 
          className="absolute inset-0 flex items-center font-medium justify-center text-[8vw] tracking-wide text-background z-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.8 }}
          transition={{ duration: 7, delay: 0.15 }}
        >
          Annamaiaart
        </motion.h2>
      </div>
      {/* Mobile */}
      <div className="flex md:hidden w-full h-svh relative overflow-hidden justify-center items-center">
        <video 
          ref={videoRef}
          src="/vid.mp4" 
          autoPlay 
          muted
          playsInline
          onEnded={handleEnded}
          className="object-cover object-center h-auto min-h-full w-full"
        />
        <motion.div
          className="absolute left-0 right-0 top-0 bg-background"
          initial={{ height: 'calc(50% - 13.5svw)' }}
          animate={{ height: 0 }}
          transition={{ duration: 2, ease: 'easeInOut', delay: 1.5 }}
        />
        <motion.div
          className="absolute left-0 right-0 bottom-0 bg-background"
          initial={{ height: 'calc(50% - 13.5svw)' }}
          animate={{ height: 0 }}
          transition={{ duration: 2, ease: 'easeInOut', delay: 1.5 }}
        />
        <motion.h2 
          className="absolute inset-0 flex items-center justify-center text-[8vw] font-mono tracking-wide font-bold text-background z-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.9 }}
          transition={{ duration: 7, delay: 1 }}
        >
          Annamaiaart
        </motion.h2>
      </div>

    </section>
  );
}
