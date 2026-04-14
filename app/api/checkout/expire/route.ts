import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/app/_lib/stripe';

export async function POST(req: NextRequest) {
  try {
    const { sessionId } = await req.json();
    if (!sessionId || typeof sessionId !== 'string') {
      return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 });
    }

    const stripe = getStripe();
    await stripe.checkout.sessions.expire(sessionId);

    return NextResponse.json({ expired: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to expire session';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
