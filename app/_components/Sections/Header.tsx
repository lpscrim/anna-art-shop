"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import NavIcon from "../UI/Nav/NavIcon";
import { useCart } from "../Cart/CartContext";

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [onHero, setOnHero] = useState(true);
  const pathname = usePathname();
  const router = useRouter();

  const isWorkPage = pathname === "/work";
  const isAdminPage = pathname.startsWith("/admin");
  const { count, toggleCart } = useCart();


  useEffect(() => {
    const hero = document.getElementById("home");
    if (!hero) return;

    const observer = new IntersectionObserver(
      ([entry]) => setOnHero(entry.isIntersecting),
      { threshold: 0.1 }
    );
    observer.observe(hero);
    return () => observer.disconnect();
  }, [pathname]);

  const conditionalScrollTo = (hash: string) => {
    if (pathname === "/") {
      if (hash === '') {
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
        const el = document.querySelector(hash);
        if (el) {
          el.scrollIntoView({ behavior: "smooth" });
        }

    } else {
      router.push("/" + hash);
    }
  };

  const isLight = !isWorkPage && !isAdminPage && onHero;

  return (
    <header className={`fixed text-xl top-0 left-0 right-0 z-999 px-6`}>
      {!isLight && (
        <div className="absolute inset-0 w-full h-full backdrop-blur-sm bg-background z-0 pointer-events-none transition-all duration-500" />
      )}
      <div className="relative mx-auto py-4 z-10">
        <div className="flex items-center justify-between">
          {/* Logo with crossfade */}
          <button className="relative cursor-crosshair" onClick={() => { conditionalScrollTo(''); setIsMenuOpen(false); }}>
            <span
              className={`tracking-wide title font-semibold text-foreground hover:text-muted-foreground left-0 top-0 transition-all duration-500 ${
                isLight ? "opacity-0 pointer-events-none" : "opacity-100 pointer-events-auto"
              }`}
            >
              PORTFOLIO
            </span>
            <span
              className={`tracking-wide title font-semibold text-background hover:text-foreground absolute left-0 top-0 transition-all duration-500 ${
                isLight ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
              }`}
            >
              PORTFOLIO
            </span>
          </button>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex gap-8 ">
            <button className="relative title text-xl">
              <Link href="/work" className="cursor-crosshair">
                <span
                  className={`text-foreground hover:text-muted-foreground transition-all duration-500 ${
                    isLight ? "opacity-0 pointer-events-none" : "opacity-100 pointer-events-auto"
                  }`}
                >
                  WORK
                </span>
                <span
                  className={`text-background hover:text-foreground absolute left-0 top-0 transition-all duration-500 ${
                    isLight ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
                  }`}
                >
                  WORK
                </span>
              </Link>
            </button>
            <button className="relative title text-xl cursor-crosshair" onClick={() => conditionalScrollTo('#about')}>
                <span
                  className={`text-foreground hover:text-muted-foreground transition-all duration-500 ${
                    isLight ? "opacity-0 pointer-events-none" : "opacity-100 pointer-events-auto"
                  }`}
                >
                  ABOUT
                </span>
                <span
                  className={`text-background hover:text-foreground absolute left-0 top-0 transition-all duration-500 ${
                    isLight ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
                  }`}
                >
                  ABOUT
                </span>
            </button>
            <button className="relative title text-xl cursor-crosshair " onClick={() => conditionalScrollTo('#contact')}>
                <span
                  className={`text-foreground hover:text-muted-foreground transition-all duration-500 ${
                    isLight ? "opacity-0 pointer-events-none" : "opacity-100 pointer-events-auto"
                  }`}
                >
                  CONTACT
                </span>
                <span
                  className={`text-background hover:text-foreground absolute left-0 top-0 transition-all duration-500 ${
                    isLight ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
                  }`}
                >
                  CONTACT
                </span>
            </button>
            <button className="relative title text-xl cursor-crosshair" onClick={toggleCart}>
                <span
                  className={`text-foreground hover:text-muted-foreground transition-all duration-500 ${
                    isLight ? "opacity-0 pointer-events-none" : "opacity-100 pointer-events-auto"
                  }`}
                >
                  CART{count > 0 && <span className="text-muted-foreground"> [{count}]</span>}
                </span>
                <span
                  className={`text-background hover:text-foreground absolute left-0 top-0 transition-all duration-500 ${
                    isLight ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
                  }`}
                >
                  CART{count > 0 && <span className="text-foreground/60"> [{count}]</span>}
                </span>
            </button>
          </nav>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden cursor-crosshair -mr-4.75 -mt-4 -mb-3.75"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <NavIcon
              color={isLight ? "background" : "foreground"}
              open={isMenuOpen}
              hoverColor={isLight ? "background" : "foreground"}
            />
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <nav className={`md:hidden flex flex-col gap-4 text-lg pt-4 `}>
            <button
              onClick={() => setIsMenuOpen(false)}
              className={`title pop-up opacity-0 text-left transition-colors ${
                isLight
                  ? "text-background hover:text-foreground"
                  : "text-foreground hover:text-muted-foreground"
              }`}
              
            >
              <Link href="/work" className="cursor-crosshair">
                WORK
              </Link>
            </button>
            <button
            
              className={`title pop-up-2 opacity-0 text-left transition-colors cursor-crosshair ${
                isLight
                  ? "text-background hover:text-foreground"
                  : "text-foreground hover:text-muted-foreground"
              }`}
              onClick={() => { conditionalScrollTo('#about'); setIsMenuOpen(false); }}
            >
                ABOUT
            </button>
            <button
              className={`title pop-up-3 opacity-0 text-left transition-colors cursor-crosshair ${
                isLight
                  ? "text-background hover:text-foreground"
                  : "text-foreground hover:text-muted-foreground"
              }`}
              onClick={() => { conditionalScrollTo('#contact'); setIsMenuOpen(false); }}
            >
                CONTACT
            </button>
            <button
              className={`title pop-up-4 opacity-0 text-left transition-colors cursor-crosshair ${
                isLight
                  ? "text-background hover:text-foreground"
                  : "text-foreground hover:text-muted-foreground"
              }`}
              onClick={() => { toggleCart(); setIsMenuOpen(false); }}
            >
                CART{count > 0 && <span className="text-muted-foreground"> [{count}]</span>}
            </button>
          </nav>
        )}
      </div>
    </header>
  );
}
