import { supabase } from '../../../lib/supbase';
import { NextResponse } from 'next/server';

export async function GET() {
  const { data, error } = await supabase
    .from('waitlist')
    .select('email, referral_count, waitlist_position, in_top_50, top_position, created_at')
    .order('created_at', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
