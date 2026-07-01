---
name: Official form duplicate editor script → multi-page render
description: Some form templates in public/forms/official-forms.html shipped with two byte-identical full editor <script> blocks, which duplicate the whole form's pages at runtime.
---

## Symptom
A form template renders its pages twice (e.g. SI-9 / formTemplate5 showed 4 pages when it is legitimately 2: fs9-page-one = header+items table, fs9-page-two = signatures + copy-distribution notes + ملاحظات). The source `#documentArea` contains only the correct number of `<section class="page">`, so the extra pages are RUNTIME-generated.

## Root cause (the REAL one — found only after TWO wrong fixes)
There are THREE independent scripts that can push HTML into the visible inner `#formViewer` doc, and they run in this order:
1. `loadForm()` sets `viewer.srcdoc = injectRuntime(template.innerHTML)` — clean 2-page template.
2. The inner editor's `loadContent()` restores ONLY its own editor `storageKey` (e.g. `si9_..._v3`).
3. **THE ACTUAL CULPRIT:** a separate parent script — the "ku-final-functional-controls" `patchFrame` — has `function loadSaved()` that runs on viewer `'load'` with delays `[40,180,500,1100]` (so AFTER 1 and 2) and does `a.innerHTML = storage.getItem('ku-final-saved-html-' + formId)`. That key IS the parent **finalKey** (`ku-final-saved-html-formTemplate5`). So a stale 4-page finalKey snapshot gets injected LAST, overwriting any earlier dedup.

Do NOT assume the display restore comes from the editor's `loadContent` or the injected runtime — grep ALL scripts for `getItem(storageKey)` / `.innerHTML = saved` on the inner doc's area. Also: the React iframe `src="/forms/official-forms.html"` is **browser-cached**, so source edits never reach the user until the URL changes (cache-bust). The two byte-identical editor `<script>` blocks were a real copy-paste defect (worth removing) but were NOT the cause of the duplication.

The label "Tender Form - Same editor system as Proposal" is shared across many templates, so counting that comment is NOT a reliable per-form check — count the form's UNIQUE storageKey instead (e.g. `si9_form_save_font_dropdown_fixed_*`).

## Fix pattern (what ACTUALLY worked)
1. **Dedup in patchFrame `loadSaved()`** (THE decisive one) — right after `a.innerHTML = saved;`, if `a.querySelectorAll('.fs9-page').length > 2`, remove duplicate pages keeping first `fs9-page-one` + first `fs9-page-two`, then `storage.setItem(storageKey, a.innerHTML)` to re-persist the cleaned finalKey so it self-heals permanently. This is the LAST writer to the visible doc, so dedup MUST be here.
2. **Dedup in the editor** (defense in depth) — same logic right after `loadContent();`.
3. **Dedup in parent `sanitizeAreaHtml`** (feeds sync/holder path) — so synced snapshots don't re-propagate to other forms.
4. **Cache-bust the iframe** — `src="/forms/official-forms.html?v=..."` in `OfficialFormViewer.tsx`; bump the token on EVERY official-forms.html change or the browser serves the stale cached file and none of the edits reach the user.
5. (cleanup) delete any redundant duplicate editor `<script>` block; bump the editor `storageKey`.

**Why:** whichever script writes the inner doc LAST wins. The delayed `patchFrame.loadSaved()` was overwriting fixes placed only in the editor. So dedup must live at the final restore point AND the file must be re-fetched (cache-bust). Editing markup / bumping the editor storageKey alone is never enough.

**How to apply:** if the user reports an official form "appearing twice"/"repeated pages" even after edits, assume a STALE localStorage snapshot + a CACHED file — add runtime dedup + cache-bust rather than only editing markup.

## File note
`public/forms/official-forms.html` is ~71k lines; the `read` tool mis-reports its length and fails past ~36k. Use sed/grep for accurate line numbers. Other templates' `<main id="documentArea">` live near lines 4995, 17128, 24916, 32913, 42362, 55144, 65760 — check each for the same double-script issue if similar reports arise.
