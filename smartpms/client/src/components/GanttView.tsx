import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { format, addDays, differenceInDays, startOfMonth, endOfMonth, eachMonthOfInterval } from "date-fns";
import { ko } from "date-fns/locale";

interface WbsRow {
  id: number;
  wbsCode: string | null;
  name: string;
  level: string;
  planStart: Date | null;
  planEnd: Date | null;
  progress: number;
  status: string;
  parentId: number | null;
}

interface GanttViewProps {
  rows: WbsRow[];
  viewMode: 'gantt' | 'split';
}

const LEVEL_COLORS: Record<string, string> = {
  major: "bg-blue-700",
  middle: "bg-blue-500",
  minor: "bg-blue-400",
  activity: "bg-green-500",
  task: "bg-green-400",
};

const LEVEL_BG: Record<string, string> = {
  major: "bg-blue-50",
  middle: "bg-blue-50/50",
  minor: "bg-gray-50",
  activity: "bg-white",
  task: "bg-white",
};

const LEVEL_INDENT: Record<string, number> = {
  major: 0,
  middle: 12,
  minor: 24,
  activity: 36,
  task: 48,
};

const STATUS_COLORS: Record<string, string> = {
  completed: "bg-green-500",
  in_progress: "bg-blue-500",
  delayed: "bg-red-500",
  on_hold: "bg-yellow-500",
  not_started: "bg-gray-300",
};

export default function GanttView({ rows, viewMode }: GanttViewProps) {
  const { minDate, maxDate, months } = useMemo(() => {
    const dates = rows.flatMap(r => [r.planStart, r.planEnd]).filter(Boolean) as Date[];
    if (dates.length === 0) {
      const now = new Date();
      return {
        minDate: startOfMonth(now),
        maxDate: endOfMonth(addDays(now, 180)),
        months: eachMonthOfInterval({ start: startOfMonth(now), end: endOfMonth(addDays(now, 180)) }),
      };
    }
    const min = startOfMonth(new Date(Math.min(...dates.map(d => d.getTime()))));
    const max = endOfMonth(new Date(Math.max(...dates.map(d => d.getTime()))));
    return {
      minDate: min,
      maxDate: max,
      months: eachMonthOfInterval({ start: min, end: max }),
    };
  }, [rows]);

  const totalDays = differenceInDays(maxDate, minDate) + 1;
  const DAY_WIDTH = 20; // px per day
  const LABEL_WIDTH = 220; // left label column width
  const ROW_HEIGHT = 28;

  const getX = (date: Date) => differenceInDays(date, minDate) * DAY_WIDTH;
  const getWidth = (start: Date, end: Date) => Math.max((differenceInDays(end, start) + 1) * DAY_WIDTH, 4);

  return (
    <div className={cn("overflow-auto bg-white border-t border-border", viewMode === 'split' ? "h-1/2" : "flex-1")}>
      <div style={{ minWidth: LABEL_WIDTH + totalDays * DAY_WIDTH }}>
        {/* Header */}
        <div className="sticky top-0 z-20 bg-gray-100 border-b border-gray-300">
          {/* Month row */}
          <div className="flex" style={{ height: 24 }}>
            <div style={{ width: LABEL_WIDTH, minWidth: LABEL_WIDTH }} className="border-r border-gray-300 flex-shrink-0" />
            <div className="relative flex-1 overflow-hidden">
              {months.map((month, i) => {
                const monthStart = i === 0 ? minDate : month;
                const monthEnd = i === months.length - 1 ? maxDate : endOfMonth(month);
                const x = getX(monthStart);
                const w = getWidth(monthStart, monthEnd);
                return (
                  <div
                    key={i}
                    className="absolute top-0 flex items-center justify-center text-[10px] font-semibold text-gray-600 border-r border-gray-300"
                    style={{ left: x, width: w, height: 24 }}
                  >
                    {format(month, 'yyyy.MM', { locale: ko })}
                  </div>
                );
              })}
            </div>
          </div>
          {/* Day row */}
          <div className="flex" style={{ height: 20 }}>
            <div style={{ width: LABEL_WIDTH, minWidth: LABEL_WIDTH }} className="border-r border-gray-300 flex-shrink-0 px-2 flex items-center">
              <span className="text-[10px] font-semibold text-gray-500">작업명</span>
            </div>
            <div className="relative flex-1 overflow-hidden">
              {Array.from({ length: totalDays }).map((_, i) => {
                const d = addDays(minDate, i);
                const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                const isFirst = d.getDate() === 1;
                return (
                  <div
                    key={i}
                    className={cn(
                      "absolute top-0 flex items-center justify-center text-[8px] border-r border-gray-200",
                      isWeekend ? "bg-gray-50 text-gray-400" : "text-gray-500",
                      isFirst && "border-r border-gray-400"
                    )}
                    style={{ left: i * DAY_WIDTH, width: DAY_WIDTH, height: 20 }}
                  >
                    {d.getDate()}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Rows */}
        {rows.map((row) => {
          const indent = LEVEL_INDENT[row.level] ?? 0;
          const hasBar = row.planStart && row.planEnd;
          const barX = hasBar ? getX(new Date(row.planStart!)) : 0;
          const barW = hasBar ? getWidth(new Date(row.planStart!), new Date(row.planEnd!)) : 0;
          const progressW = hasBar ? Math.round(barW * (row.progress || 0) / 100) : 0;
          const barColor = STATUS_COLORS[row.status] ?? "bg-gray-300";
          const today = new Date();
          const todayX = getX(today);

          return (
            <div
              key={row.id}
              className={cn(
                "flex border-b border-gray-100 hover:bg-blue-50/30 transition-colors",
                LEVEL_BG[row.level]
              )}
              style={{ height: ROW_HEIGHT }}
            >
              {/* Label */}
              <div
                style={{ width: LABEL_WIDTH, minWidth: LABEL_WIDTH, paddingLeft: indent + 8 }}
                className="flex items-center gap-1 border-r border-gray-200 flex-shrink-0 pr-2"
              >
                <span className={cn(
                  "truncate",
                  row.level === 'major' ? "text-[11px] font-bold text-blue-800" :
                  row.level === 'middle' ? "text-[11px] font-semibold text-blue-700" :
                  row.level === 'minor' ? "text-[11px] font-semibold text-gray-700" :
                  row.level === 'activity' ? "text-[10px] font-medium text-gray-600" :
                  "text-[10px] text-gray-600"
                )}>
                  {row.name}
                </span>
              </div>

              {/* Bar area */}
              <div className="relative flex-1 overflow-hidden" style={{ height: ROW_HEIGHT }}>
                {/* Weekend shading */}
                {Array.from({ length: totalDays }).map((_, i) => {
                  const d = addDays(minDate, i);
                  if (d.getDay() !== 0 && d.getDay() !== 6) return null;
                  return (
                    <div
                      key={i}
                      className="absolute top-0 bottom-0 bg-gray-50/80"
                      style={{ left: i * DAY_WIDTH, width: DAY_WIDTH }}
                    />
                  );
                })}

                {/* Today line */}
                {todayX >= 0 && todayX <= totalDays * DAY_WIDTH && (
                  <div
                    className="absolute top-0 bottom-0 w-px bg-red-400 z-10"
                    style={{ left: todayX }}
                  />
                )}

                {/* Gantt bar */}
                {hasBar && (
                  <div
                    className="absolute top-1/2 -translate-y-1/2 rounded overflow-hidden"
                    style={{
                      left: barX,
                      width: barW,
                      height: row.level === 'major' || row.level === 'middle' ? 14 : 12,
                    }}
                  >
                    {/* Background */}
                    <div className={cn("absolute inset-0 opacity-30", LEVEL_COLORS[row.level] ?? "bg-gray-300")} />
                    {/* Progress fill */}
                    <div
                      className={cn("absolute top-0 left-0 bottom-0 transition-all", barColor)}
                      style={{ width: `${row.progress || 0}%` }}
                    />
                    {/* Progress label */}
                    {barW > 30 && (
                      <div className="absolute inset-0 flex items-center justify-center text-[8px] font-bold text-white drop-shadow">
                        {Math.round(row.progress || 0)}%
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
