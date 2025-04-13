// Define a type for the allowed activity levels and export it
export type ActivityLevel = 'Sedentary' | 'Light' | 'Moderate' | 'Active';

// Updated function to accept age as a parameter
export const calculateBMR = (weight: number, height: number, age: number, activityLevel: ActivityLevel): number => {
  // Convert pounds to kilograms and inches to centimeters
  const weightInKg = weight * 0.453592;
  const heightInCm = height * 2.54;

  // Updated formula to use the provided age parameter instead of hardcoded value
  const baseBMR = 10 * weightInKg + 6.25 * heightInCm - 5 * age + 5; // Use age parameter
  const activityMultiplier = {
    Sedentary: 1.2,
    Light: 1.375,
    Moderate: 1.55,
    Active: 1.725,
  };
  
  return Math.round(baseBMR * activityMultiplier[activityLevel]);
};