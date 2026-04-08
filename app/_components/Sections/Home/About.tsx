import Image from "next/image";

export function About() {
  return (
    <section id="about" className="min-h-[80svh] px-6 py-20 xl:py-26 bg-muted/30 items-center flex">
      <div className="w-full mx-auto">
        <div className="mb-16">
          <p className="text-muted-foreground mb-2">03</p>
          <h2 className="text-3xl md:text-5xl tracking-tight">ABOUT</h2>
        </div>

        <div className="grid md:grid-cols-2 gap-16 max-w-7xl mx-auto">
          <div className="space-y-6 text-lg">
            <p>
              Lorem ipsum dolor, sit amet consectetur adipisicing elit. Corrupti, atque nisi voluptatum aut veniam autem nesciunt officia ducimus accusamus eos ea nulla provident nemo vero, magnam iure, corporis earum odio!
            </p>
            <p>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
            </p>
          </div>

          <div className="flex justify-end items-center">
            <Image 
              src="/Me_Sun2.svg"  
              alt="About Image"
              width={1600}
              height={900}
              className=" h-full w-full lg:w-4/5 rounded-xs aspect-4/3 sm:aspect-video object-cover grayscale"
              />

          </div>
        </div>
      </div>
    </section>
  );
}
