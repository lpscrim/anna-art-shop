'use client';

import { useActionState } from 'react';
import { updateFeatured, type UpdateFeaturedState } from './actions';

interface Product {
  id: string;
  name: string;
  featured: boolean;
}

const initialState: UpdateFeaturedState = { success: false };

export default function FeaturedClient({ products }: { products: Product[] }) {
  const [state, formAction, isPending] = useActionState(updateFeatured, initialState);

  // If none are explicitly featured, default to the 4 most recent (first in list)
  const noneSelected = products.every((p) => !p.featured);
  const defaultChecked = (product: Product, idx: number) =>
    product.featured || (noneSelected && idx < 4);

  return (
    <div className="min-h-screen bg-background text-foreground px-6 py-16">
      <div className="max-w-xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl tracking-tight mb-2">FEATURED</h1>
          <p className="text-sm text-muted-foreground">
            Select the paintings to feature on the home page.
          </p>
        </div>

        <form action={formAction} className="space-y-6">
          <div className="space-y-2">
            {products.map((product, idx) => (
              <label
                key={product.id}
                className="flex items-center gap-3 cursor-pointer rounded-md border border-muted px-4 py-3 transition-colors hover:border-foreground"
              >
                <input
                  type="checkbox"
                  name="featured"
                  value={product.id}
                  defaultChecked={defaultChecked(product, idx)}
                  className="h-4 w-4 rounded border-muted accent-foreground"
                />
                <span className="text-sm">{product.name}</span>
              </label>
            ))}
          </div>

          {state.error && (
            <div className="rounded-md border border-red-400 bg-red-50 px-4 py-3 text-red-700 text-sm">
              {state.error}
            </div>
          )}
          {state.success && (
            <div className="rounded-md border border-green-400 bg-green-50 px-4 py-3 text-green-700 text-sm">
              Featured selections saved.
            </div>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="w-full rounded-md bg-foreground px-4 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {isPending ? 'Saving…' : 'Save'}
          </button>
        </form>
      </div>
    </div>
  );
}
