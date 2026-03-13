# Local Development (Important)

## Why uploads fail on VS Code Live Server

VS Code **Live Server** serves static files only. It **does not execute PHP**.

So endpoints like:

- `upload-image.php` (removed)
- `update-status.php` (removed)

will fail (usually returning HTML/404 instead of JSON), and the CMS shows:
`Image upload failed... Make sure PHP is running.`

Projects saving is handled by **Supabase** (no PHP).

## Run the site (static server)

Use any static server (VS Code Live Server is fine) for previewing pages.

Notes:
- CMS uploads/status updates require Supabase (sign in in the CMS).
