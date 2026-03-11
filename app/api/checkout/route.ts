import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/app/_lib/stripe';

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

    const stripe = getStripe();

    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: lineItems.map((item) => ({
        price: item.priceId,
        quantity: item.quantity,
      })),
      success_url: `${siteUrl}/work?checkout=success`,
      cancel_url: `${siteUrl}/work?checkout=cancelled`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Checkout failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
