import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/app/_lib/stripe';
import { createServerSupabase } from '@/app/_lib/supabase';
import type Stripe from 'stripe';
import { Resend } from 'resend';

export async function POST(req: NextRequest) {
  const stripe = getStripe();
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;
  const sig = req.headers.get('stripe-signature');
  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig!, endpointSecret);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: `Webhook Error: ${message}` }, { status: 400 });
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

    await notifyClient(session);
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

async function notifyClient(session: Stripe.Checkout.Session) {
  const apiKey = process.env.RESEND_API_KEY;
  const notifyEmail = process.env.NOTIFY_EMAIL;
  if (!apiKey || !notifyEmail) return;

  const resend = new Resend(apiKey);
  const recipients = notifyEmail.split(',').map((e) => e.trim()).filter(Boolean);

  const customer = session.customer_details;
  type CollectedInfo = { shipping_details?: { address?: { line1?: string; line2?: string; city?: string; postal_code?: string; country?: string } } };
  const shipping = (session.collected_information as CollectedInfo | null)?.shipping_details;
  const amountTotal = session.amount_total ?? 0;
  const shippingCost = session.shipping_cost?.amount_total ?? 0;
  const subtotal = amountTotal - shippingCost;

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

  let itemsHtml = '';
  try {
    const reserved = JSON.parse(session.metadata?.reserved_items ?? '[]') as { title: string; qty: number; price: number; image?: string; type?: string }[];
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

  const customerName = customer?.name ?? 'Unknown';
  const platformFee = Math.round(amountTotal * 0.05) + 20;
  const netToClient = amountTotal - platformFee;

  const html = `
    <h2>New Order — ${customerName}</h2>
    <p><strong>Customer:</strong> ${customerName}<br>
    <strong>Email:</strong> ${customer?.email ?? 'Unknown'}<br>
    <strong>Phone:</strong> ${customer?.phone ?? 'Not provided'}</p>
    <p><strong>Shipping address:</strong><br>${addressLines}</p>
    <h3>Items</h3>
    <div>${itemsHtml}</div>
    <table style="width:100%;max-width:360px;border-collapse:collapse;margin-top:12px;font-size:14px">
      <tr><td style="color:#555;padding:3px 0">Subtotal</td><td style="text-align:right">${fmt(subtotal)}</td></tr>
      <tr><td style="color:#555;padding:3px 0">Shipping</td><td style="text-align:right">${shippingCost === 0 ? 'Free' : fmt(shippingCost)}</td></tr>
      <tr><td style="padding:3px 0;font-weight:600">Total</td><td style="text-align:right;font-weight:600">${fmt(amountTotal)}</td></tr>
      <tr><td style="color:#555;padding:3px 0;border-top:1px solid #eee">Fees (Stripe + platform)</td><td style="text-align:right;border-top:1px solid #eee">−${fmt(platformFee)}</td></tr>
      <tr><td style="padding:3px 0;font-weight:600">Net to you</td><td style="text-align:right;font-weight:600">${fmt(netToClient)}</td></tr>
    </table>
    <p style="color:#aaa;font-size:11px;margin-top:6px">Fees include Stripe processing and platform fee (5% + 20p).</p>
    <p style="color:#888;font-size:12px">Stripe session: ${session.id}</p>
  `;

  try {
    const fromAddress = process.env.RESEND_FROM_EMAIL ?? 'onboarding@resend.dev';
    const result = await resend.emails.send({
      from: fromAddress,
      to: recipients,
      subject: `New Order — ${customerName}`,
      html,
    });
    console.log('[NOTIFY EMAIL RESULT]', JSON.stringify(result));
  } catch (err) {
    console.error('[NOTIFY EMAIL FAILED]', err);
  }
}
