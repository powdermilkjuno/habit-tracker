import React from 'react';
import useStore from '../stores/useStore';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

const TotalCalories = () => {
  // Use separate selectors for each value
  const totalCalories = useStore(state => state.totalCalories);
  const bmr = useStore(state => state.bmr);
  const goal = useStore(state => state.goal);

  const caloriesDifference = totalCalories - bmr;
  const isOverBMR = caloriesDifference > 0;
  
  // Changed to use 'cut' and 'bulk' to match your store values
  const isOnTrack = (goal === 'cut' && !isOverBMR) || 
                   (goal === 'bulk' && isOverBMR);
  
  // Set color based on whether we're on track
  const statusColor = isOnTrack ? 'text-green-600' : 'text-red-600';
  
  // Format the difference message
  const differenceMessage = isOverBMR 
    ? `${Math.abs(caloriesDifference)} calories OVER` 
    : `${Math.abs(caloriesDifference)} calories UNDER`;

  // Format the goal text for display (convert 'cut' to 'cutting' for UI)
  const goalText = goal === 'cut' ? 'cutting' : 'bulking';

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-center text-xl font-bold text-gray-800 dark:text-gray-200">
          Total Calories for Today
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-lg text-center text-gray-600">
          {totalCalories > 0 ? (
            <>
              You&apos;ve consumed <strong>{totalCalories} calories</strong> today.
              <div className="mt-2">
                <span>Your BMR is <strong>{bmr} calories</strong></span>
                <div className={`font-bold ${statusColor} mt-1`}>
                  You are {differenceMessage} your BMR
                  {goal && ` (${goalText})`}
                </div>
              </div>
            </>
          ) : (
            <span className="text-gray-500">No calories logged yet for today!</span>
          )}
        </p>
      </CardContent>
    </Card>
  );
};

export default TotalCalories;