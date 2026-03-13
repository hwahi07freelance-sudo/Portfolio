// Shared projects data-layer — Supabase only.
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
    if (!hasSupabaseConfig()) return null;
    if (!window.__supabaseClient) {
      window.__supabaseClient = window.supabase.createClient(
        window.SUPABASE_URL,
        window.SUPABASE_ANON_KEY
      );
    }
    return window.__supabaseClient;
  }

  function normalizeProject(row) {
    if (!row || typeof row !== 'object') return row;
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      skills: Array.isArray(row.skills) ? row.skills : [],
      image: row.image || 'images/image.png',
      link: row.link || '#',
      featured: !!row.featured,
      isVerified: !!row.is_verified,
      rating: row.rating ?? null,
      reviewCount: row.review_count ?? null,
      reviews: row.reviews ?? null
    };
  }

  async function getProjects() {
    const client = getClient();
    if (!client) {
      console.error('[supabase] Supabase is not configured. Check js/supabase-config.js');
      return [];
    }

    const { data, error } = await client
      .from('projects')
      .select('*')
      .order('id', { ascending: true });

    if (error) {
      console.error('[supabase] Failed to load projects:', error);
      return [];
    }

    return (data || []).map(normalizeProject);
  }

  async function getProjectById(id) {
    const pid = Number(id);
    const list = await getProjects();
    return list.find(p => Number(p.id) === pid);
  }

  // Expose helpers for pages + CMS.
  window.getProjectsData = getProjects;
  window.getProjectById = getProjectById;
  // Expose Supabase helpers (CMS uses these for writes).
  window.getSupabaseClient = getClient;
  window.supabaseEnabled = hasSupabaseConfig;
})();
