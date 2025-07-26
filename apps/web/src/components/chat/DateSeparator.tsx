import { format, isToday, isYesterday, isThisWeek, isThisYear } from "date-fns";

interface DateSeparatorProps {
  date: Date;
}

export function DateSeparator({ date }: DateSeparatorProps) {
  const getDateLabel = (date: Date) => {
    if (!date || isNaN(date.getTime())) {
      return "Unknown Date";
    }

    if (isToday(date)) {
      return "Today";
    } else if (isYesterday(date)) {
      return "Yesterday";
    } else if (isThisWeek(date)) {
      return format(date, "EEEE"); // Monday, Tuesday, etc.
    } else if (isThisYear(date)) {
      return format(date, "MMM d"); // Jan 15, Feb 22, etc.
    } else {
      return format(date, "MMM d, yyyy"); // Jan 15, 2023
    }
  };

  return (
    <div className="flex items-center justify-center my-6">
      <div className="bg-white text-gray-600 text-xs font-medium px-4 py-2 rounded-full shadow-sm border border-gray-200">
        {getDateLabel(date)}
      </div>
    </div>
  );
}
