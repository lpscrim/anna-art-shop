import { getStripe } from "@/app/_lib/stripe";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ClearCart } from "./clearCart";
import { ImageWithFallback } from "../../_components/UI/Layout/ImageWithFallback";

interface SuccessPageProps {
  searchParams: Promise<{ session_id?: string }>;
}

export default async function SuccessPage({ searchParams }: SuccessPageProps) {
  const { session_id } = await searchParams;

  if (!session_id) redirect("/work");

  const stripe = getStripe();

  let session;
  try {
    session = await stripe.checkout.sessions.retrieve(session_id, {
      expand: ["line_items.data.price.product"],
    });
  } catch {
    redirect("/work");
  }

  if (session.payment_status !== "paid") redirect("/work");

  const lineItems = session.line_items?.data ?? [];

  return (
    <section className="min-h-[75svh] px-6 py-24 xl:py-32 max-w-2xl mx-auto">
      <ClearCart />

      <h1 className="text-3xl md:text-5xl tracking-tight mb-4">THANK YOU</h1>
      <p className="text-muted-foreground mb-12">
        Your order has been confirmed. A receipt has been sent to{" "}
        <span className="text-foreground">
          {session.customer_details?.email}
        </span>
        .
      </p>

      <div className="border-t border-foreground/10">
        {lineItems.map((item) => {
          const product = item.price?.product;
          const images =
            typeof product === "object" &&
            product !== null &&
            "images" in product
              ? (product as { images: string[] }).images
              : [];
          const imageUrl = images[0]; // first product image if it exists
          const name =
            typeof product === "object" && product !== null && "name" in product
              ? (product as { name: string }).name
              : "Item";

          return (
            <div
              key={item.id}
              className="flex justify-between py-4 border-b border-foreground/10"
            >
              <div className="relative w-12 h-12 shrink-0 rounded-sm overflow-hidden bg-muted">
                <ImageWithFallback
                  src={imageUrl}
                  alt={name}
                  fill
                  className="object-cover"
                  sizes="64px"
                />
              </div>
              <div>
                <p className="tracking-tight">{name}</p>
                <p className="text-muted-foreground text-sm">
                  Qty: {item.quantity}
                </p>
              </div>
              <p className="tracking-tight">
                £{((item.amount_total ?? 0) / 100).toFixed(2)}
              </p>
            </div>
          );
        })}
      </div>

      <div className="flex justify-between py-6 text-lg tracking-tight">
        <span>Total</span>
        <span>£{((session.amount_total ?? 0) / 100).toFixed(2)}</span>
      </div>

      <Link
        href="/work"
        className="inline-block mt-8 text-muted-foreground hover:text-foreground transition-colors"
      >
        ← Back to gallery
      </Link>
    </section>
  );
}
