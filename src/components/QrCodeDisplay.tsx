"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Settings } from "@/lib/types";

interface QrCodeDisplayProps {
  settings: Settings;
  uploadedImageUrl: string | null;
}

export function QrCodeDisplay({
  settings,
  uploadedImageUrl,
}: QrCodeDisplayProps) {
  const [generatedDataUrl, setGeneratedDataUrl] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    if (settings.qr_mode === "generated" && settings.qr_link) {
      QRCode.toDataURL(settings.qr_link, {
        width: 800,
        margin: 1,
      })
        .then((url) => {
          if (!cancelled) setGeneratedDataUrl(url);
        })
        .catch(() => {
          if (!cancelled) setGeneratedDataUrl(null);
        });
    } else {
      setGeneratedDataUrl(null);
    }

    return () => {
      cancelled = true;
    };
  }, [settings.qr_mode, settings.qr_link]);

  const src =
    settings.qr_mode === "uploaded" ? uploadedImageUrl : generatedDataUrl;

  useEffect(() => {
    if (!isModalOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsModalOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isModalOpen]);

  if (!src) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setIsModalOpen(true)}
        className="cursor-pointer rounded-md border-0 bg-transparent p-0 transition-transform duration-150 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
        aria-label="Agrandir le QR code"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt="QR code de contact"
          className="w-28 h-28 sm:w-32 sm:h-32 object-contain rounded-md border border-slate-200 bg-white p-1"
        />
      </button>

      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setIsModalOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="QR code agrandi"
        >
          <div
            className="relative max-w-[90vw] max-h-[90vh] rounded-xl bg-white p-4 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="absolute -right-3 -top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white text-xl font-semibold text-slate-700 shadow-md hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-400"
              aria-label="Fermer"
            >
              ×
            </button>

            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt="QR code de contact agrandi"
              className="max-h-[80vh] max-w-[80vw] object-contain"
            />
          </div>
        </div>
      )}
    </>
  );
}