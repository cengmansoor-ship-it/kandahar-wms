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

## Gotchas
- The `read` tool mis-reports `public/forms/official-forms.html` as ~36,137 lines; it
  is actually ~71,082 lines (`wc -l`). Use `sed -n` / `grep -n` for accurate line
  numbers and ranges in this file; the `read` tool truncates/abandons past ~36k.
- The proposal logo system still uses GLOBAL localStorage keys
  (`proposal_editable_form_final_7_fixes_right_logo` / `_left_logo`, defined in TWO
  duplicate script blocks ~5107 and ~9364) — shared across ALL faculties, not
  per-faculty. Making them per-faculty needs the faculty read from `#v7HeaderFaculty`
  at load/upload time + a reload after injection (async timing) — not yet done.
