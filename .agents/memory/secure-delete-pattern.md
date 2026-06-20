---
name: SecureDeleteModal pattern
description: Pattern for all destructive delete operations — requires password + reason before confirming.
---

## The rule
All delete operations across the WMS must use `SecureDeleteModal` with `requireReason={true}`. Never use `window.confirm()` or `confirm()`.

**Why:** Security requirement — all deletions must be verified by password and have an audit reason.

**How to apply:**
1. Add `import SecureDeleteModal from "../../components/common/SecureDeleteModal";`
2. Add `import { useAuth } from "../../context/AuthContext";` to get `profile.email`
3. Add state: `const [pendingDelete, setPendingDelete] = useState<T | null>(null);`
4. Replace delete button `onClick` with `() => setPendingDelete(item)`
5. Add modal at end of JSX:
```tsx
{pendingDelete && (
  <SecureDeleteModal
    title="⚠️ ..."
    description="..."
    currentUserEmail={profile?.email || ""}
    requireReason={true}
    onCancel={() => setPendingDelete(null)}
    onConfirm={(_reason) => { /* do delete */ setPendingDelete(null); }}
  />
)}
```

## Pages already using SecureDeleteModal
- TrashList, ChecklistManagement, RoleManagement
- BackupManagement, BudgetCodes, DelegationManagement

## onConfirm signature
`onConfirm: (reason: string) => void` — the reason param contains the typed reason text.
