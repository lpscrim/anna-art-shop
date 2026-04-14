import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/app/_lib/stripe';
import { createServerSupabase } from '@/app/_lib/supabase';
import type Stripe from 'stripe';

export async function POST(req: NextRequest) {
  const stripe = getStripe();
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;
  const sig = req.headers.get('stripe-signature');
  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig!, endpointSecret);
  } catch (err: any) {
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  // Stock is already reserved (decremented) when the checkout session is
  // created.  On success we do nothing — the reservation becomes the sale.
  // On expiry we restore the reserved stock so it's available again.

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    console.log('[ORDER COMPLETED]', {
      sessionId: session.id,
      email: session.customer_details?.email,
      amount: session.amount_total,
      currency: session.currency,
      items: session.metadata?.reserved_items,
      paymentStatus: session.payment_status,
    });
  }

  if (event.type === 'checkout.session.expired') {
    const session = event.data.object as Stripe.Checkout.Session;
    const raw = session.metadata?.reserved_items;
    if (raw) {
      try {
        const reserved = JSON.parse(raw) as { stripe_price_id: string; qty: number }[];
        const supabase = createServerSupabase();
        await supabase.rpc('restore_stock', { items: reserved });
      } catch (err) {
        console.error('Failed to restore stock on session expiry:', err);
      }
    }
  }

  return NextResponse.json({ received: true });
}
