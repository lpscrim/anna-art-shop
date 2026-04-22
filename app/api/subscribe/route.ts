import { NextRequest, NextResponse } from 'next/server';
import { BrevoClient } from '@getbrevo/brevo';

export async function POST(req: NextRequest) {
  const apiKey = process.env.BREVO_API_KEY;
  const listId = process.env.BREVO_LIST_ID;

  if (!apiKey || !listId) {
    console.error('[SUBSCRIBE] Missing BREVO_API_KEY or BREVO_LIST_ID');
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
  }

  let email: string;
  try {
    const body = await req.json();
    email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
  }

  const brevo = new BrevoClient({ apiKey });

  try {
    await brevo.contacts.createContact({
      email,
      listIds: [parseInt(listId, 10)],
      updateEnabled: true,
    });
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const status = (err as { status?: number })?.status;
    // 204 = already exists / no content — treat as success
    if (status === 204) return NextResponse.json({ success: true });
    console.error('[SUBSCRIBE] Brevo error:', err);
    return NextResponse.json({ error: 'Failed to subscribe' }, { status: 500 });
  }
}
