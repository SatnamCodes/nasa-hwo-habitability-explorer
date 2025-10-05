import React, { createContext, useMemo, useState, useContext, ReactNode, useEffect } from 'react';
import { ThemeProvider, createTheme, Theme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';

interface ColorModeValue {
  mode: 'light' | 'dark';
  toggleColorMode: () => void;
  theme: Theme;
}

const ColorModeContext = createContext<ColorModeValue | undefined>(undefined);

const lightPalette = {
  mode: 'light' as const,
  primary: { main: '#000000' },
  secondary: { main: '#007AFF' },
  background: { default: '#ffffff', paper: '#fafafa' },
  divider: '#e5e5e7'
};

const darkPalette = {
  mode: 'dark' as const,
  primary: { main: '#ffffff' },
  secondary: { main: '#4DA3FF' },
  background: { default: '#0e1116', paper: '#161b22' },
  divider: 'rgba(255,255,255,0.12)'
};

const commonThemeOptions = {
  shape: { borderRadius: 12 },
  typography: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: { transition: 'background-color .3s, box-shadow .3s' }
      }
    },
    MuiAppBar: { styleOverrides: { root: { transition: 'background-color .3s' } } },
  }
};

export const ColorModeProvider = ({ children }: { children: ReactNode }) => {
  const prefersDark = useMediaQuery('(prefers-color-scheme: dark)');
  const [mode, setMode] = useState<'light' | 'dark'>(() => {
    const stored = typeof window !== 'undefined' ? localStorage.getItem('color-mode') : null;
    return (stored === 'light' || stored === 'dark') ? stored : (prefersDark ? 'dark' : 'light');
  });

  useEffect(() => {
    localStorage.setItem('color-mode', mode);
    document.documentElement.dataset.colorMode = mode;
  }, [mode]);

  const toggleColorMode = () => setMode(prev => prev === 'light' ? 'dark' : 'light');

  const theme = useMemo(() => createTheme({
    palette: mode === 'light' ? lightPalette : darkPalette,
    ...commonThemeOptions,
    components: {
      ...commonThemeOptions.components,
      MuiCard: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            backgroundColor: mode === 'light' ? '#ffffff' : '#1e242c',
            border: mode === 'light' ? '1px solid #f0f0f0' : '1px solid rgba(255,255,255,0.08)',
            boxShadow: mode === 'light' ? '0 2px 8px rgba(0,0,0,0.08)' : '0 4px 16px rgba(0,0,0,0.5)'
          }
        }
      }
    }
  }), [mode]);

  const value: ColorModeValue = { mode, toggleColorMode, theme };

  return (
    <ColorModeContext.Provider value={value}>
      <ThemeProvider theme={theme}>{children}</ThemeProvider>
    </ColorModeContext.Provider>
  );
};

export const useColorMode = () => {
  const ctx = useContext(ColorModeContext);
  if (!ctx) throw new Error('useColorMode must be used within ColorModeProvider');
  return ctx;
};
