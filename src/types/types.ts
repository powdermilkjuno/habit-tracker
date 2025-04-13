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
    visible?: boolean;
    type: 'food';
}
    
export interface ExerciseEntry {
    id: string;
    name: string;
    caloriesBurned: number;
    calories: number; // Add this to match FoodEntry
    duration: number;  // in minutes
    date: string;
    visible?: boolean;
    type: 'exercise';
}
    
export type HabitEntry = FoodEntry | ExerciseEntry;