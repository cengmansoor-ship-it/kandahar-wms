---
name: CurrentDateBadge coverage
description: Which pages have the date badge and the consistent placement pattern
---

`CurrentDateBadge` component lives at `src/components/common/CurrentDateBadge.tsx` and reads `useCalendar().getCurrentDateString()`.

**Placement pattern (pages with Breadcrumb):**
```tsx
<Breadcrumb pageTitle="..." />
<div className="flex justify-end mb-2" dir="rtl"><CurrentDateBadge /></div>
```

**Placement pattern (SuperAdmin monitors — no Breadcrumb):**
```tsx
<PageMeta ... />
<div className="flex justify-end mb-2" dir="rtl"><CurrentDateBadge /></div>
<div className="space-y-6" dir="rtl">
```

**Import paths:**
- Pages in `src/pages/*.tsx` → `../components/common/CurrentDateBadge`
- Pages in `src/pages/*/*.tsx` → `../../components/common/CurrentDateBadge`

**Covered pages (30+):** All major pages including SuperAdmin dashboard/monitors, all Inventory pages, all Reports pages, all Maintenance pages, Notifications, RoleManagement, UserManagement, etc.
