export type Slot = "morning" | "afternoon" | "evening";

export type SlotStatus = "available" | "unavailable" | "weekend";

export type HolidayZone = "metropole" | "alsace_moselle";

export type HolidayBehavior = "normal" | "auto_unavailable";

export type QrMode = "uploaded" | "generated";

export type ExceptionType = "unavailable" | "available_override";

export interface Settings {
  id: number;
  show_weekends: boolean;
  holiday_zone: HolidayZone;
  holiday_behavior: HolidayBehavior;
  evening_start_hour: number;
  header_logo_enabled: boolean;
  header_title_enabled: boolean;
  header_photo_enabled: boolean;
  header_qr_enabled: boolean;
  title_text: string;
  logo_path: string | null;
  photo_path: string | null;
  qr_mode: QrMode;
  qr_link: string | null;
  qr_image_path: string | null;
  updated_at: string;
}

export interface SlotException {
  id: string;
  date: string; // format YYYY-MM-DD
  slot: Slot;
  type: ExceptionType;
  created_at: string;
  updated_at: string;
}

// Regroupe les exceptions par clé "YYYY-MM-DD_slot" pour un accès rapide
export type ExceptionsMap = Record<string, SlotException>;

export const SLOTS: Slot[] = ["morning", "afternoon", "evening"];

export const SLOT_LABELS: Record<Slot, string> = {
  morning: "Matin",
  afternoon: "Après-midi",
  evening: "Soir",
};
