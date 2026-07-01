---
name: Proposal form dynamic faculty header
description: How the formTemplate0 proposal header/signature faculty became dynamic, plus a read-tool gotcha for official-forms.html
---

# Dynamic faculty header/signature on the Proposal form

The proposal form (formTemplate0) header faculty line and the signature
"<faculty> رئیس" line used to be hardcoded to "د ژورنالیزم او عامه اړیکو پوهنځی",
so every faculty's form showed Journalism.

**How it was made dynamic:**
- The iframe form injects shared fields via `applySharedFields(root, sharedFields)`
  which sets an element's textContent by matching `#<key>`. It runs from BOTH
  `injectDataIntoViewer` (live iframe) and `processInjectForTemplate` (persisted html).
- Gave the header faculty div `id="v7HeaderFaculty"` and the signature faculty div
  `id="v7SignatureFaculty"`. These ids must exist in THREE places: the static
  proposal template AND both `V7_BASELINE` string copies (the baseline rebuilds the
  header from scratch with empty placeholder divs, so the static-only id is not enough).
- `extractSharedRequestData` (src/utils/officialFormDataAdapter.ts) emits
  `v7HeaderFaculty` = trimmed `request.faculty` and `v7SignatureFaculty` =
  `<faculty> رئیس`, via a conditional spread guarded on the trimmed faculty being
  non-empty.

**Why the conditional guard matters:** `applySharedFields` sets text unconditionally
for every key present, so emitting an empty/whitespace value would BLANK the static
default header. Only include the keys when a real faculty name exists.

**How to apply:** any new per-request header/signature field on these forms follows
the same pattern — add a stable `id` in the static template + both V7_BASELINE copies,
then emit the value (guarded against empty) from `extractSharedRequestData`.

## Table row / dataStart coupling
The item-injection engine (`applyItemsToRoot`) reads each form's `configs[templateId]`
with a `dataStart` = the 0-based table row index where data rows begin. If you
ADD or REMOVE a non-data row above the data rows (e.g. a header/number reference
row), you MUST update that form's `dataStart` in lockstep, or injected data lands
in the wrong row (skips the first, or overwrites a header). Example: SI-9
(formTemplate5) originally had header(0)+number-row(1)+items(2) with `dataStart:2`;
after removing the ۵–۱۰ `fs9-number-row` it became header(0)+items(1) → `dataStart:1`.

## Stale saved snapshot survives template edits (per-form storageKey)
Editing a form's static `<template>` markup does NOT fix what an existing user sees:
the iframe srcdoc = fresh `template.innerHTML`, but each form's embedded editor runtime
then RESTORES the last saved HTML from its OWN localStorage key (e.g. SI-9 uses
`si9_form_save_font_dropdown_fixed_vN`, defined twice in the template). That stale
snapshot can still contain markup you deleted from the template. To force the fresh
template to win, BUMP that per-form storageKey version (v1→v2) in ALL its copies.
Separately, the parent adapter's `loadAreaHtml` (finalKey `ku-final-saved-html-<tid>` /
runtimeKey `..._snapshot_v3`) also serves persisted HTML for forward-sync/persistence;
sanitize there too if a removed element must never resurface (see `sanitizeAreaHtml`,
which strips `.fs9-number-row` for formTemplate5).
**Why:** removing the SI-9 number-row from the template left ۶/۱۰ visible because the
old snapshot was restored and re-injected onto the leftover row (unmapped cells kept
their values). **How to apply:** whenever you delete/restructure rows in a form
template, bump its editor storageKey AND consider a loadAreaHtml sanitizer.

## Gotchas
- The `read` tool mis-reports `public/forms/official-forms.html` as ~36,137 lines; it
  is actually ~71,082 lines (`wc -l`). Use `sed -n` / `grep -n` for accurate line
  numbers and ranges in this file; the `read` tool truncates/abandons past ~36k.
- The proposal logo system still uses GLOBAL localStorage keys
  (`proposal_editable_form_final_7_fixes_right_logo` / `_left_logo`, defined in TWO
  duplicate script blocks ~5107 and ~9364) — shared across ALL faculties, not
  per-faculty. Making them per-faculty needs the faculty read from `#v7HeaderFaculty`
  at load/upload time + a reload after injection (async timing) — not yet done.
