import { isHoliday } from "./holidays";
import { ExceptionsMap, Settings, Slot, SlotStatus } from "./types";

export function exceptionKey(dateISO: string, slot: Slot): string {
  return `${dateISO}_${slot}`;
}

export function isWeekend(date: Date): boolean {
  const day = date.getUTCDay(); // 0 = dimanche, 6 = samedi
  return day === 0 || day === 6;
}

export function toISODate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * Détermine le statut d'un créneau donné, en appliquant strictement la
 * priorité des règles définie dans le cahier des charges :
 *   1. Week-end affiché => toujours gris, quelle que soit toute exception
 *   2. Exception manuelle "available_override" => disponible
 *   3. Exception manuelle "unavailable" => indisponible
 *   4. Règle automatique jour férié (si activée) => indisponible
 *   5. Par défaut => disponible
 *
 * Retourne `null` si le jour est un week-end et que l'affichage des
 * week-ends est désactivé (le créneau ne doit alors pas être rendu).
 */
export function computeSlotStatus(
  date: Date,
  slot: Slot,
  settings: Settings,
  exceptions: ExceptionsMap
): SlotStatus | null {
  const weekend = isWeekend(date);

  if (weekend) {
    return settings.show_weekends ? "weekend" : null;
  }

  const dateISO = toISODate(date);
  const exception = exceptions[exceptionKey(dateISO, slot)];

  if (exception?.type === "available_override") {
    return "available";
  }
  if (exception?.type === "unavailable") {
    return "unavailable";
  }

  if (settings.holiday_behavior === "auto_unavailable" && isHoliday(dateISO, settings.holiday_zone)) {
    return "unavailable";
  }

  return "available";
}

export function eveningLabel(startHour: number): string {
  return `Soir (>${startHour}h)`;
}
