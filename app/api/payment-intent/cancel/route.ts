import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/app/_lib/stripe';
import { createServerSupabase } from '@/app/_lib/supabase';
import { revalidatePath } from 'next/cache';

export async function POST(req: NextRequest) {
  try {
    const { paymentIntentId, cancelToken } = await req.json();
    if (typeof paymentIntentId !== 'string' || !paymentIntentId) {
      return NextResponse.json({ error: 'Missing paymentIntentId' }, { status: 400 });
    }
    if (typeof cancelToken !== 'string' || !cancelToken) {
      return NextResponse.json({ error: 'Missing cancelToken' }, { status: 400 });
    }

    const stripe = getStripe();
    const clientAccountId = process.env.STRIPE_CONNECT_CLIENT_ACCOUNT_ID?.trim() || undefined;
    const stripeOpts = clientAccountId ? { stripeAccount: clientAccountId } : undefined;

    const pi = await stripe.paymentIntents.retrieve(paymentIntentId, {}, stripeOpts);

    if (pi.metadata?.cancel_token !== cancelToken) {
      return NextResponse.json({ error: 'Invalid cancel token' }, { status: 403 });
    }

    if (!['requires_payment_method', 'requires_confirmation', 'requires_action'].includes(pi.status)) {
      return NextResponse.json({ cancelled: false, reason: 'not_cancellable' });
    }

    // Mark stock as restored in metadata BEFORE cancelling so the
    // payment_intent.canceled webhook knows to skip the restore and
    // doesn't double-increment.
    await stripe.paymentIntents.update(
      paymentIntentId,
      { metadata: { ...pi.metadata, stock_restored: 'true' } },
      stripeOpts,
    );

    await stripe.paymentIntents.cancel(paymentIntentId, {}, stripeOpts);

    // Restore stock immediately — the webhook will see stock_restored: 'true'
    // and skip its own restore, preventing double-incrementing.
    try {
      const reserved = JSON.parse(pi.metadata?.reserved_items ?? '[]') as { stripe_price_id: string; qty: number }[];
      if (reserved.length > 0) {
        const supabase = createServerSupabase();
        await supabase.rpc('restore_stock', { items: reserved });
        revalidatePath('/work');
        revalidatePath('/');
      }
    } catch (err) {
      console.error('Failed to restore stock on PI cancel:', err);
    }

    return NextResponse.json({ cancelled: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to cancel payment';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
