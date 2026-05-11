'use client';

import { Mail, Instagram, Globe, Newspaper } from 'lucide-react';
import Link from 'next/link';

export function Contact() {
  return (
    <section id="contact" className="min-h-[80svh] px-6 py-24 xl:pb-56 flex items-center">
      <div className=" mx-auto w-full">
        <div className="mb-16 lg:mb-32">
          <h2 className="text-3xl md:text-5xl tracking-tight">Get in touch</h2>
        </div>

        <div className="max-w-7xl mx-auto grid md:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-32 lg:gap-48 lg:mb-32 xl:gap-80">
          <div className="space-y-8 lg:col-span-2">
            <p className="text-lg xl:text-xl text-foreground">
              Available for commissioned work, collaborations, and inquiries.
              Let`s create something meaningful together.
            </p>
            
            <div className="flex flex-row gap-8 items-center justify-between">
              <Link 
                href="mailto:studioannamaia@gmail.com"
                className="flex items-center gap-3 hover:opacity-70 transition-opacity cursor-crosshair group text-lg"
              >
                <Mail size={20} className="text-foreground " />
                <span>Studioannamaia@gmail.com</span>
              </Link>
              
              <div className="flex items-center gap-3 text-lg text-foreground justify-end">
                <span className="w-5" />
                <span>Scotland</span>
              </div>
            </div>
          </div>

          <div className="space-y-8 lg:col-start-3 lg:col-span-2 text-lg">
            <div className=''>
              <p className="text-foreground mb-4">Social</p>
              <div className="space-y-3 lg:flex lg:flex-row lg:gap-8 lg:space-y-0">
                <Link 
                  href="https://www.instagram.com/annamaiaart/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center cursor-crosshair gap-3 hover:opacity-70 transition-opacity"
                >
                  <Instagram size={20} className="text-foreground" />
                  <span>Instagram</span>
                </Link>
                <button
                  onClick={() => window.dispatchEvent(new CustomEvent('open-mailing-list'))}
                  className="flex items-center gap-3 cursor-crosshair hover:opacity-70 transition-opacity whitespace-nowrap"
                >
                  <Newspaper size={20} className="text-foreground" />
                  <span>Newsletter</span>
                </button>
                <Link 
                  href="https://st.storedpay.co/l/anna-maia-art/mini-original-artworks"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 cursor-crosshair hover:opacity-70 transition-opacity whitespace-nowrap"
                >
                  <Globe size={20} className="text-foreground" />
                  <span>Stored Shop</span>
                </Link>
              </div>
            </div>
          </div>
        </div>

        
      </div>
    </section>
  );
}
