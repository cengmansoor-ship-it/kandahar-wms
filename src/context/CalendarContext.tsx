import React, { createContext, useContext, useState } from "react";

export type CalendarType = "shamsi" | "qamari" | "miladi";

export const SHAMSI_MONTHS_PS = ["وری","غویی","غبرګولی","چنګاښ","زمری","وږی","تله","لړم","لیندۍ","مرغومی","سلواغه","کب"];
export const SHAMSI_MONTHS_DR = ["حمل","ثور","جوزا","سرطان","اسد","سنبله","میزان","عقرب","قوس","جدی","دلو","حوت"];
export const QAMARI_MONTHS    = ["محرم","صفر","ربیع‌الاول","ربیع‌الثاني","جمادی‌الاول","جمادی‌الثاني","رجب","شعبان","رمضان","شوال","ذالقعده","ذالحجه"];
export const MILADI_MONTHS_PS = ["جنوري","فبروري","مارچ","اپریل","مې","جون","جولای","اګست","سپتمبر","اکتوبر","نومبر","دیسمبر"];
export const MILADI_MONTHS_DR = ["جنوری","فبروری","مارس","اپریل","می","جون","جولای","آگست","سپتامبر","اکتوبر","نوامبر","دسامبر"];

function _getShamsiYear(d: Date): number {
  try {
    const s = new Intl.DateTimeFormat("ps-AF-u-ca-persian", { year: "numeric" }).format(d);
    return parseInt(s.replace(/[^\d]/g, ""), 10) || d.getFullYear();
  } catch { return d.getFullYear(); }
}

function _getQamariYear(d: Date): number {
  try {
    const s = new Intl.DateTimeFormat("ar-SA-u-ca-islamic-uma", { year: "numeric" }).format(d);
    return parseInt(s.replace(/[^\d]/g, ""), 10) || d.getFullYear();
  } catch { return d.getFullYear(); }
}

function _getShamsiMonthIndex(d: Date): number {
  try {
    const s = new Intl.DateTimeFormat("ps-AF-u-ca-persian", { month: "numeric" }).format(d);
    return Math.max(0, parseInt(s.replace(/[^\d]/g, ""), 10) - 1);
  } catch { return d.getMonth(); }
}

function _getQamariMonthIndex(d: Date): number {
  try {
    const s = new Intl.DateTimeFormat("ar-SA-u-ca-islamic-uma", { month: "numeric" }).format(d);
    return Math.max(0, parseInt(s.replace(/[^\d]/g, ""), 10) - 1);
  } catch { return d.getMonth(); }
}

function _formatGregorian(d: Date): string {
  try {
    return d.toLocaleDateString("fa-AF", { year: "numeric", month: "long", day: "numeric" });
  } catch { return d.toLocaleDateString(); }
}

function _formatShamsi(d: Date): string {
  try {
    return new Intl.DateTimeFormat("ps-AF-u-ca-persian", { year: "numeric", month: "long", day: "numeric" }).format(d);
  } catch { return d.toLocaleDateString(); }
}

function _formatQamari(d: Date): string {
  try {
    return new Intl.DateTimeFormat("ps-AF-u-ca-islamic-uma", { year: "numeric", month: "long", day: "numeric" }).format(d);
  } catch { return d.toLocaleDateString(); }
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
