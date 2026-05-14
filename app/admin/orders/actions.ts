'use server';
import { revalidatePath } from 'next/cache';
import { createServerSupabase } from '@/app/_lib/supabase';

export async function setDispatched(paymentIntentId: string, dispatched: boolean) {
  const supabase = createServerSupabase();
  const { error } = await supabase.from('order_tracking').upsert(
    {
      payment_intent_id: paymentIntentId,
      dispatched,
      dispatched_at: dispatched ? new Date().toISOString() : null,
    },
    { onConflict: 'payment_intent_id' }
  );
  if (error) throw new Error(error.message);
  revalidatePath('/admin/orders');
}
