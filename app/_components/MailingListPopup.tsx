'use client';

import { useEffect, useState } from 'react';

const STORAGE_KEY = 'mailing_list_dismissed';
const DELAY_MS = 5000;

export default function MailingListPopup() {
  const [visible, setVisible] = useState(false);
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  function open() {
    setStatus('idle');
    setEmail('');
    setErrorMsg('');
    setVisible(true);
  }

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (sessionStorage.getItem(STORAGE_KEY)) return;

    const timer = setTimeout(() => setVisible(true), DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handler = () => open();
    window.addEventListener('open-mailing-list', handler);
    return () => window.removeEventListener('open-mailing-list', handler);
  }, []);

  function dismiss() {
    sessionStorage.setItem(STORAGE_KEY, '1');
    setVisible(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setStatus('loading');
    setErrorMsg('');

    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Something went wrong');
      setStatus('success');
      sessionStorage.setItem(STORAGE_KEY, '1');
    } catch (err: unknown) {
      setStatus('error');
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong');
    }
  }

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
      onClick={(e) => { if (e.target === e.currentTarget) dismiss(); }}
    >
      <div
        className="relative w-full max-w-sm bg-background text-foreground p-8"
        style={{ border: '1px solid var(--border)' }}
      >
        {/* Close button */}
        <button
          onClick={dismiss}
          aria-label="Close"
          className="absolute top-3 right-4 text-muted-foreground hover:text-foreground transition-colors text-lg leading-none cursor-crosshair"
        >
          ×
        </button>

        {status === 'success' ? (
          <div className="text-center py-4">
            <p className="text-lg mb-1">Thank you</p>
            <p className="text-sm text-muted-foreground">You&apos;re on the list.</p>
            <button
              onClick={dismiss}
              className="mt-6 text-xs text-muted-foreground underline underline-offset-2 cursor-crosshair"
            >
              Close
            </button>
          </div>
        ) : (
          <>
            <h2 className="text-xl mb-1" style={{ fontFamily: 'EB Garamond, serif' }}>
              Stay in the loop
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              New work, upcoming exhibitions, and occasional updates from the studio.
            </p>

            <form onSubmit={handleSubmit} noValidate>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="w-full bg-transparent border-b border-foreground/30 focus:border-foreground outline-none py-1.5 text-sm placeholder:text-muted-foreground mb-4 transition-colors"
              />

              {status === 'error' && (
                <p className="text-xs text-destructive mb-3">{errorMsg}</p>
              )}

              <div className="flex items-center justify-between">
                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="cursor-crosshair text-sm transition-all duration-250 group disabled:opacity-50"
                >
                  <span className="group-hover:px-0.5 transition-all duration-250">[</span>{' '}
                  {status === 'loading' ? 'Subscribing…' : 'Subscribe'}{' '}
                  <span className="group-hover:px-0.5 transition-all duration-250">]</span>
                </button>
                <button
                  type="button"
                  onClick={dismiss}
                  className="text-sm text-muted-foreground underline underline-offset-2 cursor-crosshair"
                >
                  No thanks
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
