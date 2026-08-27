"use client";

import { useState } from "react";
import { Slot, SLOTS, SLOT_LABELS } from "@/lib/types";

interface BulkEditFormProps {
  eveningStartHour: number;
  onSubmit: (
    startDate: Date,
    endDate: Date,
    slots: Slot[],
    action: "block" | "unblock"
  ) => Promise<void>;
  submitting: boolean;
}

function slotLabel(slot: Slot, eveningStartHour: number): string {
  return slot === "evening" ? `Soir (>${eveningStartHour}h)` : SLOT_LABELS[slot];
}

export function BulkEditForm({ eveningStartHour, onSubmit, submitting }: BulkEditFormProps) {
  const [startDateStr, setStartDateStr] = useState("");
  const [endDateStr, setEndDateStr] = useState("");
  const [selectedSlots, setSelectedSlots] = useState<Slot[]>(["morning", "afternoon", "evening"]);
  const [localError, setLocalError] = useState<string | null>(null);

  function toggleSlotChoice(slot: Slot) {
    setSelectedSlots((prev) =>
      prev.includes(slot) ? prev.filter((s) => s !== slot) : [...prev, slot]
    );
  }

  async function handleAction(action: "block" | "unblock") {
    setLocalError(null);
    if (!startDateStr || !endDateStr) {
      setLocalError("Merci de renseigner une date de début et une date de fin.");
      return;
    }
    if (selectedSlots.length === 0) {
      setLocalError("Merci de sélectionner au moins un créneau.");
      return;
    }
    const start = new Date(`${startDateStr}T00:00:00Z`);
    const end = new Date(`${endDateStr}T00:00:00Z`);
    if (start > end) {
      setLocalError("La date de début doit précéder la date de fin.");
      return;
    }
    await onSubmit(start, end, selectedSlots, action);
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 sm:p-6 flex flex-col gap-4">
      <h3 className="font-semibold text-brand">Modifier une période</h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-sm text-slate-600">Date de début</label>
          <input
            type="date"
            value={startDateStr}
            onChange={(e) => setStartDateStr(e.target.value)}
            className="border border-slate-300 rounded-md px-3 py-2 text-sm"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm text-slate-600">Date de fin</label>
          <input
            type="date"
            value={endDateStr}
            onChange={(e) => setEndDateStr(e.target.value)}
            className="border border-slate-300 rounded-md px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-sm text-slate-600">Créneaux concernés</span>
        <div className="flex flex-wrap gap-3">
          {SLOTS.map((slot) => (
            <label key={slot} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={selectedSlots.includes(slot)}
                onChange={() => toggleSlotChoice(slot)}
              />
              {slotLabel(slot, eveningStartHour)}
            </label>
          ))}
        </div>
      </div>

      <p className="text-xs text-slate-400">
        Les samedis et dimanches sont automatiquement exclus de cette action.
      </p>

      {localError && <p className="text-sm text-unavailable">{localError}</p>}

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={() => handleAction("block")}
          disabled={submitting}
          className="flex-1 bg-unavailable text-white rounded-md py-2 text-sm font-medium hover:opacity-90 transition disabled:opacity-50"
        >
          Bloquer la période
        </button>
        <button
          onClick={() => handleAction("unblock")}
          disabled={submitting}
          className="flex-1 bg-available text-white rounded-md py-2 text-sm font-medium hover:opacity-90 transition disabled:opacity-50"
        >
          Rendre disponible la période
        </button>
      </div>
    </div>
  );
}
