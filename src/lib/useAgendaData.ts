"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "./supabaseClient";
import { ExceptionsMap, Settings, SlotException } from "./types";

interface AgendaDataState {
  settings: Settings | null;
  exceptions: ExceptionsMap;
  loading: boolean;
  initialLoadError: boolean;
  refreshError: boolean;
}

function toExceptionsMap(rows: SlotException[]): ExceptionsMap {
  const map: ExceptionsMap = {};

  for (const row of rows) {
    map[`${row.date}_${row.slot}`] = row;
  }

  return map;
}

/**
 * Calcule la période de chargement autour du mois affiché.
 *
 * On charge le mois précédent, le mois courant et le mois suivant.
 * Cela évite de récupérer inutilement toute la table slot_exceptions.
 */
function getExceptionDateRange(year: number, month: number) {
  const from = new Date(Date.UTC(year, month - 1, 1));
  const to = new Date(Date.UTC(year, month + 2, 1));

  return {
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
  };
}

export function useAgendaData(year?: number, month?: number) {
  const supabase = useRef(createClient()).current;

  const [state, setState] = useState<AgendaDataState>({
    settings: null,
    exceptions: {},
    loading: true,
    initialLoadError: false,
    refreshError: false,
  });

  const hasLoadedOnce = useRef(false);

  const fetchAll = useCallback(async () => {
    const dateRange =
      year !== undefined && month !== undefined
        ? getExceptionDateRange(year, month)
        : null;

    const [settingsRes, exceptionsRes] = await Promise.all([
      supabase
        .from("settings")
        .select("*")
        .eq("id", 1)
        .single(),

      dateRange
        ? supabase
            .from("slot_exceptions")
            .select("*")
            .gte("date", dateRange.from)
            .lt("date", dateRange.to)
        : supabase.from("slot_exceptions").select("*"),
    ]);

    if (settingsRes.error || exceptionsRes.error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        initialLoadError: !hasLoadedOnce.current,
        refreshError: hasLoadedOnce.current,
      }));
      return;
    }

    hasLoadedOnce.current = true;

    setState({
      settings: settingsRes.data as Settings,
      exceptions: toExceptionsMap(
        (exceptionsRes.data ?? []) as SlotException[]
      ),
      loading: false,
      initialLoadError: false,
      refreshError: false,
    });
  }, [supabase, year, month]);

  useEffect(() => {
    fetchAll();

    const channel = supabase
      .channel("agenda-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "slot_exceptions",
        },
        () => {
          fetchAll();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "settings",
        },
        () => {
          fetchAll();
        }
      )
      .subscribe((status) => {
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          setState((prev) => ({
            ...prev,
            refreshError: hasLoadedOnce.current,
          }));
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchAll, supabase]);

  return {
    ...state,
    refetch: fetchAll,
  };
}
