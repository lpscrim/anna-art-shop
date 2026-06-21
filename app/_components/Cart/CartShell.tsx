import { CartProvider } from './CartContext';
import { CartDrawer } from './CartDrawer';
import { getShippingRates, getCollectionEnabled } from '@/app/_lib/shippingSettings';

export async function CartShell({ children }: { children: React.ReactNode }) {
  const [rates, collectionEnabled] = await Promise.all([
    getShippingRates(),
    getCollectionEnabled(),
  ]);
  return (
    <CartProvider shippingRate={rates.artworkRate} printShippingRate={rates.printRate}>
      {children}
      <CartDrawer collectionEnabled={collectionEnabled} />
    </CartProvider>
  );
}
