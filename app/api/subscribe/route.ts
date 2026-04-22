import { NextRequest, NextResponse } from 'next/server';
import * as Brevo from '@getbrevo/brevo';

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

  const contactsApi = new Brevo.ContactsApi();
  contactsApi.setApiKey(Brevo.ContactsApiApiKeys.apiKey, apiKey);

  try {
    const contact = new Brevo.CreateContact();
    contact.email = email;
    contact.listIds = [parseInt(listId, 10)];
    contact.updateEnabled = true;

    await contactsApi.createContact(contact);
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    // Brevo returns 204 or throws — treat "already exists" as success
    const status = (err as { response?: { status?: number } })?.response?.status;
    if (status === 204) return NextResponse.json({ success: true });
    console.error('[SUBSCRIBE] Brevo error:', err);
    return NextResponse.json({ error: 'Failed to subscribe' }, { status: 500 });
  }
}
