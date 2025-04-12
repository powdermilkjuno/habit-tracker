export interface UserData {
    id?: string;
    weight: number;
    height: number;
    age: number;
    activityLevel: 'Sedentary' | 'Light' | 'Moderate' | 'Active';
    goal: 'cut' | 'bulk';
    petStatus: 'egg' | 'weak' | 'healthy';
    streak: number;
    lastUpdated: string;
    bmr?: number;
  }
  
  export interface FoodEntry {
    id: string;
    name: string;
    calories: number;
    protein: number;
    date: string;
  }
  
  export type HabitEntry = FoodEntry | ExerciseEntry;