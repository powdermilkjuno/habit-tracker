import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import OnboardingQuiz from '../components/OnboardingQuiz';
import PetDisplay from '../components/PetDisplay';
import HabitForm from '../components/HabitForm';
import TotalCalories from '../components/TotalCalories'; // Import TotalCalories component
import useStore from '../stores/useStore';
import Loading from "../components/Loading";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import Link from 'next/link'; // Import Link from Next.js
import { FaUserFriends } from 'react-icons/fa'; // Import friends icon
import ThemeToggle from '@/components/ThemeToggle';

export default function App() {
  const [isLoading, setIsLoading] = useState(true);

  const handleLoadingComplete = () => {
    setIsLoading(false);
  };

  return (
    <>
      {isLoading ? (
        <Loading onComplete={handleLoadingComplete} />
      ) : (
        <HomePage />
      )}
    </>
  );
}

function HomePage() {
  const { weight, height, calculateBMR } = useStore();

  useEffect(() => {
    if (weight && height) calculateBMR();
  }, [weight, height, calculateBMR]);

  return (
    <div className="min-h-screen bg-background py-8 px-4 relative">
      {/* Top right navigation icons */}
      <div className="absolute top-4 right-4 flex items-center space-x-4">
        {/* Friends Icon */}
        <Link href="/friends-list">
          <div className="bg-white p-2 rounded-full shadow cursor-pointer hover:bg-gray-100 transition-colors">
            <FaUserFriends className="text-gray-700 text-xl" />
          </div>
        </Link>

        {/* Avatar Button */}
        <ThemeToggle />
        <Link href="/edit-profile">
          <Avatar className="cursor-pointer">
            <AvatarImage src="/path-to-avatar-image.jpg" alt="User Avatar" />
            <AvatarFallback>U</AvatarFallback>
          </Avatar>
        </Link>
      </div>

      <AnimatePresence mode="wait">
        {!weight ? (
          <OnboardingQuiz />
        ) : (
          <motion.div
            key="main-app"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="max-w-7xl mx-auto"
          >
            <h1 className="text-3xl font-bold text-center mb-8">
              Last Meal Protocol Club
            </h1>

            {/* Row layout container */}
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Left column - PetDisplay */}
              <div className="lg:w-1/3 p-4">
                <PetDisplay />
              </div>
              
              {/* Right column - TotalCalories and HabitForm */}
                <div className="lg:w-2/3 p-4 space-y-6 lg:pl-8">
                <TotalCalories />
                <HabitForm />
                </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
    </div>
  );
}