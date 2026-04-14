"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef } from "react";

function ExpireSession() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const expiredRef = useRef(false);

  useEffect(() => {
    if (!sessionId || expiredRef.current) return;
    expiredRef.current = true;

    fetch("/api/checkout/expire", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId }),
    }).catch(() => {
      // Session may already be expired or completed — safe to ignore
    });
  }, [sessionId]);

  return null;
}

export default function CancelledPage() {
  return (
    <section className="min-h-[75svh] px-6 py-24 xl:py-32 max-w-2xl mx-auto">
      <Suspense>
        <ExpireSession />
      </Suspense>
      <h1 className="text-3xl md:text-5xl tracking-tight mb-4">
        CHECKOUT CANCELLED
      </h1>
      <p className="text-muted-foreground mb-12">
        Your payment was not processed and no charge was made. Your reserved
        items have been released.
      </p>

      <Link
        href="/work"
        className="inline-block mt-8 text-muted-foreground hover:text-foreground transition-colors"
      >
        ← Back to gallery
      </Link>
    </section>
  );
}
