"use client";

import { useRef, useState } from "react";
import { Calendar } from "@/components/Calendar";
import { Legend } from "@/components/Legend";
import { WarningBanner } from "@/components/WarningBanner";
import { ActionFeedback } from "@/components/ActionFeedback";
import { BulkEditForm } from "@/components/BulkEditForm";
import { useAgendaData } from "@/lib/useAgendaData";
import { createClient } from "@/lib/supabaseClient";
import { toggleSlot, bulkSetPeriod } from "@/lib/mutations";
import { Slot } from "@/lib/types";

function getInitialYearMonth() {
  const now = new Date();
  return { year: now.getUTCFullYear(), month: now.getUTCMonth() };
}

export default function AdminCalendarPage() {
  const supabase = useRef(createClient()).current;
  const [{ year, month }, setYearMonth] = useState(getInitialYearMonth());

  const {
    settings,
    exceptions,
    loading,
    initialLoadError,
    refreshError,
    refetch,
  } = useAgendaData(year, month);
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(
    null
  );
  const [bulkSubmitting, setBulkSubmitting] = useState(false);

  async function handleToggleSlot(date: Date, slot: Slot) {
    if (!settings) return;
    const dateISO = date.toISOString().slice(0, 10);
    const key = `${dateISO}_${slot}`;
    setPendingKey(key);
    setFeedback(null);

    const result = await toggleSlot(supabase, date, slot, settings, exceptions);

    setPendingKey(null);
    if (result.success) {
      setFeedback({ type: "success", message: "Modification enregistrée." });
      await refetch();
    } else {
      setFeedback({
        type: "error",
        message: `Échec de l'enregistrement : ${result.errorMessage ?? "erreur inconnue"}.`,
      });
    }
  }

  async function handleBulkSubmit(
    startDate: Date,
    endDate: Date,
    slots: Slot[],
    action: "block" | "unblock"
  ) {
    setBulkSubmitting(true);
    setFeedback(null);

    const result = await bulkSetPeriod(supabase, startDate, endDate, slots, action);

    setBulkSubmitting(false);
    if (result.success) {
      setFeedback({ type: "success", message: "Modification enregistrée." });
      await refetch();
    } else {
      setFeedback({
        type: "error",
        message: `Échec de l'enregistrement : ${result.errorMessage ?? "erreur inconnue"}.`,
      });
    }
  }

  if (loading) {
    return <p className="text-center text-slate-400 text-sm">Chargement…</p>;
  }

  if (initialLoadError || !settings) {
    return (
      <WarningBanner message="Impossible de charger l'agenda. Vérifiez la connexion à la base de données." />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {refreshError && (
        <WarningBanner message="La mise à jour de l'agenda a échoué. Les données affichées peuvent ne plus être à jour." />
      )}

      <ActionFeedback feedback={feedback} />

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 sm:p-6">
        <Calendar
          year={year}
          month={month}
          onMonthChange={(y, m) => setYearMonth({ year: y, month: m })}
          settings={settings}
          exceptions={exceptions}
          editable
          onToggleSlot={handleToggleSlot}
          pendingKey={pendingKey}
        />
        <Legend />
      </div>

      <BulkEditForm
        eveningStartHour={settings.evening_start_hour}
        onSubmit={handleBulkSubmit}
        submitting={bulkSubmitting}
      />
    </div>
  );
}
