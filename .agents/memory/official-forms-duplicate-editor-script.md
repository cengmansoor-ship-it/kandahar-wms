---
name: Official form duplicate editor script → multi-page render
description: Some form templates in public/forms/official-forms.html shipped with two byte-identical full editor <script> blocks, which duplicate the whole form's pages at runtime.
---

## Symptom
A form template renders its pages twice (e.g. SI-9 / formTemplate5 showed 4 pages when it is legitimately 2: fs9-page-one = header+items table, fs9-page-two = signatures + copy-distribution notes + ملاحظات). The source `#documentArea` contains only the correct number of `<section class="page">`, so the extra pages are RUNTIME-generated.

## Root cause (the REAL one — verified after a first wrong fix)
The visible form = inner `#formViewer` iframe `srcdoc` (= `template.innerHTML`) + `injectDataIntoViewer` (fills fields ONLY, never replaces `documentArea.innerHTML`). The inner editor's `loadContent()` restores ONLY its own `storageKey`; the injected runtime does NOT restore `finalKey`/`runtimeKey` into the display. So duplicated pages come from a **stale multi-page snapshot cached in localStorage under the editor's storageKey**, NOT from the markup. Editing/bumping the source does nothing until the user's browser actually loads the new file — and the React iframe `src="/forms/official-forms.html"` gets **browser-cached**, so a plain refresh keeps serving the old file + old key. The two byte-identical editor `<script>` blocks were a real copy-paste defect (worth removing) but were NOT the cause of the duplication on their own.

The label "Tender Form - Same editor system as Proposal" is shared across many templates, so counting that comment is NOT a reliable per-form check — count the form's UNIQUE storageKey instead (e.g. `si9_form_save_font_dropdown_fixed_*`).

## Fix pattern (what actually worked)
1. **Defensive dedup in the editor** — right after `loadContent();` in the form's editor script, add an IIFE that removes duplicate `.fs9-page` sections (keep first `fs9-page-one` + first `fs9-page-two`). This self-heals the VISIBLE doc no matter what stale snapshot was restored.
2. **Defensive dedup in parent `sanitizeAreaHtml`** (used by `loadAreaHtml`, feeds sync/holder, re-saved via `saveAreaHtml`) — dedupe pages there too so stored/synced snapshots self-heal and don't propagate to other forms.
3. **Cache-bust the iframe** — `src="/forms/official-forms.html?v=..."` in `OfficialFormViewer.tsx`. Without this, the browser keeps serving the old cached file and NONE of the html edits reach the user. Bump the `?v=` token on future official-forms.html changes.
4. (cleanup) delete any redundant duplicate editor `<script>` block, preserving `</body></html></template>`; bump the editor `storageKey` to drop the old snapshot key.

**Why:** html edits are invisible until the browser refetches the file; the display is driven by srcdoc + the editor's own storageKey snapshot, so the only bulletproof fixes are (a) runtime dedup on the live doc and (b) forcing a fresh file fetch. Bumping storageKey / editing markup alone is NOT enough when the file itself is cached.

**How to apply:** if the user reports an official form "appearing twice"/"repeated pages" even after edits, assume a STALE localStorage snapshot + a CACHED file — add runtime dedup + cache-bust rather than only editing markup.

## File note
`public/forms/official-forms.html` is ~71k lines; the `read` tool mis-reports its length and fails past ~36k. Use sed/grep for accurate line numbers. Other templates' `<main id="documentArea">` live near lines 4995, 17128, 24916, 32913, 42362, 55144, 65760 — check each for the same double-script issue if similar reports arise.
