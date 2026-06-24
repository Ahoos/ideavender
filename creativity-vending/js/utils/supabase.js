import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://vdqmqmhrefccuhpvteat.supabase.co';
const SUPABASE_KEY = 'sb_publishable_2GuCN4Pbg2tvyW1sQ60iJg_8yQp6wCG';
const TABLE = 'creativity_vault';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error) return null;
  return data.user ?? null;
}

export function onAuthChange(callback) {
  return supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user ?? null);
  });
}

export async function signUp(email, password) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  return { data, error };
}

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  return { data, error };
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { error };
}

export async function saveIdea(card, userId) {
  try {
    if (!userId) throw new Error('로그인이 필요합니다.');

    const payload = {
      user_id: userId,
      vending_type: card.vending_type,
      keywords: card.keywords,
      user_memo: card.user_memo ?? '',
      ai_draft: card.ai_draft ?? '',
    };

    const { data, error } = await supabase
      .from(TABLE)
      .insert([payload])
      .select('id, user_id, vending_type, keywords, user_memo, ai_draft, created_at')
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('[supabase] saveIdea error:', error);
    return { data: null, error };
  }
}

export async function updateDraft(id, aiDraft, userId) {
  try {
    if (!userId) throw new Error('로그인이 필요합니다.');

    const { data, error } = await supabase
      .from(TABLE)
      .update({ ai_draft: aiDraft })
      .eq('id', id)
      .eq('user_id', userId)
      .select('id, user_id, vending_type, keywords, user_memo, ai_draft, created_at')
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('[supabase] updateDraft error:', error);
    return { data: null, error };
  }
}

export async function fetchVault(userId, { limit = 100 } = {}) {
  try {
    if (!userId) return { data: [], error: null };

    const { data, error } = await supabase
      .from(TABLE)
      .select('id, user_id, vending_type, keywords, user_memo, ai_draft, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('[supabase] fetchVault error:', error);
    return { data: null, error };
  }
}
