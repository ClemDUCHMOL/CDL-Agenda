interface LegendProps {
  showWeekends: boolean;
}

export function Legend({ showWeekends }: LegendProps) {
  return (
    <div className="flex flex-wrap justify-center gap-4 text-sm text-slate-600 mt-4">
      <span className="flex items-center gap-2">
        <span className="inline-block w-3.5 h-3.5 rounded-full bg-available" />
        Disponible
      </span>

      <span className="flex items-center gap-2">
        <span className="inline-block w-3.5 h-3.5 rounded-full bg-unavailable" />
        Indisponible
      </span>

      {showWeekends && (
        <span className="flex items-center gap-2">
          <span className="inline-block w-3.5 h-3.5 rounded-full bg-weekend" />
          Week-end
        </span>
      )}
    </div>
  );
}