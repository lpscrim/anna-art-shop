"use client";

import { useEffect, useMemo, useState } from "react";
import { createBrowserSupabase } from "@/app/_lib/supabaseBrowser";
import type { Session } from "@supabase/supabase-js";

interface AdminAuthGateProps {
  children: React.ReactNode;
}

async function syncAdminCookie(token: string | null) {
  if (!token) {
    await fetch("/api/admin/session", { method: "DELETE" });
    return { ok: true } as const;
  }

  const res = await fetch("/api/admin/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ accessToken: token }),
  });

  if (!res.ok) {
    const data = await res
      .json()
      .catch(() => ({ error: "Authorization failed." }));
    return { ok: false, error: data.error ?? "Authorization failed." } as const;
  }

  return { ok: true } as const;
}

export default function AdminAuthGate({ children }: AdminAuthGateProps) {
  const supabase = useMemo(() => createBrowserSupabase(), []);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function init() {
      // getSession can return a stale/expired token from localStorage.
      // Attempt a refresh first so the access token we sync is valid.
      const { data: refreshed } = await supabase.auth.refreshSession();
      const currentSession = refreshed.session;

      if (!active) return;

      if (!currentSession) {
        // No valid session at all — clear cookie and show login
        await syncAdminCookie(null);
        setSession(null);
        setLoading(false);
        return;
      }

      setSession(currentSession);
      const result = await syncAdminCookie(currentSession.access_token);
      if (!active) return;

      if (!result.ok) {
        setError(result.error);
        await supabase.auth.signOut();
        setSession(null);
      }
      setLoading(false);
    }

    init();

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, nextSession) => {
        setSession(nextSession);
        const result = await syncAdminCookie(nextSession?.access_token ?? null);
        if (!result.ok) {
          setError(result.error);
          await supabase.auth.signOut();
          setSession(null);
        }
      },
    );

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, [supabase]);

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message);
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    await syncAdminCookie(null);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground px-6 py-16">
        <div className="max-w-md mx-auto text-sm text-muted-foreground">
          Loading…
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-background text-foreground px-6 py-16">
        <div className="max-w-md mx-auto space-y-6">
          <div>
            <h1 className="text-3xl tracking-tight">ADMIN LOGIN</h1>
            <p className="text-sm text-muted-foreground">
              Sign in to access admin tools.
            </p>
          </div>

          {error && (
            <div className="rounded-md border border-red-400 bg-red-50 px-4 py-3 text-red-700 text-sm">
              {error}
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSignIn}>
            <label className="block">
              <span className="text-sm font-medium">Email</span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full rounded-md border border-muted bg-background px-3 py-2 text-sm"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium">Password</span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full rounded-md border border-muted bg-background px-3 py-2 text-sm"
              />
            </label>
            <button
              type="submit"
              className="w-full rounded-md bg-foreground px-4 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90"
            >
              Sign in
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background text-foreground flex py-4 pt-16 flex-col">
      <div className="flex items-center justify-between px-6 text-xs text-muted-foreground">
        <span>Signed in as {session.user.email}</span>
        <button
          type="button"
          onClick={handleSignOut}
          className="text-foreground hover:text-muted-foreground transition-colors"
        >
          Sign out
        </button>
      </div>
      <div className="flex-1">{children}</div>
    </div>
  );
}
