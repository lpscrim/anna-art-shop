import { getCategoriesVisible, getShippingRatePence } from '@/app/_lib/shippingSettings';
import { ShippingForm } from './ShippingForm';
import { CategoriesToggle } from './CategoriesToggle';

export default async function ShippingPage() {
  const [currentRate, categoriesVisible] = await Promise.all([
    getShippingRatePence(),
    getCategoriesVisible(),
  ]);

  return (
    <div className="bg-background text-foreground px-6 pt-32 pb-16">
      <div className="max-w-xl mx-auto space-y-12">
        <div className="space-y-4">
          <div>
            <h1 className="text-3xl tracking-tight mb-16">SETTINGS</h1>
            <h2 className="text-xl tracking-tight">SHIPPING RATE</h2>
            <p className="text-base text-muted-foreground mt-1">
              Flat rate applied to every order at checkout.
            </p>
          </div>
          <ShippingForm currentRate={currentRate} />
        </div>

        <div className="space-y-4 border-t border-muted pt-10">
          <div>
            <h2 className="text-xl tracking-tight">CATEGORY FILTERS</h2>
            <p className="text-base text-muted-foreground mt-1">
              Show or hide category filter buttons on the Work gallery.
            </p>
          </div>
          <CategoriesToggle current={categoriesVisible} />
        </div>
      </div>
    </div>
  );
}
