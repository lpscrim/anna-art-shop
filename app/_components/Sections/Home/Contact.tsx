import { Mail, Instagram, Linkedin, Globe } from 'lucide-react';

export function Contact() {
  return (
    <section id="contact" className="min-h-[80svh] px-6 py-24 flex items-center">
      <div className=" mx-auto w-full">
        <div className="mb-16 lg:mb-32">
          <p className="text-muted-foreground mb-2">04</p>
          <h2 className="text-3xl md:text-5xl tracking-tight">GET IN TOUCH</h2>
        </div>

        <div className="max-w-7xl mx-auto grid md:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-32 lg:gap-48 lg:mb-32 xl:gap-80">
          <div className="space-y-8 lg:col-span-2">
            <p className="text-lg">
              Available for commissioned work, collaborations, and inquiries.
              Let`s create something meaningful together.
            </p>
            
            <div className="flex flex-row gap-8 items-center justify-between">
              <a 
                href="mailto:lpscrim@gmail.com"
                className="flex items-center gap-3 hover:opacity-70 transition-opacity cursor-crosshair group"
              >
                <Mail size={20} className="text-muted-foreground " />
                <span>LPSCRIM@GMAIL.COM</span>
              </a>
              
              <div className="flex items-center gap-3 text-muted-foreground justify-end">
                <span className="w-5" />
                <span>SCOTLAND/ WORLD</span>
              </div>
            </div>
          </div>

          <div className="space-y-8 lg:col-start-3 lg:col-span-2">
            <div className=''>
              <p className="text-muted-foreground mb-4">SOCIAL</p>
              <div className="space-y-3 lg:flex lg:flex-row lg:gap-8 lg:space-y-0">
                <a 
                  href="https://www.instagram.com/daydreamteam/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center cursor-crosshair gap-3 hover:opacity-70 transition-opacity"
                >
                  <Instagram size={20} className="text-muted-foreground" />
                  <span>INSTAGRAM</span>
                </a>
                <a 
                  href="https://www.linkedin.com/in/lewis-scrimgeour-13389b243/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center cursor-crosshair gap-3 hover:opacity-70 transition-opacity"
                >
                  <Linkedin size={20} className="text-muted-foreground" />
                  <span>LINKEDIN</span>
                </a>
                <a 
                  href="https://lewisscrimgeour.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 cursor-crosshair hover:opacity-70 transition-opacity whitespace-nowrap"
                >
                  <Globe size={20} className="text-muted-foreground" />
                  <span>WEB DESIGN</span>
                </a>
              </div>
            </div>
          </div>
        </div>

        
      </div>
    </section>
  );
}
