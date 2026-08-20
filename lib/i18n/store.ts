import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Locale } from "./index";

interface I18nState {
    locale: Locale;
    setLocale: (locale: Locale) => void;
}

export const useI18nStore = create<I18nState>()(
    persist(
        (set) => ({
            locale: "en",
            setLocale: (locale: Locale) => set({ locale }),
        }),
        {
            name: "mateflow-locale",
        }
    )
);
