'use client';
import Button from './Button';
import { useCart } from '../../Cart/CartContext';

interface BuyButtonProps {
  stripePriceId: string | null;
  stockLevel: number;
  /** Price in pence */
  priceHw: number;
  /** Product name (shown in cart) */
  name: string;
  /** Thumbnail URL (shown in cart) */
  imageUrl: string;
}

export function BuyButton({ stripePriceId, stockLevel, priceHw, name, imageUrl }: BuyButtonProps) {
  const { addItem } = useCart();

  const outOfStock = stockLevel <= 0;
  const notAvailable = !stripePriceId;

  const raw = priceHw / 100;
  const displayPrice = raw % 1 === 0 ? raw.toFixed(0) : raw.toFixed(2);

  function handleClick() {
    if (outOfStock || notAvailable) return;
    addItem({
      priceId: stripePriceId!,
      name,
      imageUrl,
      priceHw,
      stockLevel,
    });
  }

  return (
    <Button
      onClick={handleClick}
      disabled={outOfStock || notAvailable}
      size='lg'
    >
      <span className="inline-flex items-center justify-center min-w-[3ch]">
        {outOfStock ? (
          <span className="text-red-600">N/A</span>
        ) : (
          <>
            <span className="transition-opacity duration-200 group-hover:opacity-0 group-hover:hidden">Buy</span>
            <span className="transition-opacity duration-200 opacity-0 hidden group-hover:inline group-hover:opacity-100">£{displayPrice}</span>
          </>
        )}
      </span>
    </Button>
  );
}
