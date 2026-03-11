'use client';

import { CartProvider } from './CartContext';
import { CartDrawer } from './CartDrawer';

export function CartShell({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      {children}
      <CartDrawer />
    </CartProvider>
  );
}
