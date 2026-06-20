import React, { createContext, useContext, useState } from "react";
import jalaali from "jalaali-js";

export type CalendarType = "shamsi" | "qamari" | "miladi";

export const SHAMSI_MONTHS_PS = ["وری","غویی","غبرګولی","چنګاښ","زمری","وږی","تله","لړم","لیندۍ","مرغومی","سلواغه","کب"];
export const SHAMSI_MONTHS_DR = ["حمل","ثور","جوزا","سرطان","اسد","سنبله","میزان","عقرب","قوس","جدی","دلو","حوت"];
export const QAMARI_MONTHS    = ["محرم","صفر","ربیع‌الاول","ربیع‌الثاني","جمادی‌الاول","جمادی‌الثاني","رجب","شعبان","رمضان","شوال","ذالقعده","ذالحجه"];
export const MILADI_MONTHS_PS = ["جنوري","فبروري","مارچ","اپریل","مې","جون","جولای","اګست","سپتمبر","اکتوبر","نومبر","دیسمبر"];
export const MILADI_MONTHS_DR = ["جنوری","فبروری","مارس","اپریل","می","جون","جولای","آگست","سپتامبر","اکتوبر","نوامبر","دسامبر"];

function _parseIntlNum(s: string): number {
  return parseInt(
    s
      .replace(/[\u0660-\u0669]/g, (c) => String(c.charCodeAt(0) - 0x0660))
      .replace(/[\u06F0-\u06F9]/g, (c) => String(c.charCodeAt(0) - 0x06F0))
      .replace(/[^\d]/g, ""),
    10
  );
}

function _gregorianToJalaali(gy: number, gm: number, gd: number): [number, number, number] {
  const r = jalaali.toJalaali(gy, gm, gd);
  return [r.jy, r.jm, r.jd];
}

// Islamic (Qamari/Hijri) algorithmic conversion
function _gregorianToHijri(gy: number, gm: number, gd: number): [number, number, number] {
  const jdn =
    Math.floor((1461 * (gy + 4800 + Math.floor((gm - 14) / 12))) / 4) +
    Math.floor((367 * (gm - 2 - 12 * Math.floor((gm - 14) / 12))) / 12) -
    Math.floor((3 * Math.floor((gy + 4900 + Math.floor((gm - 14) / 12)) / 100)) / 4) +
    gd - 32075;

  const l = jdn - 1948440 + 10632;
  const n = Math.floor((l - 1) / 10631);
  const l2 = l - 10631 * n + 354;
  const j =
    Math.floor((10985 - l2) / 5316) * Math.floor((50 * l2) / 17719) +
    Math.floor(l2 / 5670) * Math.floor((43 * l2) / 15238);
  const l3 =
    l2 -
    Math.floor((30 - j) / 15) * Math.floor((17719 * j) / 50) -
    Math.floor(j / 16) * Math.floor((15238 * j) / 43) + 29;
  const hy = 30 * n + j - 30;
  const hm = Math.floor((24 * l3) / 709);
  const hd = l3 - Math.floor((709 * hm) / 24);
  return [hy, hm, hd];
}

function _getShamsiYear(d: Date): number {
  const [jy] = _gregorianToJalaali(d.getFullYear(), d.getMonth() + 1, d.getDate());
  return jy;
}

function _getShamsiMonthIndex(d: Date): number {
  const [, jm] = _gregorianToJalaali(d.getFullYear(), d.getMonth() + 1, d.getDate());
  return jm - 1;
}

function _getQamariYear(d: Date): number {
  try {
    const s = new Intl.DateTimeFormat("ar-SA-u-ca-islamic-uma", { year: "numeric" }).format(d);
    const n = _parseIntlNum(s);
    if (n > 1000 && n < 1600) return n;
  } catch {}
  const [hy] = _gregorianToHijri(d.getFullYear(), d.getMonth() + 1, d.getDate());
  return hy;
}

function _getQamariMonthIndex(d: Date): number {
  try {
    const s = new Intl.DateTimeFormat("ar-SA-u-ca-islamic-uma", { month: "numeric" }).format(d);
    const n = _parseIntlNum(s);
    if (n >= 1 && n <= 12) return n - 1;
  } catch {}
  const [, hm] = _gregorianToHijri(d.getFullYear(), d.getMonth() + 1, d.getDate());
  return hm - 1;
}

function _formatShamsi(d: Date): string {
  const [jy, jm, jd] = _gregorianToJalaali(d.getFullYear(), d.getMonth() + 1, d.getDate());
  const monthName = SHAMSI_MONTHS_DR[Math.max(0, Math.min(11, jm - 1))];
  return `${jy} د ${monthName} ${jd}`;
}

function _formatQamari(d: Date): string {
  const year = _getQamariYear(d);
  const monthIdx = _getQamariMonthIndex(d);
  const monthName = QAMARI_MONTHS[Math.max(0, Math.min(11, monthIdx))];
  const [, , hd] = _gregorianToHijri(d.getFullYear(), d.getMonth() + 1, d.getDate());
  const day = hd >= 1 && hd <= 30 ? hd : d.getDate();
  return `${year} د ${monthName} ${day}`;
}

function _formatGregorian(d: Date): string {
  const monthName = MILADI_MONTHS_DR[d.getMonth()];
  return `${d.getFullYear()} د ${monthName} ${d.getDate()}`;
}

interface CalendarContextType {
  calendarType: CalendarType;
  setCalendarType: (t: CalendarType) => void;
  pickDate: (shamsi: string, qamari: string, gregorian?: string) => string;
  pickDateTs: (shamsi: string, qamari: string, ts?: number) => string;
  getMonthNames: (lang: "ps" | "dr") => string[];
  getCurrentYear: () => number;
  getYearFromDate: (d: Date) => number;
  getMonthIndexFromDate: (d: Date) => number;
  getCurrentDateString: () => string;
}

const CalendarContext = createContext<CalendarContextType | undefined>(undefined);

export const CalendarProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [calendarType, setCalendarTypeState] = useState<CalendarType>(() => {
    return (localStorage.getItem("kandahar_wms_calendar") as CalendarType) || "shamsi";
  });

  const setCalendarType = (t: CalendarType) => {
    localStorage.setItem("kandahar_wms_calendar", t);
    setCalendarTypeState(t);
  };

  const pickDate = (shamsi: string, qamari: string, gregorian?: string): string => {
    if (calendarType === "shamsi") return shamsi || "-";
    if (calendarType === "qamari") return qamari || "-";
    return gregorian || shamsi || "-";
  };

  const pickDateTs = (shamsi: string, qamari: string, ts?: number): string => {
    if (calendarType === "shamsi") return shamsi || "-";
    if (calendarType === "qamari") return qamari || "-";
    if (ts) return _formatGregorian(new Date(ts));
    return shamsi || "-";
  };

  const getMonthNames = (lang: "ps" | "dr"): string[] => {
    if (calendarType === "shamsi") return lang === "dr" ? SHAMSI_MONTHS_DR : SHAMSI_MONTHS_PS;
    if (calendarType === "qamari") return QAMARI_MONTHS;
    return lang === "dr" ? MILADI_MONTHS_DR : MILADI_MONTHS_PS;
  };

  const getCurrentYear = (): number => {
    const now = new Date();
    if (calendarType === "shamsi") return _getShamsiYear(now);
    if (calendarType === "qamari") return _getQamariYear(now);
    return now.getFullYear();
  };

  const getYearFromDate = (d: Date): number => {
    if (calendarType === "shamsi") return _getShamsiYear(d);
    if (calendarType === "qamari") return _getQamariYear(d);
    return d.getFullYear();
  };

  const getMonthIndexFromDate = (d: Date): number => {
    if (calendarType === "shamsi") return _getShamsiMonthIndex(d);
    if (calendarType === "qamari") return _getQamariMonthIndex(d);
    return d.getMonth();
  };

  const getCurrentDateString = (): string => {
    const now = new Date();
    if (calendarType === "shamsi") return _formatShamsi(now);
    if (calendarType === "qamari") return _formatQamari(now);
    return _formatGregorian(now);
  };

  return (
    <CalendarContext.Provider value={{
      calendarType, setCalendarType,
      pickDate, pickDateTs,
      getMonthNames, getCurrentYear,
      getYearFromDate, getMonthIndexFromDate,
      getCurrentDateString,
    }}>
      {children}
    </CalendarContext.Provider>
  );
};

export const useCalendar = () => {
  const ctx = useContext(CalendarContext);
  if (!ctx) throw new Error("useCalendar must be used within CalendarProvider");
  return ctx;
};
