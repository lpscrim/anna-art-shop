import { getShippingRatePence } from '@/app/_lib/shippingSettings';
import { ShippingForm } from './ShippingForm';

export default async function ShippingPage() {
  const currentRate = await getShippingRatePence();

  return (
    <div className="bg-background text-foreground px-6 pt-32 pb-16">
      <div className="max-w-xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl tracking-tight">SHIPPING</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Flat rate applied to every order at checkout.
          </p>
        </div>
        <ShippingForm currentRate={currentRate} />
      </div>
    </div>
  );
}
