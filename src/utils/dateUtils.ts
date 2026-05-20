/**
 * Utility for Hijri Shamsi and Qamari dates using Intl.DateTimeFormat
 */

export const getHijriShamsiDate = (date: Date = new Date()): string => {
  try {
    return new Intl.DateTimeFormat('ps-AF-u-ca-persian', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  } catch (error) {
    console.error("Error formatting Shamsi date:", error);
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
  } catch (error) {
    console.error("Error formatting Qamari date:", error);
    return date.toLocaleDateString();
  }
};

export const getCurrentHijriDates = () => {
  const now = new Date();
  return {
    shamsi: getHijriShamsiDate(now),
    qamari: getHijriQamariDate(now),
    timestamp: now.getTime(),
  };
};
