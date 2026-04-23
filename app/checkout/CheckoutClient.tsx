'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Elements,
  PaymentElement,
  AddressElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useCart } from '@/app/_components/Cart/CartContext';
import { ImageWithFallback } from '@/app/_components/UI/Layout/ImageWithFallback';

// ── Stripe singleton (never changes) ─────────────────────────────
// Loaded here to avoid re-creating on every render. stripeAccount is set
// dynamically inside the component based on sessionStorage data.
const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!;

export const CHECKOUT_STORAGE_KEY = 'checkout_pi';

export interface CheckoutPiData {
  clientSecret: string;
  paymentIntentId: string;
  cancelToken: string;
  stripeAccount?: string | null;
}

// ── Inner form rendered inside <Elements> ─────────────────────────
function CheckoutForm({
  total,
  shippingRate,
  onBack,
}: {
  total: number;
  shippingRate: number;
  onBack: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const subtotal = total - shippingRate;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setSubmitting(true);
    setErrorMsg(null);

    const origin = window.location.origin;
    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${origin}/purchase/success`,
      },
    });

    // confirmPayment redirects on success — if we reach here, it failed
    if (error) {
      setErrorMsg(error.message ?? 'Payment failed. Please try again.');
    }
    setSubmitting(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3">
          Shipping address
        </p>
        <AddressElement
          options={{
            mode: 'shipping',
            allowedCountries: [
              'GB', 'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI',
              'FR', 'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT',
              'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE', 'CH', 'NO',
              'IS', 'US', 'CA', 'AU', 'NZ', 'JP', 'SG', 'HK', 'AE', 'SA',
            ],
            fields: { phone: 'always' },
          }}
        />
      </div>

      <div>
        <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3">
          Payment
        </p>
        <PaymentElement />
      </div>

      {errorMsg && (
        <p className="text-sm text-red-600">{errorMsg}</p>
      )}

      <div className="border-t border-foreground/10 pt-4 space-y-1 text-sm">
        <div className="flex justify-between text-muted-foreground">
          <span>Subtotal</span>
          <span>£{(subtotal / 100).toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-muted-foreground">
          <span>Shipping</span>
          <span>{shippingRate === 0 ? 'Free' : `£${(shippingRate / 100).toFixed(2)}`}</span>
        </div>
        <div className="flex justify-between font-semibold pt-1">
          <span>Total</span>
          <span>£{(total / 100).toFixed(2)}</span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          type="submit"
          disabled={!stripe || !elements || submitting}
          className="cursor-crosshair group flex-1 border border-foreground py-3 px-6 text-sm tracking-widest uppercase transition-colors hover:bg-foreground hover:text-background disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="inline-block transition-transform group-hover:scale-105">
            {submitting ? 'Processing...' : `[ Pay £${(total / 100).toFixed(2)} ]`}
          </span>
        </button>
        <button
          type="button"
          onClick={onBack}
          disabled={submitting}
          className="cursor-crosshair border border-foreground/30 py-3 px-6 text-sm tracking-widest uppercase text-muted-foreground hover:border-foreground hover:text-foreground transition-colors disabled:opacity-50"
        >
          [ Back ]
        </button>
      </div>
    </form>
  );
}

// ── Outer client component ────────────────────────────────────────
export default function CheckoutClient() {
  const router = useRouter();
  const { items, shippingRate: cartShippingRate } = useCart();
  const [piData, setPiData] = useState<CheckoutPiData | null>(null);
  const [total, setTotal] = useState(0);
  const [shippingRate, setShippingRate] = useState(cartShippingRate);
  const [initError, setInitError] = useState<string | null>(null);
  // Stripe promise is created after piData loads so we can pass stripeAccount
  const [stripePromise, setStripePromise] = useState<ReturnType<typeof loadStripe> | null>(null);
  const cancellingRef = useRef(false);

  // Read PI data from sessionStorage (set by CartDrawer)
  useEffect(() => {
    const raw = sessionStorage.getItem(CHECKOUT_STORAGE_KEY);
    if (!raw) {
      router.replace('/work');
      return;
    }
    try {
      const parsed = JSON.parse(raw) as CheckoutPiData & {
        total?: number;
        shippingRate?: number;
      };
      setPiData(parsed);
      if (parsed.total) setTotal(parsed.total);
      if (parsed.shippingRate !== undefined) setShippingRate(parsed.shippingRate);
    } catch {
      router.replace('/work');
    }
  }, [router]);

  // Create Stripe instance once piData is available.
  // For direct charges the instance must be scoped to the connected account.
  useEffect(() => {
    if (!piData) return;
    const promise = piData.stripeAccount
      ? loadStripe(PUBLISHABLE_KEY, { stripeAccount: piData.stripeAccount })
      : loadStripe(PUBLISHABLE_KEY);
    setStripePromise(promise);
  }, [piData]);

  async function handleBack() {
    if (cancellingRef.current || !piData) {
      router.back();
      return;
    }
    cancellingRef.current = true;
    sessionStorage.removeItem(CHECKOUT_STORAGE_KEY);

    // Fire-and-forget PI cancel + stock restore
    try {
      await fetch('/api/payment-intent/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentIntentId: piData.paymentIntentId,
          cancelToken: piData.cancelToken,
        }),
      });
    } catch {
      // Non-critical — webhook will catch it
    }
    router.back();
  }

  if (initError) {
    return (
      <section className="min-h-[75svh] px-6 py-24 max-w-2xl mx-auto">
        <p className="text-red-600 mb-4">{initError}</p>
        <button
          onClick={() => router.back()}
          className="cursor-crosshair border border-foreground py-2 px-5 text-sm uppercase tracking-widest"
        >
          [ Back ]
        </button>
      </section>
    );
  }

  if (!piData || !stripePromise) {
    return (
      <section className="min-h-[75svh] px-6 py-24 max-w-2xl mx-auto">
        <p className="text-muted-foreground text-sm">Loading checkout…</p>
      </section>
    );
  }

  const subtotal = total - shippingRate;

  return (
    <section className="min-h-[75svh] px-6 py-24 xl:py-32 max-w-5xl mx-auto">
      <h1 className="text-3xl md:text-4xl tracking-tight mb-12">CHECKOUT</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Order summary */}
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-4">
            Order summary
          </p>
          <div className="space-y-4 mb-6">
            {items.map((item) => (
              <div key={item.priceId} className="flex gap-4 items-start">
                <div className="relative w-16 h-20 shrink-0 rounded-sm overflow-hidden bg-muted">
                  <ImageWithFallback
                    src={item.imageUrl}
                    alt={item.name}
                    fill
                    className="object-cover"
                    sizes="64px"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm tracking-tight">{item.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Qty: {item.quantity}
                  </p>
                </div>
                <p className="text-sm shrink-0">
                  £{((item.priceHw * item.quantity) / 100).toFixed(2)}
                </p>
              </div>
            ))}
          </div>

          <div className="border-t border-foreground/10 pt-4 space-y-1 text-sm text-muted-foreground">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>£{(subtotal / 100).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Shipping</span>
              <span>{shippingRate === 0 ? 'Free' : `£${(shippingRate / 100).toFixed(2)}`}</span>
            </div>
            <div className="flex justify-between text-foreground font-semibold pt-1">
              <span>Total</span>
              <span>£{(total / 100).toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Stripe Elements form */}
        <div>
          <Elements
            stripe={stripePromise}
            options={{
              clientSecret: piData.clientSecret,
              appearance: {
                theme: 'flat',
                variables: {
                  colorBackground: 'rgb(242, 248, 239)',
                  colorText: '#1a1a1a',
                  colorTextSecondary: '#666',
                  borderRadius: '0px',
                  fontFamily: '"EB Garamond", Georgia, serif',
                  fontSizeBase: '15px',
                  focusBoxShadow: 'none',
                  focusOutline: '1px solid #1a1a1a',
                },
                rules: {
                  '.Input': {
                    border: '1px solid rgba(0,0,0,0.2)',
                    backgroundColor: 'transparent',
                    padding: '10px 12px',
                  },
                  '.Input:focus': {
                    border: '1px solid #1a1a1a',
                  },
                  '.Label': {
                    fontWeight: '400',
                    marginBottom: '6px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    fontSize: '11px',
                  },
                },
              },
            }}
          >
            <CheckoutForm
              total={total}
              shippingRate={shippingRate}
              onBack={handleBack}
            />
          </Elements>
        </div>
      </div>
    </section>
  );
}
