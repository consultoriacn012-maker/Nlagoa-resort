"use server"
import { createClient } from '@supabase/supabase-js';

// Usando as variáveis que você configurou na Vercel
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function submitLead(formData: any) {
  try {
    const { error } = await supabase
      .from('contact_leads')
      .insert([formData]);

    if (error) throw error;
    return { success: true };
  } catch (err) {
    console.error(err);
    return { success: false };
  }
}

export async function trackCtaClick(ctaName: string) {
  try {
    await supabase
      .from('cta_clicks')
      .insert([{ cta_name: ctaName }]);
  } catch (err) {
    console.error(err);
  }
}
