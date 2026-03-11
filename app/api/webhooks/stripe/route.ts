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

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
    const supabase = createServerSupabase();

    const failedItems: string[] = [];

    // For each purchased product, atomically decrement stock in Supabase
    for (const item of lineItems.data) {
      const stripeProductId = item.price?.product as string;
      const quantity = item.quantity || 1;

      // Find the Supabase product by stripe_product_id
      const { data: product, error } = await supabase
        .from('products')
        .select('id, stock_level')
        .eq('stripe_product_id', stripeProductId)
        .single();

      if (error || !product) continue;

      // Atomic decrement — only succeeds if enough stock exists
      const { data: decremented } = await supabase.rpc('decrement_stock', {
        product_id: product.id,
        quantity,
      });

      if (!decremented) {
        // Stock was insufficient (race condition — another order got it first)
        failedItems.push(item.description || stripeProductId);
      }
    }

    // If any items couldn't be fulfilled, refund the entire payment
    if (failedItems.length > 0 && session.payment_intent) {
      const paymentIntentId =
        typeof session.payment_intent === 'string'
          ? session.payment_intent
          : session.payment_intent.id;

      try {
        await stripe.refunds.create({
          payment_intent: paymentIntentId,
          reason: 'requested_by_customer',
        });
        console.error(
          `Auto-refunded payment ${paymentIntentId}: out of stock for [${failedItems.join(', ')}]`
        );
      } catch (refundErr) {
        console.error('Failed to auto-refund:', refundErr);
      }
    }
  }

  return NextResponse.json({ received: true });
}
