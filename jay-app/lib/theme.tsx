/**
 * Theme provider with light/dark mode support.
 * Persists preference in AsyncStorage.
 * Usage: const { colors, mode, toggle, isDark } = useTheme();
 */
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { iOS, type ThemeMode, type ThemeColors } from '../constants/theme';

const STORAGE_KEY = '@jay_theme_mode';

interface ThemeContextType {
  mode: ThemeMode;
  isDark: boolean;
  colors: ThemeColors;
  setMode: (mode: ThemeMode) => void;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  mode: 'light',
  isDark: false,
  colors: iOS.light as unknown as ThemeColors,
  setMode: () => {},
  toggle: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>(systemScheme === 'dark' ? 'dark' : 'light');

  // Load saved preference on mount
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((saved) => {
      if (saved === 'light' || saved === 'dark') {
        setModeState(saved);
      }
    });
  }, []);

  const setMode = (m: ThemeMode) => {
    setModeState(m);
    AsyncStorage.setItem(STORAGE_KEY, m);
  };

  const toggle = () => {
    const next = mode === 'light' ? 'dark' : 'light';
    setMode(next);
  };

  const value: ThemeContextType = {
    mode,
    isDark: mode === 'dark',
    colors: iOS[mode] as unknown as ThemeColors,
    setMode,
    toggle,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
