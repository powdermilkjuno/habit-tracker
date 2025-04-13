import { motion } from 'framer-motion';
import Image from 'next/image';
import useStore from '../stores/useStore';
import { useEffect, useState, useRef } from 'react';

// Define the allowed pet status types
type PetStatus = 'egg' | 'hatching' | 'weak' | 'healthy';

const PetDisplay = () => {
  const { petStatus, entries } = useStore();
  
  // Calculate total entries count
  const totalEntries = entries ? entries.length : 0;
  
  // For backward compatibility with the existing code
  const [isHatching, setIsHatching] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // Define petSprites with the correct type and updated SVG paths
  const petSprites: Record<PetStatus, string> = {
    egg: '/egg.svg',
    hatching: '/egg.svg', // Use same sprite but will be animated differently
    weak: '/creature-weak.svg',
    healthy: '/creature-strong.svg'
  };

  // Function to determine flavor text based on pet status and entries
  const getFlavorText = () => {
    if (isHatching) return "It's hatching! Something exciting is about to happen!";
    
    if (petStatus === 'egg') {
      if (totalEntries > 0) return "Your egg seems closer to hatching!";
      return "This egg needs your healthy habits to hatch!";
    }
    
    if (petStatus === 'weak') {
      return "You should feed your pet soon!";
    }
    
    if (petStatus === 'healthy') {
      return "Your pet is as healthy as can be!";
    }
    
    return "Take care of your virtual pet!";
  };

  // Check if conditions are met to hatch the egg
  useEffect(() => {
    if (petStatus === 'egg' && totalEntries >= 3 && !isHatching) {
      // Start hatching animation
      setIsHatching(true);
      
      // Delay the sound effect by 3 seconds
      setTimeout(() => {
        // Play hatching sound after delay
        if (audioRef.current) {
          audioRef.current.play().catch(e => console.log("Audio play failed:", e));
        }
      }, 3000);
      
      // After animation completes (6 seconds total - 3s delay + 3s animation), update pet status
      setTimeout(() => {
        useStore.setState({ petStatus: 'weak' });
        setIsHatching(false);
      }, 6000); // 3 seconds delay + 3 seconds animation
    }
  }, [petStatus, isHatching, totalEntries]);

  // Check if there's an entry from today and update pet status from weak to healthy
  useEffect(() => {
    // Only run if pet is already hatched and currently weak
    if (petStatus === 'weak' && entries && entries.length > 0) {
      // Get today's date as YYYY-MM-DD
      const today = new Date().toISOString().split('T')[0];
      
      // Check if any entry is from today
      const hasTodayEntry = entries.some(entry => {
        // Assuming entry has a date field that's either a string or Date object
        const entryDate = entry.date 
          ? (typeof entry.date === 'object' && entry.date !== null
              ? (entry.date as Date).toISOString().split('T')[0] 
              : typeof entry.date === 'string' 
                ? entry.date.split('T')[0] 
                : null)
          : null;
        
        return entryDate === today;
      });
      
      // If there's an entry from today, update pet status to healthy
      if (hasTodayEntry) {
        useStore.setState({ petStatus: 'healthy' });
      }
    }
  }, [entries, petStatus]);

  // Ensure petStatus is one of the valid types
  const displayStatus: PetStatus = 
    isHatching ? 'hatching' : 
    (petStatus === 'egg' || petStatus === 'weak' || petStatus === 'healthy') 
      ? petStatus as PetStatus 
      : 'egg'; // Default to 'egg' if status is invalid

  // Animation variants for different pet states
  const healthyAnimation = {
    animate: {
      y: [0, -15, 0],
      transition: { 
        duration: 1.5, 
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  const weakAnimation = {
    animate: {
      x: [-5, 5, -5],
      transition: { 
        duration: 3, 
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  return (
    <div className="flex flex-col items-center space-y-6">
      <audio ref={audioRef} src="/bitcrushedexplosion.mp3" preload="auto" />
      
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        className="relative w-full max-w-[500px] h-96 md:h-[450px] mx-auto rounded-lg shadow-lg overflow-hidden"
      >
        {/* Background with blur */}
        <div 
          className="absolute inset-0 z-0" 
          style={{
            backgroundImage: 'url(/background.jpg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'blur(3px)',
            transform: 'scale(1.05)' // Slightly larger to prevent blur edges showing
          }}
        />
        
        {/* Pet display container */}
        <div className="absolute inset-0 flex items-center justify-center z-10">
          {isHatching ? (
            <motion.div
              animate={{
                scale: [1, 1.2, 0.9, 1.3, 0.8, 1.4, 0.7],
                rotate: [0, 10, -10, 15, -15, 20, -20],
                opacity: [1, 1, 1, 1, 1, 1, 0]
              }}
              transition={{ 
                duration: 3,
                times: [0, 0.2, 0.4, 0.6, 0.7, 0.8, 1],
                ease: "easeInOut"
              }}
            >
              <Image
                src={petSprites.egg}
                alt="Egg hatching"
                width={300} 
                height={300}
                className="object-contain"
                priority
              />
            </motion.div>
          ) : displayStatus === 'egg' ? (
            <motion.div
              animate={{
                rotate: [0, 15, 0, -15, 0],
                transformOrigin: 'bottom'
              }}
              transition={{ 
                duration: 3, 
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <Image
                src={petSprites[displayStatus]}
                alt={`Pet status: ${displayStatus}`}
                width={300}
                height={300}
                className="object-contain"
                priority
              />
            </motion.div>
          ) : displayStatus === 'healthy' ? (
            <motion.div
              animate={healthyAnimation.animate}
            >
              <Image
                src={petSprites[displayStatus]}
                alt={`Pet status: ${displayStatus}`}
                width={300}
                height={300}
                className="object-contain"
                priority
              />
            </motion.div>
          ) : displayStatus === 'weak' ? (
            <motion.div
              animate={weakAnimation.animate}
            >
              <Image
                src={petSprites[displayStatus]}
                alt={`Pet status: ${displayStatus}`}
                width={300}
                height={300}
                className="object-contain"
                priority
              />
            </motion.div>
          ) : (
            <Image
              src={petSprites[displayStatus]}
              alt={`Pet status: ${displayStatus}`}
              width={300}
              height={300}
              className="object-contain"
              priority
            />
          )}
        </div>
      </motion.div>
      
      {/* Flavor Text Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="w-full max-w-[500px] bg-white/90 backdrop-blur-sm shadow-md rounded-lg p-4 text-center"
      >
        <p className="text-lg font-medium text-gray-800">
          {getFlavorText()}
        </p>
      </motion.div>
    </div>
  );
};

export default PetDisplay;
