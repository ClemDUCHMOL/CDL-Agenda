"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "./supabaseClient";
import { ExceptionsMap, Settings, SlotException } from "./types";

interface AgendaDataState {
  settings: Settings | null;
  exceptions: ExceptionsMap;
  loading: boolean;
  /** true = jamais réussi à charger -> ne pas afficher un calendrier "tout vert" */
  initialLoadError: boolean;
  /** true = un chargement précédent a réussi, mais le rafraîchissement a échoué -> données potentiellement obsolètes */
  refreshError: boolean;
}

function toExceptionsMap(rows: SlotException[]): ExceptionsMap {
  const map: ExceptionsMap = {};
  for (const row of rows) {
    map[`${row.date}_${row.slot}`] = row;
  }
  return map;
}

export function useAgendaData() {
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
    const [settingsRes, exceptionsRes] = await Promise.all([
      supabase.from("settings").select("*").eq("id", 1).single(),
      supabase.from("slot_exceptions").select("*"),
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
      exceptions: toExceptionsMap((exceptionsRes.data ?? []) as SlotException[]),
      loading: false,
      initialLoadError: false,
      refreshError: false,
    });
  }, [supabase]);

  useEffect(() => {
    fetchAll();

    const channel = supabase
      .channel("agenda-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "slot_exceptions" }, () => {
        fetchAll();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "settings" }, () => {
        fetchAll();
      })
      .subscribe((status) => {
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          setState((prev) => ({ ...prev, refreshError: hasLoadedOnce.current }));
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { ...state, refetch: fetchAll };
}
