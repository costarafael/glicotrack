import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Theme, ThemeColors } from '../types';
import { StorageService } from '../services/storage';
import { Typography } from '../styles/typography';

// Tailwind-inspired color scheme
const lightTheme: ThemeColors = {
  primary: '#3b82f6', // blue-500
  secondary: '#1d4ed8', // blue-700
  background: '#ffffff', // white
  surface: '#f9fafb', // gray-50
  text: '#111827', // gray-900
  textSecondary: '#6b7280', // gray-500
  border: '#e5e7eb', // gray-200
  success: '#10b981', // emerald-500
  warning: '#f59e0b', // amber-500
  error: '#ef4444', // red-500
};

const darkTheme: ThemeColors = {
  primary: '#60a5fa', // blue-400
  secondary: '#3b82f6', // blue-500
  background: '#0f172a', // slate-900
  surface: '#1e293b', // slate-800
  text: '#f1f5f9', // slate-100
  textSecondary: '#94a3b8', // slate-400
  border: '#374151', // gray-700
  success: '#34d399', // emerald-400
  warning: '#fbbf24', // amber-400
  error: '#f87171', // red-400
};

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [isDark, setIsDark] = useState<boolean>(false);

  useEffect(() => {
    const savedTheme = StorageService.getTheme();
    setIsDark(savedTheme === 'dark');
  }, []);

  const toggleTheme = () => {
    const newTheme = isDark ? 'light' : 'dark';
    setIsDark(!isDark);
    StorageService.saveTheme(newTheme);
  };

  const theme: Theme = {
    colors: isDark ? darkTheme : lightTheme,
    typography: Typography,
    isDark,
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};