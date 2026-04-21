import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

type FontFamily = 'Inter' | 'JetBrains Mono' | 'FiraCode' | 'Playfair Display' | 'EB Garamond';

interface SettingsState {
  fontFamily: FontFamily;
  fontSize: number;
  lineHeight: number;
  appTheme: 'light' | 'dark';
  readerTheme: 'light' | 'dark';
  setFontFamily: (font: FontFamily) => void;
  setFontSize: (size: number) => void;
  setLineHeight: (height: number) => void;
  toggleAppTheme: () => void;
  toggleReaderTheme: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      fontFamily: 'EB Garamond',
      fontSize: 18,
      lineHeight: 1.6,
      appTheme: 'light',
      readerTheme: 'light',
      setFontFamily: (fontFamily) => set({ fontFamily }),
      setFontSize: (fontSize) => set({ fontSize }),
      setLineHeight: (lineHeight) => set({ lineHeight }),
      toggleAppTheme: () => set((state) => ({ appTheme: state.appTheme === 'light' ? 'dark' : 'light' })),
      toggleReaderTheme: () => set((state) => ({ readerTheme: state.readerTheme === 'light' ? 'dark' : 'light' })),
    }),
    {
      name: 'almanac-settings-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
