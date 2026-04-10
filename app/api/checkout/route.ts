import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/app/_lib/stripe';
import { createServerSupabase } from '@/app/_lib/supabase';

interface CartLineItem {
  priceId: string;
  quantity: number;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Support both legacy single-item { priceId } and new multi-item { items }
    let lineItems: CartLineItem[];

    if (Array.isArray(body.items)) {
      lineItems = body.items as CartLineItem[];
    } else if (body.priceId) {
      lineItems = [{ priceId: body.priceId, quantity: 1 }];
    } else {
      return NextResponse.json({ error: 'Missing items or priceId' }, { status: 400 });
    }

    if (lineItems.length === 0) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
    }

    // ── Reserve stock atomically before creating Stripe session ─────
    const supabase = createServerSupabase();

    // Build a reservation payload: [{ stripe_price_id, quantity }]
    const reservations = lineItems.map((i) => ({
      stripe_price_id: i.priceId,
      qty: i.quantity,
    }));

    const { data: result, error: reserveError } = await supabase.rpc(
      'reserve_stock',
      { items: reservations }
    );

    if (reserveError) {
      return NextResponse.json({ error: 'Failed to verify stock' }, { status: 500 });
    }

    // result is an array of { stripe_price_id, title, reserved }
    const failed = (result as { stripe_price_id: string; title: string; reserved: boolean }[])
      .filter((r) => !r.reserved);

    if (failed.length > 0) {
      // Restore any that DID succeed in this batch (partial rollback)
      const succeeded = (result as { stripe_price_id: string; title: string; reserved: boolean }[])
        .filter((r) => r.reserved);
      if (succeeded.length > 0) {
        await supabase.rpc('restore_stock', {
          items: succeeded.map((s) => ({
            stripe_price_id: s.stripe_price_id,
            qty: reservations.find((r) => r.stripe_price_id === s.stripe_price_id)!.qty,
          })),
        });
      }

      return NextResponse.json(
        {
          error: `Out of stock: ${failed.map((f) => f.title).join(', ')}`,
          outOfStock: failed.map((f) => f.title),
        },
        { status: 409 }
      );
    }

    // ── Create Stripe checkout session ─────────────────────────────
    const stripe = getStripe();

    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: lineItems.map((item) => ({
        price: item.priceId,
        quantity: item.quantity,
      })),
      // Store reserved items so we can restore stock on expiry
      metadata: {
        reserved_items: JSON.stringify(reservations),
      },
      // 30 min to complete payment before session expires
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
      success_url: `${siteUrl}/purchase/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/purchase/cancelled?session_id={CHECKOUT_SESSION_ID}`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Checkout failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
