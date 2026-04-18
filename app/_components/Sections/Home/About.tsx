import Image from "next/image";
{/*import Button from "../../UI/Layout/Button";
import Link from "next/link";*/}

export function About() {
  return (
    <section id="about" className="min-h-[80svh] px-6 py-20 xl:py-32 bg-muted/30 items-center flex">
      <div className="w-full mx-auto">
        <div className="mb-24">
          <p className="text-muted-foreground mb-2">03</p>
          <h2 className="text-3xl md:text-5xl tracking-tight">About</h2>
        </div>

        <div className="grid md:grid-cols-2 gap-16 max-w-7xl mx-auto">
          <div className="space-y-6 text-xl xl:text-2xl">
            <p>
              Anna is a Scottish artist drawn to the mountains — their weight, their stillness, the way light moves across them. Working primarily in oil on canvas and mixed media, she translates landscape into something more abstract, stripping back detail to capture what a place feels like rather than how it looks.
            </p>
            <p>
              Her work moves between representation and abstraction, layering colour and texture to echo the rugged forms and shifting atmospheres of the Scottish highlands. Each piece is an invitation to pause and look a little longer.
            </p>
          </div>

          <div className="flex justify-end items-center">
            <Image 
              src="/ANNA.png"  
              alt="Anna Maia"
              width={1600}
              height={900}
              className=" h-full w-full lg:w-4/5 rounded-sm aspect-4/3 object-cover "
              />

          </div>
        </div>
        {/* <div className="mt-24 text-center">
          <Button size="xl">
            <Link href="/">MORE??</Link>
          </Button>
        </div> */}
      </div>
    </section>
  );
}
