"use client";

import { buildMonthGrid, MONTH_NAMES_FR, WEEKDAY_LABELS_FR } from "@/lib/calendarGrid";
import { computeSlotStatus, isWeekend, toISODate } from "@/lib/availability";
import { ExceptionsMap, Settings, Slot, SlotStatus, SLOTS, SLOT_LABELS } from "@/lib/types";
import { eveningLabel } from "@/lib/availability";

interface CalendarProps {
  year: number;
  month: number; // 0-11
  onMonthChange: (year: number, month: number) => void;
  settings: Settings;
  exceptions: ExceptionsMap;
  editable?: boolean;
  onToggleSlot?: (date: Date, slot: Slot) => void;
  pendingKey?: string | null;
}

const STATUS_COLOR: Record<SlotStatus, string> = {
  available: "bg-available",
  unavailable: "bg-unavailable",
  weekend: "bg-weekend",
};

function slotLabel(slot: Slot, eveningStartHour: number): string {
  return slot === "evening" ? eveningLabel(eveningStartHour) : SLOT_LABELS[slot];
}

export function Calendar({
  year,
  month,
  onMonthChange,
  settings,
  exceptions,
  editable = false,
  onToggleSlot,
  pendingKey = null,
}: CalendarProps) {
  const weeks = buildMonthGrid(year, month);
  const showWeekends = settings.show_weekends;
  const visibleWeekdayLabels = showWeekends
    ? WEEKDAY_LABELS_FR
    : WEEKDAY_LABELS_FR.slice(0, 5);

  function goToPreviousMonth() {
    const newMonth = month === 0 ? 11 : month - 1;
    const newYear = month === 0 ? year - 1 : year;
    onMonthChange(newYear, newMonth);
  }

  function goToNextMonth() {
    const newMonth = month === 11 ? 0 : month + 1;
    const newYear = month === 11 ? year + 1 : year;
    onMonthChange(newYear, newMonth);
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={goToPreviousMonth}
          className="px-3 py-2 rounded-md border border-slate-300 text-slate-700 hover:bg-slate-100 transition"
          aria-label="Mois précédent"
        >
          &larr;
        </button>
        <h2 className="text-lg font-semibold text-brand tracking-tight">
          {MONTH_NAMES_FR[month]} {year}
        </h2>
        <button
          onClick={goToNextMonth}
          className="px-3 py-2 rounded-md border border-slate-300 text-slate-700 hover:bg-slate-100 transition"
          aria-label="Mois suivant"
        >
          &rarr;
        </button>
      </div>

      <div className="overflow-x-auto">
        <div style={{ minWidth: showWeekends ? "700px" : "560px" }}>
          <div
            className="grid text-center text-xs font-medium text-slate-500 uppercase tracking-wide mb-1"
            style={{ gridTemplateColumns: `repeat(${visibleWeekdayLabels.length}, 1fr)` }}
          >
            {visibleWeekdayLabels.map((label) => (
              <div key={label} className="py-1">
                {label}
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-1">
            {weeks.map((week, weekIdx) => {
              const visibleDays = showWeekends ? week : week.filter((d) => !isWeekend(d.date));
              return (
                <div
                  key={weekIdx}
                  className="grid gap-1"
                  style={{ gridTemplateColumns: `repeat(${visibleDays.length}, 1fr)` }}
                >
                  {visibleDays.map(({ date, inCurrentMonth }) => {
                    const dayNumber = date.getUTCDate();
                    const dateISO = toISODate(date);
                    return (
                      <div
                        key={dateISO}
                        className={`rounded-lg border p-1.5 flex flex-col gap-1 ${
                          inCurrentMonth
                            ? "bg-white border-slate-200"
                            : "bg-slate-50 border-slate-100 opacity-50"
                        }`}
                      >
                        <div className="text-xs font-medium text-slate-500 text-center mb-0.5">
                          {dayNumber}
                        </div>
                        {SLOTS.map((slot) => {
                          const status = computeSlotStatus(date, slot, settings, exceptions);
                          if (status === null) return null;
                          const key = `${dateISO}_${slot}`;
                          const isWeekendSlot = status === "weekend";
                          const clickable = editable && !isWeekendSlot && !!onToggleSlot;
                          const isPending = pendingKey === key;
                          return (
                            <button
                              key={slot}
                              disabled={!clickable || isPending}
                              onClick={() => clickable && onToggleSlot!(date, slot)}
                              className={`flex items-center gap-1.5 text-[11px] leading-tight rounded px-1 py-0.5 text-left ${
                                clickable ? "hover:bg-slate-100 cursor-pointer" : "cursor-default"
                              } ${isPending ? "opacity-40" : ""}`}
                              title={clickable ? "Cliquer pour changer la disponibilité" : undefined}
                            >
                              <span
                                className={`inline-block w-2.5 h-2.5 rounded-full shrink-0 ${STATUS_COLOR[status]}`}
                              />
                              <span className="text-slate-600 truncate">
                                {slotLabel(slot, settings.evening_start_hour)}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
