// Shared status data-layer — Supabase only (with optional JSON fallback in pages).
(function () {
  'use strict';

  function hasSupabaseConfig() {
    return (
      typeof window !== 'undefined' &&
      window.SUPABASE_URL &&
      window.SUPABASE_ANON_KEY &&
      window.supabase &&
      typeof window.supabase.createClient === 'function'
    );
  }

  function getClient() {
    if (typeof window !== 'undefined' && typeof window.getSupabaseClient === 'function') {
      return window.getSupabaseClient();
    }

    if (!hasSupabaseConfig()) return null;
    if (!window.__supabaseClient) {
      window.__supabaseClient = window.supabase.createClient(
        window.SUPABASE_URL,
        window.SUPABASE_ANON_KEY
      );
    }
    return window.__supabaseClient;
  }

  async function getAvailabilityStatus() {
    const client = getClient();
    if (!client) return null;

    const { data, error } = await client
      .from('site_status')
      .select('available')
      .eq('id', 1)
      .single();

    if (error) {
      console.error('[supabase] Failed to load site_status:', error);
      return null;
    }

    return !!(data && data.available);
  }

  async function setAvailabilityStatus(available) {
    const client = getClient();
    if (!client) return { error: new Error('Supabase is not configured') };

    const { error } = await client
      .from('site_status')
      .upsert(
        { id: 1, available: !!available, updated_at: new Date().toISOString() },
        { onConflict: 'id' }
      );

    return { error: error ? new Error(error.message || String(error)) : null };
  }

  window.getAvailabilityStatus = getAvailabilityStatus;
  window.setAvailabilityStatus = setAvailabilityStatus;
})();

