import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

type FontFamily = 'Inter' | 'JetBrains Mono' | 'FiraCode' | 'Playfair Display' | 'EB Garamond';

interface SettingsState {
  fontFamily: FontFamily;
  fontSize: number;
  lineHeight: number;
  theme: 'light' | 'dark';
  setFontFamily: (font: FontFamily) => void;
  setFontSize: (size: number) => void;
  setLineHeight: (height: number) => void;
  toggleTheme: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      fontFamily: 'EB Garamond', // Default to imperialistic font
      fontSize: 18, // slightly larger for elegant readability
      lineHeight: 1.6,
      theme: 'light',
      setFontFamily: (fontFamily) => set({ fontFamily }),
      setFontSize: (fontSize) => set({ fontSize }),
      setLineHeight: (lineHeight) => set({ lineHeight }),
      toggleTheme: () => set((state) => ({ theme: state.theme === 'light' ? 'dark' : 'light' })),
    }),
    {
      name: 'almanac-settings-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
