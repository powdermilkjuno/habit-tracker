import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { UserData, HabitEntry } from '../types/types';
import { createClient, User } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper function for friend codes
const generateFriendCode = () => {
  return 'F' + Math.floor(100000 + Math.random() * 900000).toString();
};

// Create store type definition
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
    friends: { id: string; email?: string; friendCode?: string }[];
    fetchFriends: () => Promise<void>;
    addFriend: (friendCode: string) => Promise<boolean>;
    removeFriend: (friendId: string) => Promise<void>;
    getUserFriendCode: () => Promise<string | null>;
}

// Create a helper function to check if we're on the client side
const isClient = typeof window !== 'undefined';

// Create your store with SSR-safe configuration
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
      friends: [],

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
            
            // Generate a unique friend code for the new user
            const friendCode = generateFriendCode();
            
            const { error: profileError } = await supabase
              .from('user_profiles') // CORRECTED: using 'user_profiles' (plural)
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
                friend_code: friendCode, // Adding the generated friend code
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              });
              
            if (profileError) {
              console.error('Error creating profile:', profileError);
              // You might want to handle duplicate friend code (very unlikely but possible)
              if (profileError.code === '23505' && profileError.message.includes('friend_code')) {
                // If this happens, you could retry with a new code, but it's extremely rare
                console.error('Friend code collision detected, please try again');
              }
            } else {
              console.log('Profile created with friend code:', friendCode);
            }
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

      fetchFriends: async () => {
        const { user } = get();
        if (!user) return;
        
        try {
          // Get friends relationships
          const { data: friendRelations, error } = await supabase
            .from('friends')
            .select('friend_id')
            .eq('user_id', user.id);
            
          if (error) throw error;
          
          if (friendRelations && friendRelations.length > 0) {
            // Extract friend IDs
            const friendIds = friendRelations.map(relation => relation.friend_id);
            
            // Get friend profiles specifically from user_profiles
            const { data: friendProfiles, error: profileError } = await supabase
              .from('user_profiles')
              .select('user_id, email, friend_code')
              .in('user_id', friendIds);
              
            if (profileError) throw profileError;
            
            // Format friends data
            const formattedFriends = friendProfiles.map(profile => ({
              id: profile.user_id,
              email: profile.email,
              friendCode: profile.friend_code
            }));
            
            set({ friends: formattedFriends });
          } else {
            set({ friends: [] });
          }
        } catch (error) {
          console.error('Error fetching friends:', error);
        }
      },
      
      addFriend: async (friendCode: string) => {
        const { user } = get();
        if (!user) {
          throw new Error('You must be logged in to add friends');
        }
        
        try {
          // Normalize the friend code - trim whitespace and uppercase
          const normalizedFriendCode = friendCode.trim().toUpperCase();
          
          console.log("Looking for friend code:", normalizedFriendCode);
          
          // FIRST APPROACH: Direct query with exact match
          const { data: directMatch, error: directError } = await supabase
            .from('user_profiles')
            .select('user_id, email, friend_code')
            .eq('friend_code', normalizedFriendCode)
            .single();
            
          console.log("Direct query result:", directMatch, directError);
          
          // If direct match worked, use it
          if (directMatch && !directError) {
            console.log("Found direct match:", directMatch);
            
            // Rest of the code for adding friend...
            const friendId = directMatch.user_id;
            
            // Prevent adding yourself
            if (friendId === user.id) {
              throw new Error('You cannot add yourself as a friend');
            }
            
            // Check if already friends
            const { data: existingFriend } = await supabase
              .from('friends')
              .select()
              .eq('user_id', user.id)
              .eq('friend_id', friendId)
              .maybeSingle();
              
            if (existingFriend) {
              throw new Error('Already in your friends list');
            }
            
            // Add friend relationship
            const { error: insertError } = await supabase
              .from('friends')
              .insert({
                user_id: user.id,
                friend_id: friendId
              });
              
            if (insertError) throw insertError;
            
            // Update local friends list
            set(state => ({
              friends: [
                ...state.friends,
                { id: friendId, email: directMatch.email, friendCode: directMatch.friend_code }
              ]
            }));
            
            return true;
          }
          
          // SECOND APPROACH: Get all profiles and compare
          console.log("Direct match failed, trying case-insensitive search...");
          const { data: allProfiles, error: profilesError } = await supabase
            .from('user_profiles')
            .select('user_id, email, friend_code');
            
          if (profilesError) {
            console.error("Error fetching profiles:", profilesError);
            throw new Error("Failed to search for friend code");
          }
          
          // DEBUG: Log all friend codes for debugging
          console.log("Available friend codes:", 
            allProfiles?.map(p => p.friend_code?.trim()) || []);
            
          // Enhanced matching logic with better debugging and flexibility
          let friendUser = null;
          
          // Try multiple matching approaches
          for (const profile of allProfiles || []) {
            if (!profile.friend_code) continue;
            
            // Debug each comparison
            console.log(`Comparing: '${profile.friend_code.toUpperCase()}' vs '${normalizedFriendCode}'`);
            
            // Try exact match (case insensitive)
            if (profile.friend_code.toUpperCase() === normalizedFriendCode) {
              console.log("Found match:", profile);
              friendUser = profile;
              break;
            }
            
            // Try without spaces
            if (profile.friend_code.toUpperCase().replace(/\s/g, '') === 
                normalizedFriendCode.replace(/\s/g, '')) {
              console.log("Found match (ignoring spaces):", profile);
              friendUser = profile;
              break;
            }
          }
          
          if (!friendUser) {
            throw new Error('User not found with that friend code');
          }
          
          const friendId = friendUser.user_id;
          
          // Rest of your code (identical to the first approach)
          // Prevent adding yourself
          if (friendId === user.id) {
            throw new Error('You cannot add yourself as a friend');
          }
          
          // Check if already friends
          const { data: existingFriend } = await supabase
            .from('friends')
            .select()
            .eq('user_id', user.id)
            .eq('friend_id', friendId)
            .maybeSingle();
            
          if (existingFriend) {
            throw new Error('Already in your friends list');
          }
          
          // Add friend relationship
          const { error: insertError } = await supabase
            .from('friends')
            .insert({
              user_id: user.id,
              friend_id: friendId
            });
            
          if (insertError) throw insertError;
          
          // Update local friends list
          set(state => ({
            friends: [
              ...state.friends,
              { id: friendId, email: friendUser.email, friendCode: friendUser.friend_code }
            ]
          }));
          
          return true;
        } catch (error: unknown) {
          console.error('Error adding friend:', error);
          throw error;
        }
      },
      
      removeFriend: async (friendId: string) => {
        const { user } = get();
        if (!user) return;
        
        try {
          const { error } = await supabase
            .from('friends')
            .delete()
            .eq('user_id', user.id)
            .eq('friend_id', friendId);
            
          if (error) throw error;
          
          // Update local state
          set(state => ({
            friends: state.friends.filter(friend => friend.id !== friendId)
          }));
        } catch (error) {
          console.error('Error removing friend:', error);
        }
      },

      getUserFriendCode: async () => {
        const { user } = get();
        if (!user) return null;
        
        try {
          const { data, error } = await supabase
            .from('user_profiles')
            .select('friend_code')
            .eq('user_id', user.id)
            .single();
            
          if (error) throw error;
          return data?.friend_code || null;
        } catch (error) {
          console.error('Error getting friend code:', error);
          return null;
        }
      }
    }),
    {
      name: 'habit-store',
      // Make storage SSR-safe
      storage: createJSONStorage(() => (isClient ? localStorage : {
        getItem: () => null,
        setItem: () => {},
        removeItem: () => {}
      }))
    }
  )
);

export default useStore;