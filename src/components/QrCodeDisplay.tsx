"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Settings } from "@/lib/types";

interface QrCodeDisplayProps {
  settings: Settings;
  uploadedImageUrl: string | null;
}

export function QrCodeDisplay({ settings, uploadedImageUrl }: QrCodeDisplayProps) {
  const [generatedDataUrl, setGeneratedDataUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (settings.qr_mode === "generated" && settings.qr_link) {
      QRCode.toDataURL(settings.qr_link, { width: 220, margin: 1 })
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

  const src = settings.qr_mode === "uploaded" ? uploadedImageUrl : generatedDataUrl;

  if (!src) return null;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt="QR code de contact"
      className="w-28 h-28 sm:w-32 sm:h-32 object-contain rounded-md border border-slate-200 bg-white p-1"
    />
  );
}
