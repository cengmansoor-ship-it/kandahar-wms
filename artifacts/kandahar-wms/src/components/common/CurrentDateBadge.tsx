import { useCalendar } from "../../context/CalendarContext";

interface CurrentDateBadgeProps {
  className?: string;
  label?: string;
}

export default function CurrentDateBadge({ className = "", label }: CurrentDateBadgeProps) {
  const { getCurrentDateString, calendarType } = useCalendar();
  const calLabel =
    calendarType === "shamsi" ? "شمسي" :
    calendarType === "qamari" ? "قمري" : "میلادي";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-lg border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary dark:border-primary/30 dark:bg-primary/10 dark:text-primary/80 ${className}`}
      dir="rtl"
    >
      <span>📅</span>
      <span>{label ? `${label}: ` : ""}{getCurrentDateString()}</span>
      <span className="opacity-60">({calLabel})</span>
    </span>
  );
}
