import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/app/_lib/stripe';
import { createServerSupabase } from '@/app/_lib/supabase';
import type Stripe from 'stripe';
import { Resend } from 'resend';

export async function POST(req: NextRequest) {
  const stripe = getStripe();
  const sig = req.headers.get('stripe-signature');
  const rawBody = await req.text();

  // Direct charges fire events on the connected account, forwarded to the
  // platform via a Connect webhook (separate secret: STRIPE_CONNECT_WEBHOOK_SECRET).
  // Fall back to the standard account secret if the connect secret isn't set yet.
  const accountSecret = process.env.STRIPE_WEBHOOK_SECRET!;
  const connectSecret = process.env.STRIPE_CONNECT_WEBHOOK_SECRET;

  let event: Stripe.Event;
  try {
    if (connectSecret) {
      try {
        event = stripe.webhooks.constructEvent(rawBody, sig!, connectSecret);
      } catch {
        event = stripe.webhooks.constructEvent(rawBody, sig!, accountSecret);
      }
    } else {
      event = stripe.webhooks.constructEvent(rawBody, sig!, accountSecret);
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: `Webhook Error: ${message}` }, { status: 400 });
  }

  // Stock is reserved when the PaymentIntent is created.
  // On success the reservation becomes the sale — nothing to do.
  // On cancellation/failure we restore the reserved stock.

  if (event.type === 'payment_intent.succeeded') {
    const pi = event.data.object as Stripe.PaymentIntent;
    console.log('[ORDER COMPLETED]', {
      paymentIntentId: pi.id,
      amount: pi.amount,
      currency: pi.currency,
      items: pi.metadata?.reserved_items,
    });
    await notifyClientFromPI(pi, stripe);
  }

  if (event.type === 'payment_intent.canceled') {
    const pi = event.data.object as Stripe.PaymentIntent;
    const raw = pi.metadata?.reserved_items;
    if (raw) {
      try {
        const reserved = JSON.parse(raw) as { stripe_price_id: string; qty: number }[];
        const supabase = createServerSupabase();
        await supabase.rpc('restore_stock', { items: reserved });
      } catch (err) {
        console.error('Failed to restore stock on PI cancellation:', err);
      }
    }
  }

  return NextResponse.json({ received: true });
}

async function notifyClientFromPI(pi: Stripe.PaymentIntent, stripe: ReturnType<typeof import('@/app/_lib/stripe').getStripe>) {
  const apiKey = process.env.RESEND_API_KEY;
  const notifyEmail = process.env.NOTIFY_EMAIL;
  if (!apiKey || !notifyEmail) return;

  const resend = new Resend(apiKey);
  const recipients = notifyEmail.split(',').map((e) => e.trim()).filter(Boolean);

  const clientAccountId = process.env.STRIPE_CONNECT_CLIENT_ACCOUNT_ID?.trim() || undefined;
  const stripeOpts = clientAccountId ? { stripeAccount: clientAccountId } : undefined;

  // Expand charge + balance_transaction for billing, shipping, and fee details
  let charge: Stripe.Charge | null = null;
  try {
    const expanded = await stripe.paymentIntents.retrieve(
      pi.id,
      { expand: ['latest_charge.balance_transaction'] },
      stripeOpts,
    );
    charge = expanded.latest_charge as Stripe.Charge | null;
  } catch {
    // Non-fatal — we'll show what we can
  }

  const balanceTx =
    charge?.balance_transaction && typeof charge.balance_transaction !== 'string'
      ? (charge.balance_transaction as Stripe.BalanceTransaction)
      : null;

  const billingEmail = charge?.billing_details?.email ?? null;
  const billingName = charge?.billing_details?.name ?? 'Unknown';
  const billing = charge?.billing_details;
  const shipping = charge?.shipping ?? pi.shipping;

  const amountTotal = pi.amount;
  const shippingCost = parseInt(pi.metadata?.shipping_amount ?? '0', 10);
  const subtotal = amountTotal - shippingCost;
  const stripeFee = balanceTx?.fee ?? null;
  const platformFee = Math.round(amountTotal * 0.01);
  const netToClient = amountTotal - platformFee - (stripeFee ?? 0);

  const fmt = (pence: number) => `£${(pence / 100).toFixed(2)}`;

  const addressLines = shipping?.address
    ? [
        shipping.address.line1,
        shipping.address.line2,
        shipping.address.city,
        shipping.address.postal_code,
        shipping.address.country,
      ]
        .filter(Boolean)
        .join(', ')
    : 'Not provided';

  const phone = (shipping as { phone?: string } | null)?.phone
    ?? (billing as { phone?: string } | null)?.phone
    ?? 'Not provided';

  let itemsHtml = '';
  try {
    const reserved = JSON.parse(pi.metadata?.reserved_items ?? '[]') as { title: string; qty: number; price: number; image?: string; type?: string }[];
    itemsHtml = reserved
      .map((i) => `<div style="display:inline-block;margin:8px;vertical-align:top;text-align:center;width:160px">
        ${i.image ? `<img src="${i.image}" alt="${i.title}" width="160" height="160" style="object-fit:cover;border-radius:6px;display:block">` : ''}
        <p style="margin:6px 0 2px;font-weight:600">${i.title}</p>
        ${i.type ? `<p style="margin:0 0 2px;color:#888;font-size:12px;text-transform:capitalize">${i.type}</p>` : ''}
        <p style="margin:0;color:#555">x${i.qty} &mdash; ${fmt(i.price)}</p>
      </div>`)
      .join('');
  } catch {
    itemsHtml = '<p>See Stripe dashboard for items</p>';
  }

  const html = `
    <h2>New Order — ${billingName}</h2>
    <p><strong>Customer:</strong> ${billingName}<br>
    <strong>Email:</strong> ${billingEmail ?? 'Unknown'}<br>
    <strong>Phone:</strong> ${phone}</p>
    <p><strong>Shipping address:</strong><br>${addressLines}</p>
    <h3>Items</h3>
    <div>${itemsHtml}</div>
    <table style="width:100%;max-width:360px;border-collapse:collapse;margin-top:12px;font-size:14px">
      <tr><td style="color:#555;padding:3px 0">Subtotal</td><td style="text-align:right">${fmt(subtotal)}</td></tr>
      <tr><td style="color:#555;padding:3px 0">Shipping</td><td style="text-align:right">${shippingCost === 0 ? 'Free' : fmt(shippingCost)}</td></tr>
      <tr><td style="padding:3px 0;font-weight:600">Total</td><td style="text-align:right;font-weight:600">${fmt(amountTotal)}</td></tr>
      <tr><td style="color:#555;padding:3px 0;border-top:1px solid #eee">Platform fee (1%)</td><td style="text-align:right;border-top:1px solid #eee">−${fmt(platformFee)}</td></tr>
      ${stripeFee !== null ? `<tr><td style="color:#555;padding:3px 0">Stripe processing fee</td><td style="text-align:right">−${fmt(stripeFee)}</td></tr>` : ''}
      <tr><td style="padding:3px 0;font-weight:600;border-top:1px solid #eee">Net to you</td><td style="text-align:right;font-weight:600;border-top:1px solid #eee">${fmt(netToClient)}</td></tr>
    </table>
    <p style="color:#888;font-size:12px;margin-top:12px">Payment Intent: ${pi.id}</p>
  `;

  try {
    const fromAddress = process.env.RESEND_FROM_EMAIL ?? 'onboarding@resend.dev';
    const result = await resend.emails.send({
      from: fromAddress,
      to: recipients,
      subject: `New Order — ${billingName}`,
      html,
    });
    console.log('[NOTIFY EMAIL RESULT]', JSON.stringify(result));
  } catch (err) {
    console.error('[NOTIFY EMAIL FAILED]', err);
  }
}
