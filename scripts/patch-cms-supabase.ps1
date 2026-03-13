param(
  [string]$CmsFile = "wwieufbwiesudnoweidjnowaesidkwuaehfbcweiufbcwkeufbweaukifbcawuedfwbieuoaieufbweiuafb.html"
)

$ErrorActionPreference = "Stop"

$root = (Get-Location).Path
$path = Join-Path $root $CmsFile
if (-not (Test-Path $path)) {
  throw "CMS file not found: $path"
}

# This file uses a non-UTF8 encoding (contains mis-decoded emoji). Preserve its original encoding.
$enc = [System.Text.Encoding]::GetEncoding(1252)
$text = $enc.GetString([System.IO.File]::ReadAllBytes($path))

function Replace-OnceLiteral([string]$hay, [string]$needle, [string]$replacement) {
  if ($hay.Contains($needle)) { return $hay.Replace($needle, $replacement) }
  return $hay
}

function Replace-OnceRegex([string]$hay, [string]$pattern, [string]$replacement) {
  return [regex]::Replace($hay, $pattern, $replacement, 1)
}

# 1) Insert Supabase scripts before the main inline <script>
$needle = "  <!-- Toast -->`r`n  <div class=""toast"" id=""toast""></div>`r`n`r`n  <script>"
$insert = @"
  <!-- Toast -->
  <div class="toast" id="toast"></div>

  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js"></script>
  <script src="js/supabase-config.js"></script>
  <script src="js/supabase-projects.js"></script>

  <script>
"@
$text = Replace-OnceLiteral $text $needle $insert

# 2) Add DB connect button in header actions (replace block once)
$text = Replace-OnceRegex $text '(?s)<div class="cms-header-actions">\s*<a href="index\.html" class="header-btn" target="_blank">.*?</a>\s*<button class="header-btn" id="logoutBtn">Sign Out</button>\s*</div>' @'
<div class="cms-header-actions">
         <a href="index.html" class="header-btn" target="_blank">ðŸŒ View Site</a>
         <button class="header-btn" id="dbConnectBtn" title="Connect Supabase (required for saving projects on Vercel)">DB: Not Connected</button>
         <button class="header-btn" id="logoutBtn">Sign Out</button>
       </div>
'@

# 3) Add dbConnectBtn element ref (after logoutBtn)
$text = Replace-OnceLiteral $text "    const logoutBtn = document.getElementById('logoutBtn');`r`n" "    const logoutBtn = document.getElementById('logoutBtn');`r`n    const dbConnectBtn = document.getElementById('dbConnectBtn');`r`n"

# 4) Inject Supabase CMS helpers after toast element ref (only once)
if (-not $text.Contains("SUPABASE CMS (optional)")) {
  $anchor = "    const toast = document.getElementById('toast');`r`n`r`n"
  $helpers = @'
    // ===== SUPABASE CMS (optional) =====
    function sbEnabled() {
      return window.supabaseEnabled ? window.supabaseEnabled() : false;
    }

    function sbClient() {
      return window.getSupabaseClient ? window.getSupabaseClient() : null;
    }

    function setDbState(connected) {
      if (!dbConnectBtn) return;
      if (!sbEnabled()) {
        dbConnectBtn.textContent = 'DB: Disabled';
        return;
      }
      dbConnectBtn.textContent = connected ? 'DB: Connected' : 'DB: Not Connected';
    }

    async function ensureDbSession() {
      if (!sbEnabled()) {
        showToast('Supabase is not configured. Fill js/supabase-config.js first.', 'error');
        setDbState(false);
        return false;
      }
      const sb = sbClient();
      if (!sb) {
        showToast('Supabase library not loaded. Refresh the page.', 'error');
        setDbState(false);
        return false;
      }

      try {
        const { data } = await sb.auth.getSession();
        if (data && data.session) {
          setDbState(true);
          return true;
        }
      } catch (_) {}

      // Prompt-based auth for CMS (safer than anonymous writes).
      const email = prompt('Supabase CMS login email:');
      if (!email) return false;
      const password = prompt('Supabase CMS password:');
      if (!password) return false;

      const { error } = await sb.auth.signInWithPassword({ email, password });
      if (error) {
        showToast('DB login failed: ' + error.message, 'error');
        setDbState(false);
        return false;
      }

      setDbState(true);
      return true;
    }

    function projectToRow(p) {
      return {
        id: p.id,
        title: p.title,
        description: p.description || '',
        skills: Array.isArray(p.skills) ? p.skills : [],
        image: p.image || 'images/image.png',
        link: p.link || '#',
        featured: !!p.featured,
        is_verified: !!p.isVerified,
        rating: p.rating ?? null,
        review_count: p.reviewCount ?? null,
        reviews: p.reviews ?? null,
        updated_at: new Date().toISOString()
      };
    }

'@
  if ($text.Contains($anchor)) {
    $text = $text.Replace($anchor, $anchor + $helpers)
  }
}

# 5) Hook DB connect button (only once, before logout handler)
if (-not $text.Contains("dbConnectBtn.addEventListener")) {
  $hookAnchor = "    logoutBtn.addEventListener('click', () => {`r`n"
  $hook = @'
    if (dbConnectBtn) {
      setDbState(false);
      dbConnectBtn.addEventListener('click', async () => {
        await ensureDbSession();
      });
    }

'@
  $text = Replace-OnceLiteral $text $hookAnchor ($hook + $hookAnchor)
}

# 6) Replace loadProjects() to use Supabase loader (fallback to projects.json)
$text = Replace-OnceRegex $text '(?s)function loadProjects\(\)\s*\{\s*fetch\(''projects\.json''\).*?\n\s*\}\s*' @'
async function loadProjects() {
      try {
        const list = window.getProjectsData ? await window.getProjectsData() : (await (await fetch('projects.json')).json()).projects || [];
        projectsData = { projects: list };
      } catch (e) {
        projectsData = { projects: [] };
      }
      renderProjects();
    }

'@

# 7) Make toggleFeatured async + await save
$text = Replace-OnceRegex $text 'function toggleFeatured\(id\)' 'async function toggleFeatured(id)'
$text = Replace-OnceLiteral $text "      saveProjects(`${project.title} ${project.featured ? 'added to' : 'removed from'} featured`);" "      await saveProjects(`${project.title} ${project.featured ? 'added to' : 'removed from'} featured`);"

# 8) Replace the image upload block inside modalSave: Supabase Storage only (no PHP)
$text = Replace-OnceRegex $text '(?s)// Upload image if a new file was selected\s*\n\s*let imagePath = pendingImagePath.*?\n\s*\}\s*\n\s*\n' @'
      // Upload image if a new file was selected
      let imagePath = pendingImagePath || 'images/image.png';
      const file = imageFileInput.files[0];
      if (file) {
        if (!sbEnabled() || !sbClient()) {
          showToast('Supabase is not configured. Check js/supabase-config.js', 'error');
          return;
        }

        const ok = await ensureDbSession();
        if (!ok) {
          showToast('DB not connected. Click "DB: Sign in" first.', 'error');
          return;
        }

        try {
          const sb = sbClient();
          const ext = (file.name.split('.').pop() || 'png').toLowerCase();
          const rand = Math.random().toString(16).slice(2);
          const objectPath = `projects/project-${Date.now()}-${rand}.${ext}`;

          const up = await sb.storage.from('portfolio-images').upload(objectPath, file, {
            upsert: true,
            contentType: file.type || 'image/png'
          });
          if (up.error) {
            console.error('[supabase][storage] upload failed:', up.error);
            showToast('Image upload failed: ' + (up.error.message || 'Upload failed') + ' (check bucket exists + Storage policies/RLS)', 'error');
            return;
          }

          const pub = sb.storage.from('portfolio-images').getPublicUrl(objectPath);
          imagePath = (pub.data && pub.data.publicUrl) ? pub.data.publicUrl : imagePath;
        } catch (e) {
          showToast('Image upload failed: ' + (e && e.message ? e.message : 'Unknown error'), 'error');
          return;
        }
      }

'@

# 9) Make confirmDelete handler async + delete from Supabase when enabled
$text = Replace-OnceLiteral $text "confirmDelete.addEventListener('click', () => {" "confirmDelete.addEventListener('click', async () => {"
$text = Replace-OnceRegex $text '(?s)confirmDelete\.addEventListener\(''click'', async \(\) => \{\s*if \(deletingProjectId !== null\) \{\s*projectsData\.projects = projectsData\.projects\.filter\(p => p\.id !== deletingProjectId\);\s*confirmOverlay\.classList\.remove\(''open''\);\s*saveProjects\(''Project deleted''\);\s*deletingProjectId = null;\s*\}\s*\}\);' @'
    confirmDelete.addEventListener('click', async () => {
      if (deletingProjectId !== null) {
        const deletedId = deletingProjectId;
        confirmOverlay.classList.remove('open');
        deletingProjectId = null;

        if (!sbEnabled() || !sbClient()) {
          showToast('Supabase is not configured. Check js/supabase-config.js', 'error');
          renderProjects();
          return;
        }

        const ok = await ensureDbSession();
        if (!ok) {
          showToast('DB not connected. Click "DB: Sign in" first.', 'error');
          renderProjects();
          return;
        }

        const sb = sbClient();
        const { error } = await sb.from('projects').delete().eq('id', deletedId);
        if (error) {
          showToast('Delete failed: ' + error.message, 'error');
          renderProjects();
          return;
        }

        projectsData.projects = projectsData.projects.filter(p => p.id !== deletedId);
        showToast('Project deleted', 'success');
        renderProjects();
      }
    });
'@

# 10) Replace saveProjects() to write to Supabase only
$text = Replace-OnceRegex $text '(?s)// ===== SAVE =====\s*\n\s*function saveProjects\(successMsg\) \{.*?\n\s*\}\s*\n\s*\n\s*// ===== TOAST =====' @'
    // ===== SAVE =====
    async function saveProjects(successMsg) {
      if (!sbEnabled() || !sbClient()) {
        showToast('Supabase is not configured. Check js/supabase-config.js', 'error');
        return;
      }

      const ok = await ensureDbSession();
      if (!ok) {
        showToast('DB not connected. Click "DB: Sign in" first.', 'error');
        return;
      }

      const sb = sbClient();
      const rows = (projectsData.projects || []).map(projectToRow);
      const { error } = await sb.from('projects').upsert(rows, { onConflict: 'id' });

      if (error) {
        showToast('Save failed: ' + error.message, 'error');
        return;
      }

      showToast(successMsg || 'Saved!', 'success');
      renderProjects();
    }

    // ===== TOAST =====
'@

# 11) On successful login, set initial DB state based on existing session
$text = Replace-OnceLiteral $text "         cmsApp.classList.add('visible');`r`n         loadProjects();`r`n         loadStatus();" @"
         cmsApp.classList.add('visible');
         if (sbEnabled()) {
           try {
             const sb = sbClient();
             if (sb) sb.auth.getSession().then(({ data }) => setDbState(!!(data && data.session)));
           } catch (e) { setDbState(false); }
         }
         loadProjects();
         loadStatus();
"@

[System.IO.File]::WriteAllBytes($path, $enc.GetBytes($text))
Write-Host "Patched CMS for Supabase: $CmsFile"
