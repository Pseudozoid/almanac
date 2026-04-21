import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface GoalsState {
  dailyGoalMinutes: number;
  currentDayMinutes: number;
  lastReadDate: string | null; // ISO Date string YYYY-MM-DD
  streakDays: number;
  setDailyGoal: (minutes: number) => void;
  addReadingTime: (minutes: number) => void;
  checkAndUpdateStreak: () => void;
}

export const useGoalsStore = create<GoalsState>()(
  persist(
    (set, get) => ({
      dailyGoalMinutes: 30, // Default 30 mins
      currentDayMinutes: 0,
      lastReadDate: null,
      streakDays: 0,

      setDailyGoal: (minutes) => set({ dailyGoalMinutes: minutes }),

      addReadingTime: (minutes) => {
        const today = new Date().toISOString().split('T')[0];
        set((state) => {
          if (state.lastReadDate !== today) {
            // New day, reset currentDayMinutes but don't break streak yet (handled by checkAndUpdateStreak)
            return {
              currentDayMinutes: minutes,
              lastReadDate: today,
            };
          }
          return {
            currentDayMinutes: state.currentDayMinutes + minutes,
          };
        });
      },

      checkAndUpdateStreak: () => {
        const state = get();
        if (!state.lastReadDate) return;

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const lastRead = new Date(state.lastReadDate);
        lastRead.setHours(0, 0, 0, 0);

        const diffTime = Math.abs(today.getTime() - lastRead.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays > 1) {
          // Streak broken
          set({ streakDays: 0 });
        } else if (diffDays === 1 && state.currentDayMinutes >= state.dailyGoalMinutes) {
          // Valid streak continuation from yesterday, handled if they read enough yesterday.
          // This logic can be refined based on when the streak actually increments.
          // For now, if they read today and meet the goal, we increment the streak.
        }
      },
    }),
    {
      name: 'almanac-goals-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
