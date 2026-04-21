'use client';
import { useState } from 'react';
import { updateShippingRate } from './actions';

export function ShippingForm({ currentRate }: { currentRate: number }) {
  const [pounds, setPounds] = useState((currentRate / 100).toFixed(2));
  const [pending, setPending] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    const val = parseFloat(pounds);
    if (isNaN(val) || val < 0) {
      setError('Enter a valid amount (0 for free shipping)');
      return;
    }
    const pence = Math.round(val * 100);
    setPending(true);
    try {
      await updateShippingRate(pence);
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-xs">
      <label className="block">
        <span className="text-base font-medium">Shipping rate (£)</span>
        <div className="relative mt-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-base">£</span>
          <input
            type="number"
            min="0"
            step="0.01"
            value={pounds}
            onChange={(e) => { setPounds(e.target.value); setSaved(false); }}
            className="block w-full rounded-md border border-muted bg-background pl-7 pr-3 py-2 text-base focus:border-foreground focus:outline-none"
          />
        </div>
        <p className="text-sm text-muted-foreground mt-1">Set to 0 for free shipping.</p>
      </label>

      {error && <p className="text-base text-red-500">{error}</p>}
      {saved && <p className="text-base text-green-600">Saved.</p>}

      <button
        type="submit"
        disabled={pending}
        className="px-4 py-2 rounded border border-foreground bg-foreground text-background text-base transition-opacity hover:opacity-80 disabled:opacity-50"
      >
        {pending ? 'Saving…' : 'Save'}
      </button>
    </form>
  );
}
