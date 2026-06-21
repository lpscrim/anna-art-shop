import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/app/_lib/stripe';
import { createServerSupabase } from '@/app/_lib/supabase';
import { revalidatePath } from 'next/cache';
import type Stripe from 'stripe';
import { Resend } from 'resend';

function escapeHtml(s: string | null | undefined): string {
  if (!s) return '';
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

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
    // Use the connect secret exclusively when configured — never fall back
    // silently after a failure, which would allow forged events signed with
    // the platform-account secret to bypass connect-secret validation.
    const secret = connectSecret ?? accountSecret;
    event = stripe.webhooks.constructEvent(rawBody, sig!, secret);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: `Webhook Error: ${message}` }, { status: 400 });
  }

  // Stock is reserved when the PaymentIntent is created.
  // We listen to charge.succeeded (not payment_intent.succeeded) because
  // balance_transaction is guaranteed to exist by the time charge.succeeded fires,
  // whereas on payment_intent.succeeded it may not be populated yet.
  // We still listen to payment_intent.canceled for stock restoration.

  if (event.type === 'charge.succeeded') {
    const charge = event.data.object as Stripe.Charge;
    console.log('[ORDER COMPLETED]', {
      chargeId: charge.id,
      paymentIntentId: charge.payment_intent,
      amount: charge.amount,
      currency: charge.currency,
    });
    revalidatePath('/work');
    revalidatePath('/');
    await notifyClientFromCharge(charge, stripe);
  }

  if (event.type === 'payment_intent.canceled') {
    const pi = event.data.object as Stripe.PaymentIntent;
    const raw = pi.metadata?.reserved_items;
    if (raw) {
      try {
        const reserved = JSON.parse(raw) as { stripe_price_id: string; qty: number }[];
        const supabase = createServerSupabase();
        await supabase.rpc('restore_stock', { items: reserved });
        revalidatePath('/work');
        revalidatePath('/');
      } catch (err) {
        console.error('Failed to restore stock on PI cancellation:', err);
      }
    }
  }

  if (event.type === 'payment_intent.payment_failed' || (event.type as string) === 'payment_intent.expired') {
    const pi = event.data.object as Stripe.PaymentIntent;
    const raw = pi.metadata?.reserved_items;
    if (raw) {
      try {
        const reserved = JSON.parse(raw) as { stripe_price_id: string; qty: number }[];
        const supabase = createServerSupabase();
        await supabase.rpc('restore_stock', { items: reserved });
        revalidatePath('/work');
        revalidatePath('/');
      } catch (err) {
        console.error(`Failed to restore stock on ${event.type}:`, err);
      }
    }
  }

  return NextResponse.json({ received: true });
}

async function notifyClientFromCharge(charge: Stripe.Charge, stripe: ReturnType<typeof import('@/app/_lib/stripe').getStripe>) {
  const apiKey = process.env.RESEND_API_KEY;
  const notifyEmail = process.env.NOTIFY_EMAIL;
  if (!apiKey || !notifyEmail) return;

  const resend = new Resend(apiKey);
  const recipients = notifyEmail.split(',').map((e) => e.trim()).filter(Boolean);

  const clientAccountId = process.env.STRIPE_CONNECT_CLIENT_ACCOUNT_ID?.trim() || undefined;
  const stripeOpts = clientAccountId ? { stripeAccount: clientAccountId } : undefined;

  // Retrieve balance_transaction if not already expanded on the charge event
  let balanceTx: Stripe.BalanceTransaction | null = null;
  // For direct Connect charges, balance_transaction is settled asynchronously —
  // it may be null at charge.succeeded time. Retrieve the full charge with
  // expand to catch cases where it IS available, then fall back to estimation.
  try {
    const fullCharge = await stripe.charges.retrieve(
      charge.id,
      { expand: ['balance_transaction'] },
      stripeOpts,
    );
    if (fullCharge.balance_transaction && typeof fullCharge.balance_transaction !== 'string') {
      balanceTx = fullCharge.balance_transaction as Stripe.BalanceTransaction;
    }
  } catch (err) {
    console.error('[WEBHOOK] Failed to retrieve charge with balance_transaction:', err);
  }

  // Fetch PaymentIntent for metadata (reserved_items, shipping_amount).
  // If this fails we still send the email — just without item breakdown / shipping split.
  let pi: Stripe.PaymentIntent | null = null;
  if (charge.payment_intent && typeof charge.payment_intent === 'string') {
    try {
      pi = await stripe.paymentIntents.retrieve(charge.payment_intent, undefined, stripeOpts);
    } catch (err) {
      console.error('[WEBHOOK] Failed to retrieve PaymentIntent:', err);
    }
  }

  const billingEmail = charge.billing_details?.email ?? null;
  const billingName = charge.billing_details?.name ?? null;
  const shipping = charge.shipping;

  const amountTotal = charge.amount;
  // shippingCost is null (not 0) when metadata is unavailable, so the email
  // can show "Total" only rather than misreporting "Subtotal" + "Free shipping".
  const shippingCost = pi?.metadata?.shipping_amount
    ? parseInt(pi.metadata.shipping_amount, 10)
    : null;
  const subtotal = shippingCost !== null ? amountTotal - shippingCost : null;
  const platformFee = Math.round(amountTotal * 0.01);
  const stripeFee = balanceTx?.fee ?? null;
  const netToClient = stripeFee !== null ? amountTotal - platformFee - stripeFee : null;

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
    ?? (charge.billing_details as { phone?: string } | null)?.phone
    ?? 'Not provided';

  type ReservedItem = { title: string; qty: number; price: number; image?: string; type?: string };
  let reservedItems: ReservedItem[] = [];
  try {
    reservedItems = JSON.parse(pi?.metadata?.reserved_items ?? '[]');
  } catch { /* fall through — empty array */ }

  const ownerItemsHtml = reservedItems.length > 0
    ? reservedItems
        .map((i) => `<div style="display:inline-block;margin:8px;vertical-align:top;text-align:center;width:160px">
          ${i.image ? `<img src="${encodeURI(i.image)}" alt="${escapeHtml(i.title)}" width="160" height="160" style="object-fit:cover;border-radius:6px;display:block">` : ''}
          <p style="margin:6px 0 2px;font-weight:600">${escapeHtml(i.title)}</p>
          ${i.type ? `<p style="margin:0 0 2px;color:#888;font-size:12px;text-transform:capitalize">${escapeHtml(i.type)}</p>` : ''}
          <p style="margin:0;color:#555">x${i.qty} &mdash; ${fmt(i.price)}</p>
        </div>`)
        .join('')
    : '<p>See Stripe dashboard for items</p>';

  const customerItemsHtml = reservedItems.length > 0
    ? reservedItems
        .map((i) => `<div style="margin-bottom:32px">
          ${i.image ? `<img src="${encodeURI(i.image)}" alt="${escapeHtml(i.title)}" width="520" style="width:100%;max-width:520px;height:auto;display:block;border-radius:6px;margin-bottom:12px">` : ''}
          <p style="margin:0 0 4px;font-size:16px;font-weight:600">${escapeHtml(i.title)}</p>
          ${i.type ? `<p style="margin:0 0 4px;color:#888;font-size:13px;text-transform:capitalize">${escapeHtml(i.type)}</p>` : ''}
          <p style="margin:0;color:#555;font-size:14px">Qty: ${i.qty} &mdash; ${fmt(i.price)}</p>
        </div>`)
        .join('')
    : '';

  const isCollection = pi?.metadata?.collection === 'true';

  const ownerHtml = `
    <h2>New Order — ${escapeHtml(billingName) || 'New Customer'}${isCollection ? ' 📦 COLLECTION' : ''}</h2>
    <p><strong>Customer:</strong> ${escapeHtml(billingName) || 'Unknown'}<br>
    <strong>Email:</strong> ${escapeHtml(billingEmail) || 'Unknown'}<br>
    <strong>Phone:</strong> ${escapeHtml(phone)}</p>
    ${isCollection
      ? `<p style="background:#fffbeb;border:1px solid #f59e0b;padding:8px 12px;border-radius:4px;font-weight:600">⚠️ Customer has chosen to collect from Edinburgh — no shipping required.</p>`
      : `<p><strong>Shipping address:</strong><br>${escapeHtml(addressLines)}</p>`
    }
    <h3>Items</h3>
    <div>${ownerItemsHtml}</div>
    <table style="width:100%;max-width:360px;border-collapse:collapse;margin-top:12px;font-size:14px">
      ${subtotal !== null ? `<tr><td style="color:#555;padding:3px 0">Subtotal</td><td style="text-align:right">${fmt(subtotal)}</td></tr>` : ''}
      ${shippingCost !== null ? `<tr><td style="color:#555;padding:3px 0">Shipping</td><td style="text-align:right">${shippingCost === 0 ? 'Free' : fmt(shippingCost)}</td></tr>` : ''}
      <tr><td style="padding:3px 0;font-weight:600">Total</td><td style="text-align:right;font-weight:600">${fmt(amountTotal)}</td></tr>
      <tr><td style="color:#555;padding:3px 0;border-top:1px solid #eee">Platform fee (1%)</td><td style="text-align:right;border-top:1px solid #eee">−${fmt(platformFee)}</td></tr>
      <tr><td style="color:#555;padding:3px 0">Stripe processing fee</td><td style="text-align:right">${stripeFee !== null ? `−${fmt(stripeFee)}` : 'See dashboard'}</td></tr>
      <tr><td style="padding:3px 0;font-weight:600;border-top:1px solid #eee">Net to you</td><td style="text-align:right;font-weight:600;border-top:1px solid #eee">${netToClient !== null ? fmt(netToClient) : 'See dashboard'}</td></tr>
    </table>
    <p style="color:#888;font-size:12px;margin-top:12px">Charge: ${charge.id} | Payment Intent: ${pi?.id ?? 'N/A'}</p>
  `;

  const customerHtml = `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#111">
      <h1 style="font-size:24px;font-weight:700;margin-bottom:4px">${billingName ? `Hi ${escapeHtml(billingName.split(' ')[0])},` : 'Order confirmed'}</h1>
      <p style="color:#555;margin-top:0">Your order has been confirmed.</p>

      <hr style="border:none;border-top:1px solid #eee;margin:24px 0">

      <h2 style="font-size:16px;font-weight:600;margin-bottom:16px">Your order</h2>
      ${customerItemsHtml}

      <hr style="border:none;border-top:1px solid #eee;margin:24px 0">

      <table style="width:100%;max-width:400px;border-collapse:collapse;font-size:14px">
        ${subtotal !== null ? `<tr><td style="color:#555;padding:4px 0">Subtotal</td><td style="text-align:right">${fmt(subtotal)}</td></tr>` : ''}
        ${shippingCost !== null ? `<tr><td style="color:#555;padding:4px 0">Shipping</td><td style="text-align:right">${shippingCost === 0 ? 'Free' : fmt(shippingCost)}</td></tr>` : ''}
        <tr style="border-top:1px solid #eee"><td style="padding:8px 0 4px;font-weight:600;font-size:15px">Total</td><td style="text-align:right;font-weight:600;font-size:15px;padding-top:8px">${fmt(amountTotal)}</td></tr>
      </table>

      <hr style="border:none;border-top:1px solid #eee;margin:24px 0">

      ${isCollection
        ? `<p style="font-size:14px"><strong>Collection</strong><br>You've chosen to collect from Edinburgh.</p>`
        : `<p style="font-size:14px"><strong>Shipping to</strong><br><span style="color:#555">${escapeHtml(addressLines)}</span></p>`
      }

      ${isCollection
        ? `<p style="font-size:14px;margin-top:32px">I'll be in touch with you directly soon to arrange a convenient time for collection.</p>`
        : ''
      }
      <p style="font-size:14px;margin-top:32px">Thank you so much for your purchase. It really means a lot that you're supporting my work.</p>
      <p style="font-size:14px;margin-top:8px">Thanks,<br>Anna</p>
    </div>
  `;

  const fromAddress = process.env.RESEND_FROM_EMAIL ?? 'onboarding@resend.dev';

  try {
    const result = await resend.emails.send({
      from: fromAddress,
      to: recipients,
      subject: `New Order — ${billingName ?? billingEmail ?? charge.id}`,
      html: ownerHtml,
    });
    console.log('[NOTIFY EMAIL RESULT]', JSON.stringify(result));
  } catch (err) {
    console.error('[NOTIFY EMAIL FAILED]', err);
  }

  if (billingEmail) {
    try {
      const result = await resend.emails.send({
        from: fromAddress,
        to: [billingEmail],
        subject: `Order confirmed`,
        html: customerHtml,
      });
      console.log('[CUSTOMER EMAIL RESULT]', JSON.stringify(result));
    } catch (err) {
      console.error('[CUSTOMER EMAIL FAILED]', err);
    }
  }
}
