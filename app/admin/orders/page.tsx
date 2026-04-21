import { getStripe } from '@/app/_lib/stripe';
import { createServerSupabase } from '@/app/_lib/supabase';
import Image from 'next/image';
import type Stripe from 'stripe';
import { DispatchButton } from './DispatchButton';
import { ExportButton, type ExportOrder } from './ExportButton';

interface ShippingAddress {
  line1: string | null;
  line2: string | null;
  city: string | null;
  postalCode: string | null;
  country: string | null;
}

interface OrderItem {
  name: string;
  quantity: number;
  amount: number;
  currency: string;
  imageUrl: string | null;
  priceId: string | null;
}

interface Order {
  id: string;
  created: number;
  email: string | null;
  name: string | null;
  phone: string | null;
  shippingAddress: ShippingAddress | null;
  amountTotal: number;
  currency: string;
  stripeFee: number | null;
  myFee: number;
  shippingCost: number | null;
  items: OrderItem[];
  paymentStatus: string;
  dispatched: boolean;
  dispatchedAt: string | null;
}

async function getOrders(): Promise<Order[]> {
  const stripe = getStripe();
  const supabase = createServerSupabase();

  const sessions = await stripe.checkout.sessions.list({
    limit: 100,
    status: 'complete',
    expand: ['data.line_items', 'data.payment_intent.latest_charge.balance_transaction'],
  });

  // Collect all price IDs across all orders
  const allPriceIds = new Set<string>();
  for (const session of sessions.data) {
    const lineItems = (session.line_items as Stripe.ApiList<Stripe.LineItem> | undefined)?.data ?? [];
    for (const item of lineItems) {
      const priceId = typeof item.price === 'string' ? item.price : item.price?.id;
      if (priceId) allPriceIds.add(priceId);
    }
  }

  // Fetch matching products from Supabase in one query
  const priceIdList = Array.from(allPriceIds);
  const { data: products } = priceIdList.length > 0
    ? await supabase
        .from('products')
        .select('stripe_price_id, image_url, name')
        .in('stripe_price_id', priceIdList)
    : { data: [] };

  const imageByPriceId = new Map<string, string>();
  for (const p of products ?? []) {
    if (p.stripe_price_id && p.image_url) {
      imageByPriceId.set(p.stripe_price_id, p.image_url);
    }
  }

  // Fetch dispatch statuses
  const sessionIds = sessions.data.map((s) => s.id);
  const { data: tracking } = sessionIds.length > 0
    ? await supabase
        .from('order_tracking')
        .select('stripe_session_id, dispatched, dispatched_at')
        .in('stripe_session_id', sessionIds)
    : { data: [] };

  const dispatchMap = new Map<string, { dispatched: boolean; dispatched_at: string | null }>();
  for (const t of tracking ?? []) {
    dispatchMap.set(t.stripe_session_id, { dispatched: t.dispatched, dispatched_at: t.dispatched_at });
  }

  return sessions.data.map((session) => {
    const lineItems = (session.line_items as Stripe.ApiList<Stripe.LineItem> | undefined)?.data ?? [];

    // Extract Stripe fee from expanded balance transaction
    const paymentIntent =
      session.payment_intent && typeof session.payment_intent !== 'string'
        ? (session.payment_intent as Stripe.PaymentIntent)
        : null;
    const charge =
      paymentIntent?.latest_charge && typeof paymentIntent.latest_charge !== 'string'
        ? (paymentIntent.latest_charge as Stripe.Charge)
        : null;
    const balanceTx =
      charge?.balance_transaction && typeof charge.balance_transaction !== 'string'
        ? (charge.balance_transaction as Stripe.BalanceTransaction)
        : null;

    const amountTotal = session.amount_total ?? 0;
    const stripeFee = balanceTx?.fee ?? null;
    const percentFee = Math.round(amountTotal * 0.05);
    const estimatedStripeFee = Math.round(amountTotal * 0.015) + 20;
    const myFee = percentFee >= estimatedStripeFee ? percentFee : percentFee + 20;
    const shippingCost = session.shipping_cost?.amount_total ?? null;

    const shipping = session.collected_information?.shipping_details?.address;
    const shippingAddress: ShippingAddress | null = shipping
      ? {
          line1: shipping.line1 ?? null,
          line2: shipping.line2 ?? null,
          city: shipping.city ?? null,
          postalCode: shipping.postal_code ?? null,
          country: shipping.country ?? null,
        }
      : null;

    const dispatch = dispatchMap.get(session.id) ?? { dispatched: false, dispatched_at: null };

    return {
      id: session.id,
      created: session.created,
      email: session.customer_details?.email ?? null,
      name: session.customer_details?.name ?? null,
      phone: session.customer_details?.phone ?? null,
      shippingAddress,
      amountTotal,
      currency: session.currency ?? 'gbp',
      stripeFee,
      myFee,
      shippingCost,
      paymentStatus: session.payment_status,
      items: lineItems.map((item) => {
        const priceId = typeof item.price === 'string' ? item.price : item.price?.id ?? null;
        return {
          name: item.description ?? 'Unknown item',
          quantity: item.quantity ?? 1,
          amount: item.amount_total ?? 0,
          currency: item.currency ?? 'gbp',
          priceId,
          imageUrl: priceId ? (imageByPriceId.get(priceId) ?? null) : null,
        };
      }),
      dispatched: dispatch.dispatched,
      dispatchedAt: dispatch.dispatched_at,
    };
  });
}

function formatMoney(amount: number, currency: string) {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount / 100);
}

function formatDateTime(unix: number) {
  const d = new Date(unix * 1000);
  return (
    d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) +
    ' at ' +
    d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  );
}

export default async function OrdersPage() {
  const orders = await getOrders();

  const currency = orders[0]?.currency ?? 'gbp';
  const totalRevenue = orders.reduce((s, o) => s + o.amountTotal, 0);
  const totalFees = orders.reduce((s, o) => s + o.myFee, 0);
  const totalNet = totalRevenue - totalFees;

  const exportOrders: ExportOrder[] = orders.map((o) => ({
    id: o.id,
    created: o.created,
    name: o.name,
    email: o.email,
    phone: o.phone,
    shippingAddress: o.shippingAddress,
    items: o.items.map((i) => ({ name: i.name, quantity: i.quantity, amount: i.amount, currency: i.currency })),
    amountTotal: o.amountTotal,
    currency: o.currency,
    stripeFee: o.stripeFee,
    myFee: o.myFee,
    dispatched: o.dispatched,
  }));

  return (
    <div className="bg-background text-foreground px-6 py-16">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl tracking-tight">ORDERS</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {orders.length} completed {orders.length === 1 ? 'order' : 'orders'}
            </p>
          </div>
          {orders.length > 0 && <ExportButton orders={exportOrders} />}
        </div>

        {/* Summary stats */}
        {orders.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-md border border-muted px-4 py-3">
              <p className="text-xs text-muted-foreground">Revenue</p>
              <p className="text-sm font-medium mt-0.5">{formatMoney(totalRevenue, currency)}</p>
            </div>
            <div className="rounded-md border border-muted px-4 py-3">
              <p className="text-xs text-muted-foreground">Fees</p>
              <p className="text-sm font-medium mt-0.5">{formatMoney(totalFees, currency)}</p>
            </div>
            <div className="rounded-md border border-muted px-4 py-3">
              <p className="text-xs text-muted-foreground">Net to Anna</p>
              <p className="text-sm font-medium mt-0.5">{formatMoney(totalNet, currency)}</p>
            </div>
          </div>
        )}

        {/* Orders */}
        {orders.length === 0 ? (
          <p className="text-sm text-muted-foreground">No orders yet.</p>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div
                key={order.id}
                className="rounded-md border border-muted bg-background px-5 py-4 space-y-4"
              >
                {/* Date/time + dispatch */}
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <p className="text-xs text-muted-foreground">{formatDateTime(order.created)}</p>
                  <DispatchButton
                    sessionId={order.id}
                    dispatched={order.dispatched}
                    dispatchedAt={order.dispatchedAt}
                  />
                </div>

                {/* Customer details */}
                <div className="space-y-0.5">
                  {order.name && <p className="text-sm font-medium">{order.name}</p>}
                  {order.email && <p className="text-sm text-muted-foreground">{order.email}</p>}
                  {order.phone && <p className="text-sm text-muted-foreground">{order.phone}</p>}
                  {order.shippingAddress && (
                    <p className="text-sm text-muted-foreground">
                      {[
                        order.shippingAddress.line1,
                        order.shippingAddress.line2,
                        order.shippingAddress.city,
                        order.shippingAddress.postalCode,
                        order.shippingAddress.country,
                      ]
                        .filter(Boolean)
                        .join(', ')}
                    </p>
                  )}
                </div>

                {/* Items with thumbnails */}
                <div className="border-t border-muted pt-3 space-y-2">
                  {order.items.map((item, i) => (
                    <div key={i} className="flex items-center gap-3 text-sm">
                      {item.imageUrl ? (
                        <Image
                          src={item.imageUrl}
                          alt={item.name}
                          width={48}
                          height={48}
                          className="rounded object-cover shrink-0 w-12 h-12"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded bg-muted shrink-0" />
                      )}
                      <span className="text-muted-foreground flex-1">
                        {item.quantity > 1 ? `${item.quantity}× ` : ''}
                        {item.name}
                      </span>
                      <span className="shrink-0">{formatMoney(item.amount, item.currency)}</span>
                    </div>
                  ))}
                </div>

                {/* Financial breakdown */}
                <div className="border-t border-muted pt-3 space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{formatMoney(order.amountTotal - (order.shippingCost ?? 0), order.currency)}</span>
                  </div>
                  {order.shippingCost !== null && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Shipping</span>
                      <span>{order.shippingCost === 0 ? 'Free' : formatMoney(order.shippingCost, order.currency)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-medium">
                    <span>Total</span>
                    <span>{formatMoney(order.amountTotal, order.currency)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Fee</span>
                    <span>−{formatMoney(order.myFee, order.currency)}</span>
                  </div>
                  <div className="flex justify-between font-medium pt-1 border-t border-muted">
                    <span>Net to Anna</span>
                    <span>{formatMoney(order.amountTotal - order.myFee, order.currency)}</span>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground font-mono">{order.id}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
