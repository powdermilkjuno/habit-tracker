import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { UserData, HabitEntry } from '../types/types';

interface StoreState {
    weight: number | null;
    height: number | null;
    age: number | null;
    activityLevel: 'Sedentary' | 'Light' | 'Moderate' | 'Active';
    goal: 'cut' | 'bulk';
    petStatus: string;
    streak: number;
    lastUpdated: string;
    entries: HabitEntry[];
    bmr: number;
    totalCalories: number;
    difference: number;
    setUserData: (data: Partial<UserData>) => void;
    addEntry: (entry: HabitEntry) => void;
    toggleEntryVisibility: (id: string) => void;
    clearHistory: () => void;
    calculateBMR: () => void;
}

const useStore = create<StoreState>()(
  persist(
    (set) => ({
      weight: 0,
      height: 0,
      age: 30,
      activityLevel: 'Sedentary',
      goal: 'cut',
      petStatus: 'egg',
      streak: 0,
      lastUpdated: new Date().toISOString(),
      entries: [],
      bmr: 0,
      totalCalories: 0,
      difference: 0,

      setUserData: (data) => set((state) => ({ ...state, ...data })),

      addEntry: (entry) => set((state) => {
        const updatedEntries = [...state.entries, entry];

        // Get today's date in MM/DD/YYYY format
        const today = new Date().toLocaleDateString();

        // Filter entries for today's date AND visible entries only
        const todaysVisibleEntries = updatedEntries.filter(
          (e) => new Date(e.date).toLocaleDateString() === today && e.visible !== false
        );

        // Calculate total calories for today's visible entries only
        const updatedTotalCalories = todaysVisibleEntries.reduce(
          (sum, e) => sum + e.calories, 
          0
        );

        return {
          entries: updatedEntries,
          totalCalories: updatedTotalCalories,
        };
      }),

      // Add a function to toggle entry visibility
      toggleEntryVisibility: (id) => set((state) => {
        const updatedEntries = state.entries.map(entry => 
          entry.id === id ? { ...entry, visible: !entry.visible } : entry
        );

        // Get today's date in MM/DD/YYYY format
        const today = new Date().toLocaleDateString();

        // Recalculate calories for today's visible entries only
        const todaysVisibleEntries = updatedEntries.filter(
          (e) => new Date(e.date).toLocaleDateString() === today && e.visible !== false
        );

        const updatedTotalCalories = todaysVisibleEntries.reduce(
          (sum, e) => sum + e.calories, 
          0
        );

        return {
          entries: updatedEntries,
          totalCalories: updatedTotalCalories,
        };
      }),

      clearHistory: () => set(() => {
        localStorage.removeItem('habit-store');
        return {
          entries: [],
          totalCalories: 0,
        };
      }),

      calculateBMR: () => set((state) => {
        const bmr = Math.round(
          10 * (state.weight ?? 0) +
          6.25 * (state.height ?? 0) -
          5 * (state.age ?? 0) + 
          (state.goal === 'cut' ? -500 : 500)
        );
        return { bmr };
      }),
    }),
    {
      name: 'habit-store',
    }
  )
);

export default useStore;