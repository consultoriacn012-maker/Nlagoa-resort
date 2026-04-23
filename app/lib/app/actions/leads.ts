"use server"
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function submitLead(formData: any) {
  const { error } = await supabase.from('contact_leads').insert([formData]);
  if (error) return { success: false };
  return { success: true };
}

export async function trackCtaClick(ctaName: string) {
  await supabase.from('cta_clicks').insert([{ cta_name: ctaName }]);
}
