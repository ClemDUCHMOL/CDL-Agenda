"use client";

import { Settings } from "@/lib/types";
import { QrCodeDisplay } from "./QrCodeDisplay";

interface HeaderProps {
  settings: Settings;
  logoUrl: string | null;
  photoUrl: string | null;
  qrImageUrl: string | null;
}

export function Header({ settings, logoUrl, photoUrl, qrImageUrl }: HeaderProps) {
  const anyElementActive =
    (settings.header_logo_enabled && logoUrl) ||
    (settings.header_title_enabled && settings.title_text) ||
    (settings.header_photo_enabled && photoUrl) ||
    settings.header_qr_enabled;

  if (!anyElementActive) return null;

  return (
    <header className="flex flex-col items-center gap-3 mb-6">
      {settings.header_logo_enabled && logoUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logoUrl}
          alt="Logo"
          className="max-h-20 max-w-[240px] object-contain"
        />
      )}

      {settings.header_title_enabled && settings.title_text && (
        <h1 className="text-xl sm:text-2xl font-semibold text-brand text-center tracking-tight">
          {settings.title_text}
        </h1>
      )}

      {(settings.header_photo_enabled || settings.header_qr_enabled) && (
        <div className="flex flex-wrap items-center justify-center gap-4 mt-1">
          {settings.header_photo_enabled && photoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photoUrl}
              alt="Photo"
              className="w-28 h-28 sm:w-32 sm:h-32 object-cover rounded-full border border-slate-200"
            />
          )}
          {settings.header_qr_enabled && (
            <QrCodeDisplay settings={settings} uploadedImageUrl={qrImageUrl} />
          )}
        </div>
      )}
    </header>
  );
}
