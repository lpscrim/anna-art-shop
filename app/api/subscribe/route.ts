import { NextRequest, NextResponse } from 'next/server';

const BREVO_FORM_URL =
  'https://989ae4b7.sibforms.com/serve/MUIFALP-q10Zm5q95kRlNTp8I88j9mW0YnWtbqZiok8jK9AlhJh4IlhSqh6Ku4C8y_8ewPC07_ZnrJsFq-PEedOtC8eC4dxilCqEV98MgTx4qR020Jwtd1QSW_Jsde58QFaAiwdZ5r-7X3fsR-rIQkTZ6JwLR4F_GLSSAht3mIM3hV-iRifwHP0F6hth-rK1bkl4BMvlUQBNTG6SbA==';

export async function POST(req: NextRequest) {
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

  const form = new URLSearchParams();
  form.set('EMAIL', email);
  form.set('email_address_check', '');
  form.set('locale', 'en');

  try {
    const res = await fetch(BREVO_FORM_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: form.toString(),
    });

    if (res.ok || res.status === 302) {
      return NextResponse.json({ success: true });
    }

    console.error('[SUBSCRIBE] Brevo form error:', res.status);
    return NextResponse.json({ error: 'Failed to subscribe' }, { status: 500 });
  } catch (err) {
    console.error('[SUBSCRIBE] Fetch error:', err);
    return NextResponse.json({ error: 'Failed to subscribe' }, { status: 500 });
  }
}
