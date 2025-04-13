import { useState } from 'react';
import { useRouter } from 'next/router';
import useStore from '../stores/useStore';
import { calculateBMR } from '../lib/calculations';

export default function EditProfile() {
  const router = useRouter();
  const { weight, height, age, activityLevel, goal, setUserData, clearHistory } = useStore(); // Access clearHistory from the store
  const [formData, setFormData] = useState({
    weight: weight || '',
    height: height || '',
    age: age || '',
    activityLevel: activityLevel || 'Sedentary',
    goal: goal || 'cut',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Save updated data to Zustand
    setUserData({
      weight: Number(formData.weight),
      height: Number(formData.height),
      age: Number(formData.age),
      activityLevel: formData.activityLevel,
      goal: formData.goal,
      bmr: calculateBMR(Number(formData.weight), Number(formData.height), Number(formData.age), formData.activityLevel),
    });

    // Redirect to the main page
    router.push('/');
  };

  const handleRetakeQuiz = () => {
    // Clear user data and redirect to the onboarding quiz
    setUserData({
      weight: 0,
      height: 0,
      age: 0,
      activityLevel: 'Sedentary',
      goal: 'cut',
      bmr: 0,
    });
    router.push('/');
  };

  const handleClearHistory = () => {
    clearHistory(); // Call clearHistory to reset entries and totalCalories
    alert('History cleared successfully!');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <h1 className="text-2xl font-bold text-center mb-6">Edit Profile</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Weight Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Weight (lbs)</label>
            <input
              type="number"
              name="weight"
              value={formData.weight}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              required
            />
          </div>

          {/* Height Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Height (inches)</label>
            <input
              type="number"
              name="height"
              value={formData.height}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              required
            />
          </div>

          {/* Age Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Age</label>
            <input
              type="number"
              name="age"
              value={formData.age}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              required
            />
          </div>

          {/* Activity Level Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Activity Level</label>
            <select
              name="activityLevel"
              value={formData.activityLevel}
              onChange={handleChange}
              className="w-full p-2 border rounded"
            >
              <option value="Sedentary">Sedentary</option>
              <option value="Light">Light</option>
              <option value="Moderate">Moderate</option>
              <option value="Active">Active</option>
            </select>
          </div>

          {/* Goal Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Goal</label>
            <select
              name="goal"
              value={formData.goal}
              onChange={handleChange}
              className="w-full p-2 border rounded"
            >
              <option value="cut">Cut</option>
              <option value="bulk">Bulk</option>
            </select>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Save Changes
          </button>
        </form>

        {/* Retake Quiz Button */}
        <button
          onClick={handleRetakeQuiz}
          className="w-full mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Retake Quiz
        </button>

        {/* Clear History Button */}
        <button
          onClick={handleClearHistory}
          className="w-full mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Clear History
        </button>
      </div>
    </div>
  );
}