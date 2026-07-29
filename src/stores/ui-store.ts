import { create } from "zustand";

type UiState = Record<string, never>;

/** Client UI state only — auth comes from Supabase, not Zustand. */
export const useUiStore = create<UiState>(() => ({}) as UiState);
