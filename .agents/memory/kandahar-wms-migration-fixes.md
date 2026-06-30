---
name: Kandahar WMS Migration Fixes
description: Key fixes applied during migration from Replit Agent to Replit environment
---

# Kandahar WMS Migration Fixes

## React Duplicate Instance Fix
**Problem:** `react-helmet-async` caused duplicate React instances in Vite's pre-bundler (two separate CJS React chunks), breaking all hooks.
**Fix:** Replaced `react-helmet-async` with a native `useEffect`-based implementation in `src/components/common/PageMeta.tsx`. No more HelmetProvider needed.
**Why:** react-helmet-async CJS bundle creates a separate React module instance in Vite's pre-bundle optimization, causing `ReactCurrentDispatcher.current` to be null.

## "use client" Directive
**Problem:** `"use client"` directive at top of `src/context/ThemeContext.tsx` caused React hooks to be called outside component context.
**Fix:** Removed the `"use client"` directive — it's a Next.js RSC directive and has no place in a Vite app.

## Afghan Currency Symbol (U+060B) in JSX
**Problem:** esbuild "Unterminated regular expression" error on `؋` placed directly in JSX text nodes (not inside template literals).
**Fix:** Replaced bare JSX `؋ {value}` with `{"\u060B"} {value}` in 3 files:
  - `src/pages/Requests/RequestDetails.tsx`
  - `src/pages/Procurement/VendorOffersPage.tsx`
  - `src/pages/Requests/CreateRequest.tsx`

## React Version
Downgraded from React 19 to React 18.3.1 for compatibility with `react-apexcharts`, `react-dnd`, and `react-helmet-async` (now removed).

## App Architecture
- Frontend: Vite/React on port 5000
- Backend: Express/MySQL on port 3001 (start.sh handles MySQL init + schema migration)
- Demo mode: Works without Firebase config — uses localStorage with seed users
- Default demo login: superadmin@ku.edu.af / Admin@123
