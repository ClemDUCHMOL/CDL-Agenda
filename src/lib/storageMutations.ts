import { SupabaseClient } from "@supabase/supabase-js";
import { ASSETS_BUCKET } from "./storage";
import { MutationResult } from "./mutations";

/**
 * Envoie un fichier image dans le bucket public et retourne son chemin de
 * stockage (à enregistrer dans la table settings). Le nom de fichier est
 * fixe par type d'image afin de simplifier le remplacement (upsert).
 */
export async function uploadAssetImage(
  supabase: SupabaseClient,
  file: File,
  slot: "logo" | "photo" | "qr"
): Promise<{ path: string | null } & MutationResult> {
  const extension = file.name.split(".").pop()?.toLowerCase() || "png";
  const path = `${slot}.${extension}`;

  const { error } = await supabase.storage
    .from(ASSETS_BUCKET)
    .upload(path, file, { upsert: true, cacheControl: "3600" });

  if (error) {
    return { success: false, errorMessage: error.message, path: null };
  }
  return { success: true, path };
}

export async function removeAssetImage(
  supabase: SupabaseClient,
  path: string
): Promise<MutationResult> {
  const { error } = await supabase.storage.from(ASSETS_BUCKET).remove([path]);
  if (error) {
    return { success: false, errorMessage: error.message };
  }
  return { success: true };
}
