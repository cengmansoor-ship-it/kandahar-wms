---
name: Official form duplicate editor script → multi-page render
description: Some form templates in public/forms/official-forms.html shipped with two byte-identical full editor <script> blocks, which duplicate the whole form's pages at runtime.
---

## Symptom
A form template renders its pages twice (e.g. SI-9 / formTemplate5 showed 4 pages when it is legitimately 2: fs9-page-one = header+items table, fs9-page-two = signatures + copy-distribution notes + ملاحظات). The source `#documentArea` contains only the correct number of `<section class="page">`, so the extra pages are RUNTIME-generated.

## Root cause
The `<template>` for the form contains TWO byte-identical full editor `<script>` blocks (both labeled `/* Tender Form - Same editor system as Proposal */`), each registering its own `DOMContentLoaded` handler on the same `#documentArea`. Double-init against shared state/storageKey duplicates the rendered pages. The label "Tender Form - Same editor system as Proposal" is shared across many templates, so counting that comment is NOT a reliable per-form check — count the form's UNIQUE storageKey instead (e.g. `si9_form_save_font_dropdown_fixed_*`).

## Fix pattern
1. Delete the redundant SECOND `<script>...</script>` block, preserving the closing `</body></html></template>`. The second block ends with `</script></body>` on one line — when removing it, keep `</body>`. Safe sed: substitute `</script></body>`→`</body>` on that line FIRST, then delete the second `<script>` through the line above it.
2. Bump the remaining editor `storageKey` (e.g. `_v2`→`_v3`) so any cached corrupted (duplicated-page) snapshot in localStorage is discarded and the fresh corrected template loads.
3. User must hard-refresh (static asset; no build/workflow restart needed — Vite serves `public/` fresh).

**Why:** the inner `#formViewer` iframe srcdoc = full template.innerHTML, so both embedded scripts run; and the editor persists `documentArea.innerHTML` to its own storageKey, so a duplicated snapshot survives a script fix unless the key is bumped.

**How to apply:** if the user reports ANY official form "appearing twice"/"repeated pages", grep the template for duplicate editor scripts (two occurrences of that form's unique storageKey) before assuming the page markup itself is duplicated.

## File note
`public/forms/official-forms.html` is ~71k lines; the `read` tool mis-reports its length and fails past ~36k. Use sed/grep for accurate line numbers. Other templates' `<main id="documentArea">` live near lines 4995, 17128, 24916, 32913, 42362, 55144, 65760 — check each for the same double-script issue if similar reports arise.
