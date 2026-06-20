---
name: Jalaali date conversion
description: How Shamsi (Solar Hijri / Jalaali) dates are converted in CalendarContext
---

Use the `jalaali-js` npm package for Gregorian→Jalaali conversion (`jalaali.toJalaali(gy, gm, gd)`).

**Why:** Custom algorithmic implementations (copying formulas from tutorials) give wildly wrong years (e.g. 3005 instead of 1405). The jalaali-js library is the standard, well-tested solution.

**How to apply:** In `src/context/CalendarContext.tsx`, `import jalaali from "jalaali-js"` and call `jalaali.toJalaali(year, month, day)` which returns `{ jy, jm, jd }`.

Qamari (Islamic) dates still use the algorithmic conversion (_gregorianToHijri) as a fallback when Intl.DateTimeFormat arabic-islamic fails.
