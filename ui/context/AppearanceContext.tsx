import AsyncStorage from "@react-native-async-storage/async-storage";
import {createContext, ReactNode, useContext, useEffect, useRef, useState} from "react";
import {useColorScheme} from "react-native";

type AppearancePreference = "system" | "light" | "dark";
const storageKey = "appearance_preference";
const isPreference = (value: string | null): value is AppearancePreference =>
    value === "system" || value === "light" || value === "dark";

const AppearanceContext = createContext<{
    preference: AppearancePreference;
    dark: boolean;
    ready: boolean;
    saving: boolean;
    error?: string;
    setPreference: (value: AppearancePreference) => Promise<void>;
} | undefined>(undefined);

export function AppearanceProvider({children}: {children: ReactNode}) {
    const systemScheme = useColorScheme();
    const [preference, setPreferenceState] = useState<AppearancePreference>("system");
    const [ready, setReady] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string>();
    const savingRef = useRef(false);

    useEffect(() => {
        let active = true;
        void AsyncStorage.getItem(storageKey).then(value => {
            if (active) setPreferenceState(isPreference(value) ? value : "system");
        }).catch(() => {
            if (active) setError("無法讀取外觀設定，暫時跟隨系統。你可以重新選擇外觀。");
        }).finally(() => { if (active) setReady(true); });
        return () => { active = false; };
    }, []);

    const setPreference = async (value: AppearancePreference) => {
        if (!ready || savingRef.current) return;
        savingRef.current = true;
        setSaving(true);
        setPreferenceState(value);
        setError(undefined);
        try {
            await AsyncStorage.setItem(storageKey, value);
        } catch {
            setError("無法儲存外觀設定，本次使用仍會套用。請重新選擇外觀以重試儲存。");
        } finally {
            savingRef.current = false;
            setSaving(false);
        }
    };

    return <AppearanceContext.Provider value={{preference,
        dark: (preference === "system" ? systemScheme : preference) === "dark",
        ready, saving, error, setPreference}}>{children}</AppearanceContext.Provider>;
}

export function useAppearance() {
    const context = useContext(AppearanceContext);
    if (!context) throw new Error("useAppearance requires AppearanceProvider");
    return context;
}
