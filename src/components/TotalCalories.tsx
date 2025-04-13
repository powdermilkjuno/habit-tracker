import React from 'react';
import useStore from '../stores/useStore';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

const TotalCalories = () => {
  const totalCalories = useStore((state) => state.totalCalories);

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-center text-xl font-bold text-gray-800">
          Total Calories for Today
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-lg text-center text-gray-600">
          {totalCalories > 0 ? (
            <>
              You&apos;ve consumed <strong>{totalCalories} calories</strong> today.
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