/**
 * Utility for Hijri Shamsi, Qamari, and Gregorian dates.
 * Falls back to client date if backend is offline.
 */

export const getHijriShamsiDate = (date: Date = new Date()): string => {
  try {
    return new Intl.DateTimeFormat('ps-AF-u-ca-persian', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  } catch {
    return date.toLocaleDateString();
  }
};

export const getHijriQamariDate = (date: Date = new Date()): string => {
  try {
    return new Intl.DateTimeFormat('ps-AF-u-ca-islamic-uma', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  } catch {
    return date.toLocaleDateString();
  }
};

export const getGregorianDate = (date: Date = new Date()): string => {
  return date.toLocaleDateString('fa-AF', { year: 'numeric', month: 'long', day: 'numeric' });
};

export const getCurrentHijriDates = () => {
  const now = new Date();
  return {
    shamsi: getHijriShamsiDate(now),
    qamari: getHijriQamariDate(now),
    gregorian: getGregorianDate(now),
    timestamp: now.getTime(),
  };
};

export interface ServerDateInfo {
  isoDate: string;
  shamsiDate: string;
  qamariDate: string;
  gregorianDate: string;
  serverTime: number;
  isOnline: boolean;
}

let _cachedServerDate: ServerDateInfo | null = null;
let _lastFetch = 0;
const SERVER_DATE_TTL_MS = 60_000;

export async function getServerDate(): Promise<ServerDateInfo> {
  const now = Date.now();
  if (_cachedServerDate && now - _lastFetch < SERVER_DATE_TTL_MS) {
    return _cachedServerDate;
  }
  try {
    const res = await fetch("/api/time/now", { signal: AbortSignal.timeout(3000) });
    if (!res.ok) throw new Error("not ok");
    const json = await res.json();
    if (json.success && json.data) {
      _cachedServerDate = { ...json.data, isOnline: true };
      _lastFetch = now;
      return _cachedServerDate!;
    }
    throw new Error("bad response");
  } catch {
    const d = new Date();
    return {
      isoDate: d.toISOString(),
      shamsiDate: getHijriShamsiDate(d),
      qamariDate: getHijriQamariDate(d),
      gregorianDate: getGregorianDate(d),
      serverTime: d.getTime(),
      isOnline: false,
    };
  }
}

export function getShamsiYear(isoDate?: string): number {
  const d = isoDate ? new Date(isoDate) : new Date();
  try {
    const yearStr = new Intl.DateTimeFormat('ps-AF-u-ca-persian', { year: 'numeric' }).format(d);
    return parseInt(yearStr.replace(/[^\d]/g, ''), 10) || new Date().getFullYear();
  } catch {
    return new Date().getFullYear();
  }
}
