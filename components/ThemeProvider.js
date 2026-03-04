"use client";
import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
    const [dark, setDark] = useState(false);

    useEffect(() => {
        const saved = localStorage.getItem('medai-theme');
        if (saved === 'dark') setDark(true);
    }, []);

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
        localStorage.setItem('medai-theme', dark ? 'dark' : 'light');
    }, [dark]);

    return (
        <ThemeContext.Provider value={{ dark, toggle: () => setDark(p => !p) }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    return useContext(ThemeContext);
}
