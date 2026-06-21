import { CartProvider } from './CartContext';
import { CartDrawer } from './CartDrawer';
import { getShippingRatePence, getCollectionEnabled } from '@/app/_lib/shippingSettings';

export async function CartShell({ children }: { children: React.ReactNode }) {
  const [shippingRate, collectionEnabled] = await Promise.all([
    getShippingRatePence(),
    getCollectionEnabled(),
  ]);
  return (
    <CartProvider shippingRate={shippingRate}>
      {children}
      <CartDrawer collectionEnabled={collectionEnabled} />
    </CartProvider>
  );
}
