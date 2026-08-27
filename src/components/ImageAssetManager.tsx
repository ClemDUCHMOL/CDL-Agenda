"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabaseClient";
import { getPublicAssetUrl } from "@/lib/storage";
import { uploadAssetImage, removeAssetImage } from "@/lib/storageMutations";

interface ImageAssetManagerProps {
  label: string;
  slotName: "logo" | "photo" | "qr";
  currentPath: string | null;
  versionTag: string;
  onChange: (newPath: string | null) => Promise<void>;
  roundedFull?: boolean;
}

export function ImageAssetManager({
  label,
  slotName,
  currentPath,
  versionTag,
  onChange,
  roundedFull = false,
}: ImageAssetManagerProps) {
  const supabase = useRef(createClient()).current;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const currentUrl = getPublicAssetUrl(supabase, currentPath, versionTag);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setError(null);

    const result = await uploadAssetImage(supabase, file, slotName);

    setBusy(false);
    if (!result.success || !result.path) {
      setError(result.errorMessage ?? "Échec de l'envoi de l'image.");
      return;
    }
    await onChange(result.path);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function handleRemove() {
    if (!currentPath) return;
    setBusy(true);
    setError(null);

    const result = await removeAssetImage(supabase, currentPath);

    setBusy(false);
    if (!result.success) {
      setError(result.errorMessage ?? "Échec de la suppression.");
      return;
    }
    await onChange(null);
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm text-slate-600">{label}</span>
      <div className="flex items-center gap-4">
        {currentUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={currentUrl}
            alt={label}
            className={`w-16 h-16 object-cover border border-slate-200 ${
              roundedFull ? "rounded-full" : "rounded-md"
            }`}
          />
        ) : (
          <div className="w-16 h-16 rounded-md border border-dashed border-slate-300 flex items-center justify-center text-slate-300 text-xs">
            Aucune
          </div>
        )}
        <div className="flex flex-col gap-1">
          <label className="text-xs px-3 py-1.5 rounded-md border border-slate-300 cursor-pointer hover:bg-slate-100 w-fit">
            {currentPath ? "Remplacer" : "Importer"}
            <input
              ref={inputRef}
              type="file"
              accept="image/png,image/jpeg"
              className="hidden"
              onChange={handleFileChange}
              disabled={busy}
            />
          </label>
          {currentPath && (
            <button
              onClick={handleRemove}
              disabled={busy}
              className="text-xs text-unavailable hover:underline w-fit"
            >
              Supprimer
            </button>
          )}
        </div>
      </div>
      {error && <p className="text-xs text-unavailable">{error}</p>}
    </div>
  );
}
