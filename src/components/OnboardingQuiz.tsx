// components/OnboardingQuiz.tsx
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useStore from '../stores/useStore';
import { calculateBMR, ActivityLevel } from '../lib/calculations'; // Import your BMR calculation function and ActivityLevel type
import HabitForm from './HabitForm'; // Import the main screen component
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client (consider moving to a shared file)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const questions = [
  {
    id: 1,
    text: "Welcome! Let's set up your profile. What's your weight (lbs)?",
    key: 'weight',
    type: 'number',
  },
  {
    id: 2,
    text: "What's your height (inches)?",
    key: 'height',
    type: 'number',
  },
  {
    id: 3,
    text: "What's your age?",
    key: 'age',
    type: 'number',
  },
  {
    id: 4,
    text: "What's your exercise level?",
    key: 'activityLevel',
    type: 'select',
    options: ['Sedentary', 'Light', 'Moderate', 'Active'],
  },
  {
    id: 5,
    text: "Choose your goal:",
    key: 'goal',
    type: 'select',
    options: ['Cut', 'Bulk'],
  },
];

export default function OnboardingQuiz() {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | number | undefined>>({});
  const [inputValue, setInputValue] = useState<string | number>('');
  const [showMainScreen, setShowMainScreen] = useState(false);
  const { setUserData, entries, user } = useStore(); // Add user from store
  const [saveError, setSaveError] = useState<string | null>(null);

  const handleAnswer = () => {
    const currentQuestion = questions[currentStep];
    const newAnswers = { ...answers, [currentQuestion.key]: inputValue };
    setAnswers(newAnswers);

    if (currentStep < questions.length - 1) {
      setInputValue(''); // Clear input for the next question
      setTimeout(() => setCurrentStep((prev) => prev + 1), 500);
    } else {
      handleSubmit(newAnswers);
    }
  };

  const handleSubmit = async (newAnswers: Record<string, string | number | undefined>) => {
    // First, make sure activityLevelValue is a valid ActivityLevel
    const isValidActivityLevel = (value: string): value is ActivityLevel => {
      return ['Sedentary', 'Light', 'Moderate', 'Active'].includes(value);
    };

    // Use type assertion with validation
    const activityLevelValue = isValidActivityLevel(String(newAnswers.activityLevel)) 
      ? (String(newAnswers.activityLevel) as ActivityLevel) 
      : 'Sedentary' as ActivityLevel; // Fallback to Sedentary if invalid

    // Get the goal as string and convert to lowercase
    const goalValue = String(newAnswers.goal).toLowerCase() as 'cut' | 'bulk';

    const bmr = calculateBMR(
      Number(newAnswers.weight), 
      Number(newAnswers.height),
      Number(newAnswers.age), 
      activityLevelValue
    );
    
    // Create the user data object
    const userData = {
      weight: Number(newAnswers.weight),
      height: Number(newAnswers.height),
      age: Number(newAnswers.age),
      activityLevel: activityLevelValue,
      goal: goalValue,
      bmr: bmr,
      petStatus: 'egg' as 'egg' | 'weak' | 'healthy'
    };
    
    // Save to local Zustand store
    setUserData(userData);
    
    // If user is logged in, save to Supabase
    if (user) {
      try {
        // Check if profile exists first
        const { data: existingProfile } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();
          
        if (existingProfile) {
          // Update existing profile
          const { error } = await supabase
            .from('user_profiles')
            .update({
              weight: Number(newAnswers.weight),
              height: Number(newAnswers.height),
              age: Number(newAnswers.age),
              activity_level: activityLevelValue,
              goal: goalValue,
              bmr: bmr,
              pet_status: 'egg',
              updated_at: new Date().toISOString()
            })
            .eq('user_id', user.id);
            
          if (error) throw error;
        } else {
          // Insert new profile
          const { error } = await supabase
            .from('user_profiles')
            .insert([
              {
                user_id: user.id,
                weight: Number(newAnswers.weight),
                height: Number(newAnswers.height),
                age: Number(newAnswers.age),
                activity_level: activityLevelValue,
                goal: goalValue,
                bmr: bmr,
                pet_status: 'egg',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              }
            ]);
            
          if (error) throw error;
        }
        
        console.log('User profile saved to Supabase successfully');
      } catch (error: unknown) {
        console.error('Error saving user profile to Supabase:', error);
        setSaveError('Failed to save your profile to the cloud.');
      }
    }
    
    // Continue to main screen
    setTimeout(() => setShowMainScreen(true), 1000);
  };

  const calculateDailyCalories = () => {
    const totalCalories = entries.reduce((sum, entry) => sum + entry.calories, 0);
    const bmr = Number(answers.bmr) || 0;
    const difference = totalCalories - bmr;

    return {
      totalCalories,
      bmr,
      difference,
    };
  };

  if (showMainScreen) {
    const { totalCalories, bmr, difference } = calculateDailyCalories();

    return (
      <div className="min-h-screen bg-gray-50 p-6">
        {saveError && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
            <p className="text-red-700">{saveError}</p>
          </div>
        )}
        <h1 className="text-3xl font-bold text-center mb-4">Your Dashboard</h1>
        <p className="text-center text-lg mb-6">
          Your BMR is <strong>{bmr} calories</strong>. You&apos;ve consumed{' '}
          <strong>{totalCalories} calories</strong> today.{' '}
          {difference > 0 ? (
            <span className="text-green-600">You&apos;re over by {difference} calories.</span>
          ) : (
            <span className="text-red-600">You&apos;re under by {Math.abs(difference)} calories.</span>
          )}
        </p>
        <HabitForm />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
      <AnimatePresence mode="wait">
        <motion.div
          key={questions[currentStep].id}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.3 }}
          className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full"
        >
          <div className="mb-6">
            <div className="flex justify-between text-sm text-gray-500 mb-2">
              <span>
                Question {currentStep + 1} of {questions.length}
              </span>
            </div>
            <h2 className="text-2xl font-semibold text-gray-800">
              {questions[currentStep].text}
            </h2>
          </div>

          {questions[currentStep].type === 'number' ? (
  <div>
    <input
      type="number"
      value={inputValue}
      onChange={(e) => setInputValue(Number(e.target.value))}
      className="w-full p-3 border rounded-lg mb-4"
      autoFocus
    />
    <button
      onClick={handleAnswer}
      className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
    >
      Submit
    </button>
  </div>
) : (
  <div className="grid gap-3">
    {questions[currentStep].options?.map((option) => (
      <button
        key={option}
        onClick={() => {
          setInputValue(option);
          handleAnswer();
        }}
        className="p-3 text-left rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors"
      >
        {option}
      </button>
    ))}
  </div>
)}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}