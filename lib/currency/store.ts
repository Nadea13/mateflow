import { create } from "zustand";
import { persist } from "zustand/middleware";
import { CurrencyCode } from "./index";

interface CurrencyState {
    currency: CurrencyCode;
    setCurrency: (currency: CurrencyCode) => void;
}

export const useCurrencyStore = create<CurrencyState>()(
    persist(
        (set) => ({
            currency: "USD",
            setCurrency: (currency: CurrencyCode) => set({ currency }),
        }),
        {
            name: "mateflow-currency",
        }
    )
);
