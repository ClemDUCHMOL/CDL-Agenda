"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabaseClient";
import { useAgendaData } from "@/lib/useAgendaData";
import { updateSettings } from "@/lib/mutations";
import { ActionFeedback } from "@/components/ActionFeedback";
import { WarningBanner } from "@/components/WarningBanner";
import { ImageAssetManager } from "@/components/ImageAssetManager";
import { HolidayBehavior, HolidayZone, QrMode, Settings } from "@/lib/types";

type FormState = Pick<
  Settings,
  | "show_weekends"
  | "holiday_zone"
  | "holiday_behavior"
  | "evening_start_hour"
  | "header_logo_enabled"
  | "header_title_enabled"
  | "header_photo_enabled"
  | "header_qr_enabled"
  | "title_text"
  | "qr_mode"
  | "qr_link"
>;

function extractFormState(settings: Settings): FormState {
  return {
    show_weekends: settings.show_weekends,
    holiday_zone: settings.holiday_zone,
    holiday_behavior: settings.holiday_behavior,
    evening_start_hour: settings.evening_start_hour,
    header_logo_enabled: settings.header_logo_enabled,
    header_title_enabled: settings.header_title_enabled,
    header_photo_enabled: settings.header_photo_enabled,
    header_qr_enabled: settings.header_qr_enabled,
    title_text: settings.title_text,
    qr_mode: settings.qr_mode,
    qr_link: settings.qr_link,
  };
}

export default function AdminSettingsPage() {
  const supabase = useRef(createClient()).current;
  const { settings, loading, initialLoadError, refetch } = useAgendaData();
  const [form, setForm] = useState<FormState | null>(null);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(
    null
  );

  useEffect(() => {
    if (settings) setForm(extractFormState(settings));
  }, [settings]);

  async function handleSave() {
    if (!form) return;
    setSaving(true);
    setFeedback(null);

    const result = await updateSettings(supabase, form);

    setSaving(false);
    if (result.success) {
      setFeedback({ type: "success", message: "Paramètres enregistrés." });
      await refetch();
    } else {
      setFeedback({
        type: "error",
        message: `Échec de l'enregistrement : ${result.errorMessage ?? "erreur inconnue"}.`,
      });
    }
  }

  async function handleImageChange(field: "logo_path" | "photo_path" | "qr_image_path", path: string | null) {
    setFeedback(null);
    const result = await updateSettings(supabase, { [field]: path } as Partial<Settings>);
    if (result.success) {
      await refetch();
      setFeedback({ type: "success", message: "Image mise à jour." });
    } else {
      setFeedback({
        type: "error",
        message: `Échec de la mise à jour : ${result.errorMessage ?? "erreur inconnue"}.`,
      });
    }
  }

  if (loading || !form) {
    return <p className="text-center text-slate-400 text-sm">Chargement…</p>;
  }

  if (initialLoadError || !settings) {
    return <WarningBanner message="Impossible de charger les paramètres." />;
  }

  return (
    <div className="flex flex-col gap-6">
      <ActionFeedback feedback={feedback} />

      {/* Affichage */}
      <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 sm:p-6 flex flex-col gap-4">
        <h3 className="font-semibold text-brand">Affichage</h3>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.show_weekends}
            onChange={(e) => setForm({ ...form, show_weekends: e.target.checked })}
          />
          Afficher les week-ends
        </label>
      </section>

      {/* Jours fériés */}
      <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 sm:p-6 flex flex-col gap-4">
        <h3 className="font-semibold text-brand">Jours fériés</h3>

        <div className="flex flex-col gap-1">
          <span className="text-sm text-slate-600">Zone géographique</span>
          <select
            value={form.holiday_zone}
            onChange={(e) => setForm({ ...form, holiday_zone: e.target.value as HolidayZone })}
            className="border border-slate-300 rounded-md px-3 py-2 text-sm w-fit"
          >
            <option value="metropole">France métropolitaine</option>
            <option value="alsace_moselle">Alsace-Moselle</option>
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-sm text-slate-600">Comportement</span>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="holiday_behavior"
              checked={form.holiday_behavior === "normal"}
              onChange={() => setForm({ ...form, holiday_behavior: "normal" as HolidayBehavior })}
            />
            Afficher les jours fériés comme des jours normaux
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="holiday_behavior"
              checked={form.holiday_behavior === "auto_unavailable"}
              onChange={() =>
                setForm({ ...form, holiday_behavior: "auto_unavailable" as HolidayBehavior })
              }
            />
            Rendre automatiquement les jours fériés indisponibles
          </label>
        </div>
      </section>

      {/* Créneaux */}
      <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 sm:p-6 flex flex-col gap-4">
        <h3 className="font-semibold text-brand">Créneaux</h3>
        <div className="flex flex-col gap-1">
          <span className="text-sm text-slate-600">Heure de début du créneau soir</span>
          <input
            type="number"
            min={0}
            max={23}
            value={form.evening_start_hour}
            onChange={(e) => setForm({ ...form, evening_start_hour: Number(e.target.value) })}
            className="border border-slate-300 rounded-md px-3 py-2 text-sm w-24"
          />
        </div>
      </section>

      {/* En-tête */}
      <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 sm:p-6 flex flex-col gap-5">
        <h3 className="font-semibold text-brand">En-tête</h3>

        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.header_logo_enabled}
              onChange={(e) => setForm({ ...form, header_logo_enabled: e.target.checked })}
            />
            Afficher le logo
          </label>
          <ImageAssetManager
            label="Logo"
            slotName="logo"
            currentPath={settings.logo_path}
            versionTag={settings.updated_at}
            onChange={(path) => handleImageChange("logo_path", path)}
          />
        </div>

        <hr className="border-slate-100" />

        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.header_title_enabled}
              onChange={(e) => setForm({ ...form, header_title_enabled: e.target.checked })}
            />
            Afficher le titre
          </label>
          <input
            type="text"
            placeholder="Agenda de..."
            value={form.title_text}
            onChange={(e) => setForm({ ...form, title_text: e.target.value })}
            className="border border-slate-300 rounded-md px-3 py-2 text-sm"
          />
        </div>

        <hr className="border-slate-100" />

        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.header_photo_enabled}
              onChange={(e) => setForm({ ...form, header_photo_enabled: e.target.checked })}
            />
            Afficher la photo
          </label>
          <ImageAssetManager
            label="Photo"
            slotName="photo"
            currentPath={settings.photo_path}
            versionTag={settings.updated_at}
            onChange={(path) => handleImageChange("photo_path", path)}
            roundedFull
          />
        </div>

        <hr className="border-slate-100" />

        <div className="flex flex-col gap-3">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.header_qr_enabled}
              onChange={(e) => setForm({ ...form, header_qr_enabled: e.target.checked })}
            />
            Afficher le QR code
          </label>

          <div className="flex flex-col gap-2 pl-1">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="qr_mode"
                checked={form.qr_mode === "generated"}
                onChange={() => setForm({ ...form, qr_mode: "generated" as QrMode })}
              />
              Générer depuis un lien
            </label>
            {form.qr_mode === "generated" && (
              <input
                type="url"
                placeholder="Lien du QR code : https://..."
                value={form.qr_link ?? ""}
                onChange={(e) => setForm({ ...form, qr_link: e.target.value })}
                className="border border-slate-300 rounded-md px-3 py-2 text-sm ml-6"
              />
            )}

            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="qr_mode"
                checked={form.qr_mode === "uploaded"}
                onChange={() => setForm({ ...form, qr_mode: "uploaded" as QrMode })}
              />
              Importer une image
            </label>
            {form.qr_mode === "uploaded" && (
              <div className="ml-6">
                <ImageAssetManager
                  label="Image du QR code"
                  slotName="qr"
                  currentPath={settings.qr_image_path}
                  versionTag={settings.updated_at}
                  onChange={(path) => handleImageChange("qr_image_path", path)}
                />
              </div>
            )}
          </div>
        </div>
      </section>

      <button
        onClick={handleSave}
        disabled={saving}
        className="bg-brand text-white rounded-md py-2.5 text-sm font-medium hover:bg-brand-light transition disabled:opacity-50"
      >
        {saving ? "Enregistrement…" : "Enregistrer les paramètres"}
      </button>
    </div>
  );
}
