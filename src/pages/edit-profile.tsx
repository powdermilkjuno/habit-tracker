import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import useStore from '../stores/useStore';
import { calculateBMR } from '../lib/calculations';

export default function EditProfile() {
  const router = useRouter();
  const { 
    weight, height, age, activityLevel, goal, setUserData, clearHistory,
    user, isLoading, authError, signUp, signIn, signOut 
  } = useStore();
  
  const [formData, setFormData] = useState({
    weight: weight || '',
    height: height || '',
    age: age || '',
    activityLevel: activityLevel || 'Sedentary',
    goal: goal || 'cut',
  });
  
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [authForm, setAuthForm] = useState({
    email: '',
    password: '',
  });

  const [syncStatus, setSyncStatus] = useState('idle');

  useEffect(() => {
    if (user) {
      console.log('User is logged in:', user);
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };
  
  const handleAuthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setAuthForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Calculate BMR based on the new values
    const calculatedBmr = calculateBMR(
      Number(formData.weight), 
      Number(formData.height), 
      Number(formData.age), 
      formData.activityLevel
    );
    
    // Update local state with Zustand
    setUserData({
      weight: Number(formData.weight),
      height: Number(formData.height),
      age: Number(formData.age),
      activityLevel: formData.activityLevel,
      goal: formData.goal,
      bmr: calculatedBmr,
    });

    // If user is logged in, automatically sync to Supabase
    if (user) {
      setSyncStatus('syncing');
      try {
        // Call the updateUserProfile method from your store
        await useStore.getState().updateUserProfile({
          weight: Number(formData.weight),
          height: Number(formData.height),
          age: Number(formData.age),
          activityLevel: formData.activityLevel,
          goal: formData.goal,
          bmr: calculatedBmr
        });
        
        // Show success message
        setSyncStatus('success');
        setTimeout(() => setSyncStatus('idle'), 3000);
      } catch (error) {
        console.error('Error syncing profile:', error);
        setSyncStatus('error');
        setTimeout(() => setSyncStatus('idle'), 3000);
      }
    }

    router.push('/');
  };

  const handleRetakeQuiz = () => {
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
    clearHistory();
    alert('History cleared successfully!');
  };
  
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (authMode === 'signup') {
      await signUp(authForm.email, authForm.password);
    } else {
      await signIn(authForm.email, authForm.password);
    }
    
    if (!authError) {
      setAuthForm({ email: '', password: '' });
    }
  };
  
  const handleLogout = async () => {
    await signOut();
  };

  const handleSync = async () => {
    setSyncStatus('syncing');
    try {
      // Pass current profile data from form to the updateUserProfile method
      await useStore.getState().updateUserProfile({
        weight: Number(formData.weight),
        height: Number(formData.height),
        age: Number(formData.age),
        activityLevel: formData.activityLevel,
        goal: formData.goal,
        bmr: calculateBMR(
          Number(formData.weight), 
          Number(formData.height), 
          Number(formData.age), 
          formData.activityLevel
        )
      });
      setSyncStatus('success');
      setTimeout(() => setSyncStatus('idle'), 3000);
    } catch (error) {
      console.error('Sync failed:', error);
      setSyncStatus('error');
      setTimeout(() => setSyncStatus('idle'), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <h1 className="text-2xl font-bold text-center mb-6">Edit Profile</h1>
        
        {!user ? (
          <div className="mb-8 p-4 border border-gray-200 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">
              {authMode === 'login' ? 'Login' : 'Create Account'}
            </h2>
            
            <form onSubmit={handleAuth} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  name="email"
                  value={authForm.email}
                  onChange={handleAuthChange}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Password</label>
                <input
                  type="password"
                  name="password"
                  value={authForm.password}
                  onChange={handleAuthChange}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
              
              {authError && (
                <div className="text-red-500 text-sm">{authError}</div>
              )}
              
              <button
                type="submit"
                className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                disabled={isLoading}
              >
                {isLoading ? 'Processing...' : authMode === 'login' ? 'Login' : 'Sign Up'}
              </button>
              
              <div className="text-center mt-2">
                <button
                  type="button"
                  onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
                  className="text-blue-500 hover:underline text-sm"
                >
                  {authMode === 'login' 
                    ? 'Need an account? Sign up' 
                    : 'Already have an account? Login'}
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex justify-between items-center">
              <p className="text-green-800">
                Logged in as <span className="font-semibold">{user.email}</span>
              </p>
              <button
                onClick={handleLogout}
                className="text-sm px-3 py-1 bg-red-100 text-red-800 rounded hover:bg-red-200"
              >
                Logout
              </button>
            </div>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
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

          <button
            type="submit"
            className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Save Changes
          </button>
        </form>

        <button
          onClick={handleRetakeQuiz}
          className="w-full mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Retake Quiz
        </button>

        <button
          onClick={handleClearHistory}
          className="w-full mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Clear History
        </button>
        
        {user && (
          <button
            onClick={handleSync}
            className={`w-full mt-4 px-4 py-2 bg-${syncStatus === 'success' ? 'green' : syncStatus === 'error' ? 'red' : 'blue'}-500 text-white rounded`}
            disabled={syncStatus === 'syncing'}
          >
            {syncStatus === 'syncing' ? 'Syncing...' : 
             syncStatus === 'success' ? 'Synced Successfully!' :
             syncStatus === 'error' ? 'Sync Failed' : 'Sync Data to Cloud'}
          </button>
        )}

        {syncStatus !== 'idle' && (
          <div className={`mt-2 text-center py-2 rounded text-white bg-${
            syncStatus === 'success' ? 'green' : 
            syncStatus === 'error' ? 'red' : 
            'blue'
          }-500`}>
            {syncStatus === 'syncing' ? 'Saving to cloud...' : 
             syncStatus === 'success' ? 'Saved to cloud successfully!' :
             'Failed to save to cloud'}
          </div>
        )}
      </div>
    </div>
  );
}