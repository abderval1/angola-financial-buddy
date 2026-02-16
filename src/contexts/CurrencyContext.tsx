import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

import { useTranslation } from "react-i18next";

type Currency = "AOA" | "USD" | "EUR" | "BRL" | "GBP" | "ZAR";

interface CurrencyContextType {
    currency: Currency;
    setCurrency: (currency: Currency) => void;
    formatPrice: (amount: number, originalCurrency?: Currency) => string;
    convertPrice: (amount: number, from: Currency, to: Currency) => number;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

// Mock exchange rates (relative to AOA)
// In a real app, these would be fetched from an API
const EXCHANGES: Record<Currency, number> = {
    AOA: 1,
    USD: 910, // 1 USD = 910 AOA
    EUR: 980, // 1 EUR = 980 AOA
    BRL: 180, // 1 BRL = 180 AOA
    GBP: 1150, // 1 GBP = 1150 AOA
    ZAR: 48, // 1 ZAR = 48 AOA
};

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const { i18n } = useTranslation();
    const [currency, setCurrencyState] = useState<Currency>("AOA");

    const { data: profile } = useQuery({
        queryKey: ["profile", user?.id],
        queryFn: async () => {
            if (!user?.id) return null;
            const { data } = await supabase
                .from("profiles")
                .select("currency, language")
                .eq("user_id", user.id)
                .single();
            return data;
        },
        enabled: !!user?.id,
    });

    useEffect(() => {
        if (profile?.currency) {
            setCurrencyState(profile.currency as Currency);
        }
        if (profile?.language) {
            i18n.changeLanguage(profile.language);
        }
    }, [profile, i18n]);

    const setCurrency = async (newCurrency: Currency) => {
        setCurrencyState(newCurrency);
        if (user?.id) {
            await supabase
                .from("profiles")
                .update({ currency: newCurrency })
                .eq("user_id", user.id);
        }
    };

    const convertPrice = (amount: number, from: Currency, to: Currency) => {
        if (from === to) return amount;
        // Convert to AOA first (base)
        const amountInAOA = amount * EXCHANGES[from];
        // Convert to target
        return amountInAOA / EXCHANGES[to];
    };

    const formatPrice = (amount: number, originalCurrency: Currency = "AOA") => {
        const converted = convertPrice(amount, originalCurrency, currency);

        return new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: currency,
        }).format(converted);
    };

    return (
        <CurrencyContext.Provider value={{ currency, setCurrency, formatPrice, convertPrice }}>
            {children}
        </CurrencyContext.Provider>
    );
};

export const useCurrency = () => {
    const context = useContext(CurrencyContext);
    if (!context) {
        throw new Error("useCurrency must be used within a CurrencyProvider");
    }
    return context;
};
