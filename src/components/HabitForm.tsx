import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useStore from '../stores/useStore';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { FaEye } from 'react-icons/fa'; // Import eye icon from react-icons
import * as React from "react"
import type { HabitEntry, FoodEntry, ExerciseEntry } from '../types/types'; // Import types from store
 
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"

const HabitForm = () => {
  const [foodName, setFoodName] = useState('');
  const [calories, setCalories] = useState<number | ''>('');
  const [exerciseChecked, setExerciseChecked] = useState(false);
  const [exerciseIntensity, setExerciseIntensity] = useState('low');
  // Get both addEntry and toggleEntryVisibility from the store
  const { addEntry, toggleEntryVisibility } = useStore();

  interface Entry {
    id: string;
    name: string;
    calories: number;
    protein: number;
    date: string;
    visible: boolean; // Changed from "completed" to "visible"
    type: 'food' | 'exercise'; // Add type to distinguish entries
  }

  const [history, setHistory] = useState<Entry[]>(() => {
    // Load history from localStorage on initial render
    const savedHistory = localStorage.getItem('habitHistory');
    return savedHistory ? JSON.parse(savedHistory) : [];
  });

  useEffect(() => {
    // Save history to localStorage whenever it changes
    localStorage.setItem('habitHistory', JSON.stringify(history));
  }, [history]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (foodName && calories) {
      const newEntry: FoodEntry = {
        id: Date.now().toString(),
        name: foodName,
        calories: Number(calories),
        protein: 0,
        date: new Date().toLocaleString(),
        visible: true,
        type: 'food' // Add type to distinguish food entries
      };
      addEntry(newEntry);
      
      // Also add to local history
      setHistory(prev => [...prev, newEntry as Entry]);
    }
    // Fix issues in the exercise submission logic:
    if (exerciseChecked) {
      const exerciseCalories = exerciseIntensity === 'low' ? 100 : exerciseIntensity === 'medium' ? 200 : 300;
      const newEntry: ExerciseEntry = {
        id: Date.now().toString(),
        name: `Exercise (${exerciseIntensity} intensity)`,
        calories: -exerciseCalories, // NEGATIVE calories for exercise
        caloriesBurned: exerciseCalories, // Add this property that's expected in ExerciseEntry
        duration: exerciseIntensity === 'low' ? 30 : exerciseIntensity === 'medium' ? 45 : 60, // Add a default duration based on intensity
        date: new Date().toLocaleString(),
        visible: true,
        type: 'exercise'
      };
      
      // Remove duplicate call - only call addEntry once
      addEntry(newEntry as HabitEntry);
      
      // Add to local history - this was missing
      setHistory(prev => [...prev, {...newEntry, protein: 0} as Entry]);
    }

    // Reset form
    setFoodName('');
    setCalories('');
    setExerciseChecked(false);
    setExerciseIntensity('low');
  };

  const handleEdit = (id: string) => {
    const entryToEdit = history.find((entry) => entry.id === id);
    if (entryToEdit) {
      const isExercise = entryToEdit.type === 'exercise';
      setFoodName(isExercise ? '' : entryToEdit.name);
      setCalories(isExercise ? Math.abs(entryToEdit.calories) : entryToEdit.calories);
      setExerciseChecked(isExercise);
      if (isExercise) {
        const intensity = Math.abs(entryToEdit.calories);
        setExerciseIntensity(
          intensity <= 100 ? 'low' : intensity <= 200 ? 'medium' : 'high'
        );
      }
      setHistory((prev) => prev.filter((entry) => entry.id !== id));
      
      // Remove from global store as well
      toggleEntryVisibility(id);
    }
  };

  const toggleVisibility = (id: string) => {
    // Update local history
    setHistory((prev) =>
      prev.map((entry) =>
        entry.id === id ? { ...entry, visible: !entry.visible } : entry
      )
    );
    
    // Update global store
    toggleEntryVisibility(id);
  };

  return (
    <div className="space-y-6">
      {/* Habit Tracker Card */}
      <Card className="max-w-lg mx-auto">
        <CardHeader>
          <CardTitle>Habit Tracker</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Food Input */}
            <div>
              <label className="block text-sm font-medium text-blue-600">Food</label>
                <div className="flex flex-col gap-4">
                <input
                  type="text"
                  value={foodName}
                  onChange={(e) => setFoodName(e.target.value)}
                  placeholder="Food name..."
                  className="p-2 border rounded text-gray-800 dark:text-gray-200 placeholder-gray-500"
                />
                <AnimatePresence>
                  {foodName && (
                  <motion.input
                    type="number"
                    value={calories}
                    onChange={(e) => setCalories(e.target.value ? Number(e.target.value) : '')}
                    placeholder="Calories"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="p-2 border rounded text-gray-800 dark:text-gray-200 placeholder-gray-500"
                  />
                  )}
                </AnimatePresence>
                </div>
            </div>

            {/* Exercise Input */}
            <div>
              <label className="block text-sm font-medium text-green-600">Exercise</label>
                <div className="flex items-center gap-4">
                <input
                  type="checkbox"
                  checked={exerciseChecked}
                  onChange={(e) => setExerciseChecked(e.target.checked)}
                  className="w-5 h-5"
                />
                <AnimatePresence>
                  {exerciseChecked && (
                    <motion.select
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    value={exerciseIntensity}
                    onChange={(e) => setExerciseIntensity(e.target.value)}
                    className="p-2 border rounded text-gray-800 dark:text-gray-200 bg-background"
                    >
                    <option value="low" className="bg-background">Low Intensity</option>
                    <option value="medium" className="bg-background">Medium Intensity</option>
                    <option value="high" className="bg-background">High Intensity</option>
                    </motion.select>
                  )}
                </AnimatePresence>
                </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Add Entry
            </button>
          </form>
        </CardContent>
      </Card>

      {/* History Card */}
      <Card className="max-w-lg mx-auto">
        <CardHeader>
          <CardTitle>History</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-56 rounded-md border">
            <div className="p-4">
              {history.length > 0 ? (
                history.map((entry, index) => (
                  <React.Fragment key={entry.id}>
                    <div className="flex justify-between items-center py-2">
                      <div>
                        <span
                          className={`${
                            !entry.visible ? 'line-through text-gray-500' : ''
                          }`}
                        >
                          {entry.name} - {entry.calories < 0 ? (
                            <span className="text-green-600">burned {Math.abs(entry.calories)} calories</span>
                          ) : (
                            <span>{entry.calories} calories</span>
                          )}
                        </span>
                        <div className="text-sm text-gray-400">{entry.date}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleVisibility(entry.id)}
                          className="text-blue-500 hover:text-blue-700"
                        >
                          <FaEye />
                        </button>
                        <button
                          onClick={() => handleEdit(entry.id)}
                          className="text-blue-500 hover:underline"
                        >
                          Edit
                        </button>
                      </div>
                    </div>
                    {index < history.length - 1 && <Separator className="my-2" />}
                  </React.Fragment>
                ))
              ) : (
                <p className="text-center text-gray-500">No entries yet</p>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default HabitForm;