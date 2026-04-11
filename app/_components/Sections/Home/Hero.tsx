'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';

export function Hero() {
  return (
    <section id="home" className="min-h-svh flex flex-col justify-center items-center">
      {/* Top image strip - Desktop */}
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
          className="absolute inset-0 flex items-center justify-center text-[12.5vw] tracking-wide font-bold text-background z-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.8 }}
          transition={{ duration: 7, delay: 0.15 }}
        >
          PORTFOLIO
        </motion.h2>
      </div>
      {/* Mobile */}
      <div className="flex md:hidden w-full h-svh relative overflow-hidden justify-center items-center">
        <Image 
          src="/pic1.JPG" 
          alt="Hero background" 
          fill 
          className="object-cover object-center"
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
          className="absolute inset-0 flex items-center justify-center text-[15vw] font-mono tracking-wide font-bold text-background z-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 7, delay: 0.15 }}
        >
          PORTFOLIO
        </motion.h2>
      </div>

    </section>
  );
}
