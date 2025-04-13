import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { UserData, HabitEntry } from '../types/types';
import { createClient, User } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Add these checks right here
console.log("Supabase URL defined:", !!supabaseUrl);
console.log("Supabase key defined:", !!supabaseAnonKey);
console.log("Supabase URL:", supabaseUrl ? supabaseUrl.substring(0, 10) + "..." : "missing");

const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
    user: User | null;
    isLoading: boolean;
    authError: string | null;
    signUp: (email: string, password: string) => Promise<void>;
    signIn: (email: string, password: string) => Promise<void>;
    signOut: () => Promise<void>;
    syncEntriesToSupabase: () => Promise<void>;
    fetchEntriesFromSupabase: () => Promise<void>;
    deleteEntryFromSupabase: (id: string) => Promise<void>;
    updateUserProfile: (overrideData?: Partial<UserData>) => Promise<unknown>; // Using unknown instead of any
}

const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
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
      user: null,
      isLoading: false,
      authError: null,

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

        // Optionally sync to Supabase after adding locally
        if (get().user) {
          get().syncEntriesToSupabase();
        }

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

      signUp: async (email, password) => {
        set({ isLoading: true, authError: null });
        try {
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
          });
          
          if (error) throw error;
          
          set({ user: data.user });
          
          // Create profile for the new user
          if (data.user) {
            const { weight, height, age, activityLevel, goal, bmr, petStatus } = get();
            
            const { error: profileError } = await supabase
              .from('user_profile')  // Using your existing table name
              .insert({
                user_id: data.user.id,
                email: email,
                weight: weight,
                height: height,
                age: age,
                activity_level: activityLevel,
                goal: goal,
                bmr: bmr,
                pet_status: petStatus,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              });
              
            if (profileError) console.error('Error creating profile:', profileError);
          }
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
          set({ authError: errorMessage });
          console.error('Error signing up:', error);
        } finally {
          set({ isLoading: false });
        }
      },
      signIn: async (email, password) => {
        set({ isLoading: true, authError: null });
        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          
          if (error) throw error;
          
          set({ user: data.user });
          
          // Fetch user profile after login
          const { data: profileData } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('user_id', data.user.id)
            .single();
            
          if (profileData) {
            // Update store with profile data
            set({
              weight: profileData.weight,
              height: profileData.height,
              age: profileData.age,
              activityLevel: profileData.activity_level,
              goal: profileData.goal,
              bmr: profileData.bmr,
              petStatus: profileData.pet_status
            });
          }
          
          // Fetch entries from Supabase
          get().fetchEntriesFromSupabase();
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
          set({ authError: errorMessage });
          console.error('Error signing in:', error);
        } finally {
          set({ isLoading: false });
        }
      },

      signOut: async () => {
        set({ isLoading: true });
        try {
          const { error } = await supabase.auth.signOut();
          if (error) throw error;
          set({ user: null });
        } catch (error) {
          console.error('Error signing out:', error);
        } finally {
          set({ isLoading: false });
        }
      },

      syncEntriesToSupabase: async () => {
        const { user, entries } = get();
        if (!user) return;

        set({ isLoading: true });
        try {
          // Add this to the sync function
          const { data: sessionData } = await supabase.auth.getSession();
          console.log("Current session:", sessionData.session);
          if (!sessionData.session) {
            console.error("No active session found!");
            alert("You need to be logged in to sync data");
            return;
          }

          // First, delete all entries for this user
          await supabase
            .from('habit_entries')
            .delete()
            .eq('user_id', user.id);
          
          // Then insert all current entries
          if (entries.length > 0) {
            const entriesToInsert = entries.map(entry => ({
              ...entry,
              user_id: user.id
            }));
            
            const { error } = await supabase
              .from('habit_entries')
              .insert(entriesToInsert);
              
            if (error) throw error;
          }
        } catch (error) {
          console.error('Error syncing to Supabase:', error);
        } finally {
          set({ isLoading: false });
        }
      },

      fetchEntriesFromSupabase: async () => {
        const { user } = get();
        if (!user) return;

        set({ isLoading: true });
        try {
          const { data, error } = await supabase
            .from('habit_entries')
            .select('*')
            .eq('user_id', user.id)
            .order('date', { ascending: false });
            
          if (error) throw error;
          
          // Calculate total calories for today only
          const today = new Date().toLocaleDateString();
          const todaysEntries = (data || []).filter(
            (e) => new Date(e.date).toLocaleDateString() === today && e.visible !== false
          );
          
          const totalCalories = todaysEntries.reduce(
            (sum, e) => sum + e.calories, 
            0
          );
          
          set({ 
            entries: data || [],
            totalCalories
          });
        } catch (error) {
          console.error('Error fetching from Supabase:', error);
        } finally {
          set({ isLoading: false });
        }
      },

      deleteEntryFromSupabase: async (id) => {
        const { user } = get();
        if (!user) return;

        set({ isLoading: true });
        try {
          const { error } = await supabase
            .from('habit_entries')
            .delete()
            .eq('id', id)
            .eq('user_id', user.id);
            
          if (error) throw error;
          
          // Update local state
          set(state => ({
            entries: state.entries.filter(entry => entry.id !== id)
          }));
          
          // Recalculate total calories
          get().fetchEntriesFromSupabase();
        } catch (error) {
          console.error('Error deleting from Supabase:', error);
        } finally {
          set({ isLoading: false });
        }
      },

      updateUserProfile: async (overrideData?: Partial<UserData>) => {
        const { user } = get();
        if (!user) {
          console.error("No user logged in");
          throw new Error("You must be logged in to update your profile");
        }
        
        // Get the current session to verify authentication
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          throw new Error("Session expired. Please log in again.");
        }
        
        // Log for debugging
        console.log("Function user ID:", user.id);
        console.log("Session user ID:", session.user.id);
        
        try {
          set({ isLoading: true });
          
          // Log debugging info
          console.log("Current user:", user);
          console.log("Data to update:", overrideData || "using store data");
          
          // Use override data if provided, otherwise use current state
          const state = get();
          const dataToUpdate = overrideData || {
            weight: state.weight,
            height: state.height,
            age: state.age,
            activityLevel: state.activityLevel,
            goal: state.goal,
            bmr: state.bmr,
            petStatus: state.petStatus
          };
          
          // Check if user profile exists first
          const { data: existingProfile, error: checkError } = await supabase
            .from('user_profiles')
            .select('id')
            .eq('user_id', user.id)
            .maybeSingle();
            
          if (checkError) {
            console.error("Error checking profile:", checkError);
            throw new Error(`Database check failed: ${checkError.message}`);
          }
          
          let result;
          
          // Prepare the data object
          const profileData: {
            user_id: string;
            email: string | undefined;
            weight: number | null | undefined;
            height: number | null | undefined;
            age: number | null | undefined;
            activity_level: 'Sedentary' | 'Light' | 'Moderate' | 'Active' | undefined;
            goal: 'cut' | 'bulk' | undefined;
            bmr: number | undefined;
            pet_status: string;
            updated_at: string;
            created_at?: string;
          } = {
            user_id: session.user.id, // Use session.user.id instead of user.id
            email: user.email,
            weight: dataToUpdate.weight,
            height: dataToUpdate.height,
            age: dataToUpdate.age,
            activity_level: dataToUpdate.activityLevel,
            goal: dataToUpdate.goal,
            bmr: dataToUpdate.bmr,
            pet_status: dataToUpdate.petStatus || state.petStatus,
            updated_at: new Date().toISOString()
          };
          
          // If profile exists, update it; otherwise insert new one
          if (existingProfile) {
            console.log("Updating existing profile");
            result = await supabase
              .from('user_profiles')
              .update(profileData)
              .eq('user_id', user.id);
          } else {
            console.log("Creating new profile");
            profileData.created_at = new Date().toISOString();
            result = await supabase
              .from('user_profiles')
              .insert(profileData);
          }
          
          // Check for errors
          if (result.error) {
            console.error("Supabase error:", result.error);
            throw new Error(result.error.message || "Failed to update profile");
          }
          
          console.log("Profile updated successfully:", result.data);
          return result.data;
        } catch (error: unknown) {
          console.error("Error in updateUserProfile:", error);
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },
    }),
    {
      name: 'habit-store',
    }
  )
);

export default useStore;