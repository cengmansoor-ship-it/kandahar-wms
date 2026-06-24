---
name: Proposal form stale data bug
description: Why official proposal form (formTemplate0) always showed old 12-item data instead of current request's items, and how it was fixed.
---

## Root Cause (multi-layer)

1. **V7_BASELINE hardcoded**: `official-forms.html` had 12 hardcoded item rows baked into the `V7_BASELINE` JS constant at two locations (~line 8575, 12833). This fallback baseline was used whenever no saved content was found for the proposal form.

2. **No active form tab during inject**: `INJECT_ALL_FORMS` arrived when no nav button was `.active` → `processInjectForTemplate` set `noNavigate=true` for ALL templates → function saved data to localStorage but returned before calling `injectDataIntoViewer` → the visible form was never updated.

3. **Stale global localStorage keys**: `initProposalHardSave` ran at 80ms after DOMContentLoaded (before React's `setupIframe` at 350ms+) reading `proposal_v7_balanced_hard_save` etc. — these global keys held old content from prior sessions and overwrote the blank template.

## Fix Applied

- **OfficialFormViewer.tsx `useLayoutEffect`**: Clears ~14 global proposal localStorage keys whenever `requestId` changes (runs before browser paints, before iframe DOMContentLoaded).
- **OfficialFormViewer.tsx `setupIframe`**: Sends `SHOW_FORM` immediately after `SET_REQUEST_SCOPE` (before `INJECT_ALL_FORMS`) so the correct form tab is active when the inject arrives → `isActive=true` → `injectDataIntoViewer` is called with correct delays.
- **official-forms.html `SET_REQUEST_SCOPE` handler**: Clears the same ~14 stale proposal keys from `localStorage` before calling `restoreDataForRequest`.
- **official-forms.html V7_BASELINE**: Both instances replaced with a single empty row (no hardcoded item data).

**Why:** The inject mechanism (`applyItemsToRoot`) works correctly for formTemplate0 — the issue was purely about the form tab not being active and stale cached content winning the race.

**How to apply:** If proposal form ever shows wrong/stale data again, check: (1) is SHOW_FORM sent before INJECT_ALL_FORMS? (2) are stale keys being cleared? (3) is V7_BASELINE still blank?
