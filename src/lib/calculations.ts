export const calculateBMR = (weight: number, height: number, activityLevel: string): number => {
    // Convert pounds to kilograms and inches to centimeters
    const weightInKg = weight * 0.453592;
    const heightInCm = height * 2.54;
  
    const baseBMR = 10 * weightInKg + 6.25 * heightInCm - 5 * 30 + 5; // Simplified formula
    const activityMultiplier = {
      Sedentary: 1.2,
      Light: 1.375,
      Moderate: 1.55,
      Active: 1.725,
    };
    return Math.round(baseBMR * (activityMultiplier[activityLevel] || 1.2));
  };