import { SupabaseClient } from "@supabase/supabase-js";
import { computeSlotStatus, isWeekend, toISODate } from "./availability";
import { ExceptionsMap, ExceptionType, Settings, Slot } from "./types";

export interface MutationResult {
  success: boolean;
  errorMessage?: string;
}

async function upsertException(
  supabase: SupabaseClient,
  dateISO: string,
  slot: Slot,
  type: ExceptionType
): Promise<MutationResult> {
  const { error } = await supabase
    .from("slot_exceptions")
    .upsert({ date: dateISO, slot, type }, { onConflict: "date,slot" });

  if (error) {
    return { success: false, errorMessage: error.message };
  }
  return { success: true };
}

/**
 * Bascule un créneau individuel entre disponible et indisponible.
 * - Si le créneau est actuellement disponible (par défaut ou par exception),
 *   on enregistre une exception "unavailable".
 * - S'il est actuellement indisponible (manuellement ou via la règle des
 *   jours fériés), on enregistre une exception "available_override" qui
 *   garantit la disponibilité quelle que soit la règle automatique.
 */
export async function toggleSlot(
  supabase: SupabaseClient,
  date: Date,
  slot: Slot,
  settings: Settings,
  exceptions: ExceptionsMap
): Promise<MutationResult> {
  if (isWeekend(date)) {
    return { success: false, errorMessage: "Les week-ends ne sont pas modifiables." };
  }
  const currentStatus = computeSlotStatus(date, slot, settings, exceptions);
  const dateISO = toISODate(date);
  const nextType: ExceptionType = currentStatus === "available" ? "unavailable" : "available_override";
  return upsertException(supabase, dateISO, slot, nextType);
}

/**
 * Bloque ou débloque une période entière pour les créneaux sélectionnés.
 * Les jours de week-end sont systématiquement ignorés.
 */
export async function bulkSetPeriod(
  supabase: SupabaseClient,
  startDate: Date,
  endDate: Date,
  slots: Slot[],
  action: "block" | "unblock"
): Promise<MutationResult> {
  const rows: { date: string; slot: Slot; type: ExceptionType }[] = [];
  const cursor = new Date(startDate);

  while (cursor <= endDate) {
    if (!isWeekend(cursor)) {
      const dateISO = toISODate(cursor);
      for (const slot of slots) {
        rows.push({
          date: dateISO,
          slot,
          type: action === "block" ? "unavailable" : "available_override",
        });
      }
    }
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  if (rows.length === 0) {
    return { success: false, errorMessage: "Aucun jour ouvré dans la période sélectionnée." };
  }

  const { error } = await supabase.from("slot_exceptions").upsert(rows, { onConflict: "date,slot" });

  if (error) {
    return { success: false, errorMessage: error.message };
  }
  return { success: true };
}

export async function updateSettings(
  supabase: SupabaseClient,
  patch: Partial<Settings>
): Promise<MutationResult> {
  const { error } = await supabase
    .from("settings")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", 1);

  if (error) {
    return { success: false, errorMessage: error.message };
  }
  return { success: true };
}
