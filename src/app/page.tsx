"use client";

import { useMemo, useRef, useState } from "react";
import { Calendar } from "@/components/Calendar";
import { Legend } from "@/components/Legend";
import { Header } from "@/components/Header";
import { WarningBanner } from "@/components/WarningBanner";
import { useAgendaData } from "@/lib/useAgendaData";
import { createClient } from "@/lib/supabaseClient";
import { getPublicAssetUrl } from "@/lib/storage";

const DEFAULT_START_YEAR = 2026;
const DEFAULT_START_MONTH = 8; // septembre (0-indexé)

function getDefaultYearMonth(): { year: number; month: number } {
  const now = new Date();
  const defaultStart = new Date(Date.UTC(DEFAULT_START_YEAR, DEFAULT_START_MONTH, 1));
  if (now < defaultStart) {
    return { year: DEFAULT_START_YEAR, month: DEFAULT_START_MONTH };
  }
  return { year: now.getUTCFullYear(), month: now.getUTCMonth() };
}

export default function PublicPage() {
  const supabase = useRef(createClient()).current;
  const [{ year, month }, setYearMonth] = useState(getDefaultYearMonth());

  const { settings, exceptions, loading, initialLoadError, refreshError } =
    useAgendaData(year, month);

  const assetUrls = useMemo(() => {
    if (!settings) return { logoUrl: null, photoUrl: null, qrImageUrl: null };
    return {
      logoUrl: getPublicAssetUrl(supabase, settings.logo_path, settings.updated_at),
      photoUrl: getPublicAssetUrl(supabase, settings.photo_path, settings.updated_at),
      qrImageUrl: getPublicAssetUrl(supabase, settings.qr_image_path, settings.updated_at),
    };
  }, [settings, supabase]);

  return (
    <main className="max-w-3xl mx-auto px-4 py-8 sm:py-12">
      {loading && (
        <p className="text-center text-slate-400 text-sm mb-4">Chargement de l&apos;agenda…</p>
      )}

{initialLoadError && (
  <WarningBanner message="Impossible de vérifier les disponibilités. Veuillez actualiser la page (F5) et réessayer." />
)}

{!initialLoadError && refreshError && (
  <WarningBanner message="L'agenda n'est pas à jour. Veuillez actualiser la page (F5) et réessayer." />
)}

      {settings && !initialLoadError && (
        <>
          <Header
            settings={settings}
            logoUrl={assetUrls.logoUrl}
            photoUrl={assetUrls.photoUrl}
            qrImageUrl={assetUrls.qrImageUrl}
          />

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 sm:p-6">
            <Calendar
              year={year}
              month={month}
              onMonthChange={(y, m) => setYearMonth({ year: y, month: m })}
              settings={settings}
              exceptions={exceptions}
            />
            <Legend />
          </div>

          <p className="text-center text-sm text-slate-500 mt-6">
            Pour convenir d&apos;un rendez-vous, merci de me contacter de préférence par mail
          </p>
        </>
      )}
    </main>
  );
}
