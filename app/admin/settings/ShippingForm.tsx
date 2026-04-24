'use client';
import { useState } from 'react';
import { updatePrintShippingRate, updateArtworkShippingRate } from './actions';

function RateField({
  label,
  description,
  initialPence,
  onSave,
}: {
  label: string;
  description: string;
  initialPence: number;
  onSave: (pence: number) => Promise<void>;
}) {
  const [pounds, setPounds] = useState((initialPence / 100).toFixed(2));
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
    setPending(true);
    try {
      await onSave(Math.round(val * 100));
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 max-w-xs">
      <label className="block">
        <span className="text-base font-medium">{label}</span>
        <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
        <div className="relative mt-2">
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

export function ShippingForm({ printRate, artworkRate }: { printRate: number; artworkRate: number }) {
  return (
    <div className="space-y-8">
      <RateField
        label="Prints shipping rate (£)"
        description="Applied when the order contains only prints. Set to 0 for free."
        initialPence={printRate}
        onSave={updatePrintShippingRate}
      />
      <RateField
        label="Artwork / paintings shipping rate (£)"
        description="Applied when the order contains any original artwork or painting."
        initialPence={artworkRate}
        onSave={updateArtworkShippingRate}
      />
    </div>
  );
}
