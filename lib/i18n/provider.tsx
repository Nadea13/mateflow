"use client";

import { useCallback, useEffect, useState } from "react";
import { useI18nStore } from "./store";
import { en, th } from "./index";
import type { Locale, TranslationKeys } from "./index";

const dictionaries: Record<Locale, TranslationKeys> = { en, th };

/**
 * Resolve a dot-notation key like "nav.dashboard" from the dictionary.
 */
function getNestedValue(obj: any, path: string): any {
    const keys = path.split(".");
    let current = obj;
    for (const key of keys) {
        if (current === undefined || current === null) return path;
        current = current[key];
    }
    return current !== undefined ? current : path;
}

/**
 * Hook providing translation function, current locale, and locale setter.
 *
 * Usage:
 *   const { t, locale, setLocale } = useTranslation();
 *   t("nav.dashboard") // => "Dashboard" or "แดชบอร์ด"
 */
export function useTranslation() {
    const { locale, setLocale } = useI18nStore();
    const [mounted, setMounted] = useState(false);

    useEffect(() => setMounted(true), []);

    const t = useCallback(
        (key: string): any => {
            const dict = dictionaries[mounted ? locale : "en"];
            return getNestedValue(dict, key);
        },
        [locale, mounted]
    );

    return { t, locale: mounted ? locale : "en", setLocale };
}
