"use client";

import * as React from "react";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";
import Confetti from "react-confetti";

const Loading = ({ onComplete }: { onComplete: () => void }) => {
  const [progress, setProgress] = React.useState(0);
  const [showConfetti, setShowConfetti] = React.useState(false);

  React.useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          setShowConfetti(true);
          setTimeout(() => {
            setShowConfetti(false);
            onComplete(); // Call the onComplete callback to transition to the main app
          }, 2000);
          return prev;
        }
        return prev + 20; // Increment progress
      });
    }, 300); // Adjust speed of progress

    return () => clearInterval(timer);
  }, [onComplete]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      {showConfetti && <Confetti />}
      {!showConfetti ? (
        <>
          <h1 className="text-2xl font-bold mb-4">Loading...</h1>
          <Progress value={progress} className="w-[60%]" />
        </>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <h1 className="text-3xl font-bold text-green-600">Welcome back!</h1>
        </motion.div>
      )}
    </div>
  );
};

export default Loading;