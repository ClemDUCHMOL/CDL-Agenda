import { SupabaseClient } from "@supabase/supabase-js";

export const ASSETS_BUCKET = "public-assets";

export function getPublicAssetUrl(
  supabase: SupabaseClient,
  path: string | null | undefined,
  versionTag?: string
): string | null {
  if (!path) return null;
  const { data } = supabase.storage.from(ASSETS_BUCKET).getPublicUrl(path);
  // On ajoute un paramètre de version (ex: settings.updated_at) pour éviter
  // que le navigateur affiche une image en cache après un remplacement
  // (le nom de fichier en base peut rester identique).
  return versionTag ? `${data.publicUrl}?v=${encodeURIComponent(versionTag)}` : data.publicUrl;
}
