import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';

export type ThemeType = 'light' | 'dark' | 'auto';

export interface CustomTheme {
  id: string;
  name: string;
  type: ThemeType;
  colors: {
    primary: string;
    primaryContainer: string;
    secondary: string;
    secondaryContainer: string;
    tertiary: string;
    tertiaryContainer: string;
    error: string;
    errorContainer: string;
    background: string;
    surface: string;
    surfaceVariant: string;
    onSurface: string;
    onSurfaceVariant: string;
    outline: string;
    outlineVariant: string;
    cardBackground: string;
    textPrimary: string;
    textSecondary: string;
    textTertiary: string;
    border: string;
    shadow: string;
  };
}

export const defaultThemes: CustomTheme[] = [
  {
    id: 'default',
    name: 'Default',
    type: 'light',
    colors: {
      primary: '#6200ee',
      primaryContainer: '#e8def8',
      secondary: '#03dac6',
      secondaryContainer: '#ccdbfc',
      tertiary: '#018786',
      tertiaryContainer: '#b8e5d8',
      error: '#b00020',
      errorContainer: '#f9dedc',
      background: '#ffffff',
      surface: '#ffffff',
      surfaceVariant: '#f5f5f5',
      onSurface: '#000000',
      onSurfaceVariant: '#666666',
      outline: '#c1c1c1',
      outlineVariant: '#e0e0e0',
      cardBackground: '#ffffff',
      textPrimary: '#1a1a1a',
      textSecondary: '#666666',
      textTertiary: '#999999',
      border: '#e0e0e0',
      shadow: '#000000'
    }
  },
  {
    id: 'dark',
    name: 'Dark',
    type: 'dark',
    colors: {
      primary: '#bb86fc',
      primaryContainer: '#3700b3',
      secondary: '#03dac6',
      secondaryContainer: '#018786',
      tertiary: '#03dac6',
      tertiaryContainer: '#018786',
      error: '#cf6679',
      errorContainer: '#b00020',
      background: '#121212',
      surface: '#1e1e1e',
      surfaceVariant: '#2d2d2d',
      onSurface: '#ffffff',
      onSurfaceVariant: '#b3b3b3',
      outline: '#404040',
      outlineVariant: '#2d2d2d',
      cardBackground: '#1e1e1e',
      textPrimary: '#ffffff',
      textSecondary: '#b3b3b3',
      textTertiary: '#808080',
      border: '#404040',
      shadow: '#000000'
    }
  },
  {
    id: 'ocean',
    name: 'Ocean',
    type: 'light',
    colors: {
      primary: '#0066cc',
      primaryContainer: '#e3f2fd',
      secondary: '#00bcd4',
      secondaryContainer: '#b2ebf2',
      tertiary: '#009688',
      tertiaryContainer: '#b2dfdb',
      error: '#f44336',
      errorContainer: '#ffebee',
      background: '#f5f9ff',
      surface: '#ffffff',
      surfaceVariant: '#f0f8ff',
      onSurface: '#1a1a1a',
      onSurfaceVariant: '#666666',
      outline: '#b3d9ff',
      outlineVariant: '#e6f3ff',
      cardBackground: '#ffffff',
      textPrimary: '#1a1a1a',
      textSecondary: '#666666',
      textTertiary: '#999999',
      border: '#b3d9ff',
      shadow: '#000000'
    }
  },
  {
    id: 'sunset',
    name: 'Sunset',
    type: 'light',
    colors: {
      primary: '#ff6b35',
      primaryContainer: '#ffe8e0',
      secondary: '#ffa726',
      secondaryContainer: '#fff3e0',
      tertiary: '#ff7043',
      tertiaryContainer: '#fbe9e7',
      error: '#f44336',
      errorContainer: '#ffebee',
      background: '#fff8f0',
      surface: '#ffffff',
      surfaceVariant: '#fff3e0',
      onSurface: '#1a1a1a',
      onSurfaceVariant: '#666666',
      outline: '#ffccbc',
      outlineVariant: '#ffe0b2',
      cardBackground: '#ffffff',
      textPrimary: '#1a1a1a',
      textSecondary: '#666666',
      textTertiary: '#999999',
      border: '#ffccbc',
      shadow: '#000000'
    }
  },
  {
    id: 'forest',
    name: 'Forest',
    type: 'light',
    colors: {
      primary: '#4caf50',
      primaryContainer: '#e8f5e8',
      secondary: '#8bc34a',
      secondaryContainer: '#f1f8e9',
      tertiary: '#689f38',
      tertiaryContainer: '#f9fbe7',
      error: '#f44336',
      errorContainer: '#ffebee',
      background: '#f5f9f5',
      surface: '#ffffff',
      surfaceVariant: '#f0f8f0',
      onSurface: '#1a1a1a',
      onSurfaceVariant: '#666666',
      outline: '#c8e6c9',
      outlineVariant: '#e8f5e8',
      cardBackground: '#ffffff',
      textPrimary: '#1a1a1a',
      textSecondary: '#666666',
      textTertiary: '#999999',
      border: '#c8e6c9',
      shadow: '#000000'
    }
  }
];

interface ThemeContextType {
  currentTheme: CustomTheme;
  themeType: ThemeType;
  customThemes: CustomTheme[];
  setThemeType: (type: ThemeType) => void;
  setCurrentTheme: (theme: CustomTheme) => void;
  addCustomTheme: (theme: CustomTheme) => void;
  removeCustomTheme: (themeId: string) => void;
  isDarkMode: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themeType, setThemeType] = useState<ThemeType>('light');
  const [currentTheme, setCurrentTheme] = useState<CustomTheme>(defaultThemes[0]);
  const [customThemes, setCustomThemes] = useState<CustomTheme[]>([]);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    loadThemeSettings();
  }, []);

  useEffect(() => {
    saveThemeSettings();
  }, [themeType, currentTheme, customThemes]);

  useEffect(() => {
    updateDarkMode();
  }, [themeType, currentTheme]);

  const loadThemeSettings = async () => {
    try {
      const savedThemeType = await AsyncStorage.getItem('themeType');
      const savedThemeId = await AsyncStorage.getItem('currentThemeId');
      const savedCustomThemes = await AsyncStorage.getItem('customThemes');

      if (savedThemeType) {
        setThemeType(savedThemeType as ThemeType);
      }

      if (savedCustomThemes) {
        setCustomThemes(JSON.parse(savedCustomThemes));
      }

      if (savedThemeId) {
        const allThemes = [...defaultThemes, ...customThemes];
        const theme = allThemes.find(t => t.id === savedThemeId);
        if (theme) {
          setCurrentTheme(theme);
        }
      }
    } catch (error) {
      console.error('Error loading theme settings:', error);
    }
  };

  const saveThemeSettings = async () => {
    try {
      await AsyncStorage.setItem('themeType', themeType);
      await AsyncStorage.setItem('currentThemeId', currentTheme.id);
      await AsyncStorage.setItem('customThemes', JSON.stringify(customThemes));
    } catch (error) {
      console.error('Error saving theme settings:', error);
    }
  };

  const updateDarkMode = () => {
    if (themeType === 'auto') {
      // For now, default to light mode in auto
      // In a real app, you'd check system preferences
      setIsDarkMode(false);
    } else {
      setIsDarkMode(themeType === 'dark');
    }
  };

  const handleSetThemeType = (type: ThemeType) => {
    setThemeType(type);
  };

  const handleSetCurrentTheme = (theme: CustomTheme) => {
    setCurrentTheme(theme);
  };

  const addCustomTheme = (theme: CustomTheme) => {
    setCustomThemes(prev => [...prev, theme]);
  };

  const removeCustomTheme = (themeId: string) => {
    setCustomThemes(prev => prev.filter(t => t.id !== themeId));
    if (currentTheme.id === themeId) {
      setCurrentTheme(defaultThemes[0]);
    }
  };

  const value: ThemeContextType = {
    currentTheme,
    themeType,
    customThemes,
    setThemeType: handleSetThemeType,
    setCurrentTheme: handleSetCurrentTheme,
    addCustomTheme,
    removeCustomTheme,
    isDarkMode
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}; 