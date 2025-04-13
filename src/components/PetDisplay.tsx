import { motion } from 'framer-motion';
import Image from 'next/image';
import useStore from '../stores/useStore';
import { useEffect, useState, useRef } from 'react';

// Define the allowed pet status types
type PetStatus = 'egg' | 'hatching' | 'weak' | 'healthy';

const PetDisplay = () => {
  const { petStatus, entries } = useStore();
  
  // Calculate total entries count
  const totalEntries = entries ? Object.values(entries).reduce((sum, dayEntries) => 
    sum + (dayEntries ? Object.values(dayEntries).length : 0), 0) : 0;
  
  // For backward compatibility with the existing code
  const meals = totalEntries > 5 ? 3 : 0; // Use totalEntries to determine meals count
  const exercise = 0;
  const [isHatching, setIsHatching] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // Define petSprites with the correct type
  const petSprites: Record<PetStatus, string> = {
    egg: '/egg.svg',
    hatching: '/egg.svg', // Use same sprite but will be animated differently
    weak: '/sprites/weak.png',
    healthy: '/sprites/healthy.png'
  };

  // Check if conditions are met to hatch the egg
  useEffect(() => {
    if (petStatus === 'egg' && totalEntries >= 3 && !isHatching) {
      setIsHatching(true);
      
      // Play hatching sound
      if (audioRef.current) {
        audioRef.current.play().catch(e => console.log("Audio play failed:", e));
      }
      
      // After animation completes, update pet status via store
      setTimeout(() => {
        useStore.setState({ petStatus: 'weak' });
        setIsHatching(false);
      }, 3000); // 3 seconds for hatching animation
    }
  }, [meals, exercise, petStatus, isHatching, totalEntries]);

  // Ensure petStatus is one of the valid types
  const validStatus: PetStatus = 
    (petStatus === 'egg' || petStatus === 'weak' || petStatus === 'healthy') 
      ? petStatus as PetStatus 
      : 'egg'; // Default to 'egg' if status is invalid

  return (
    <>
      <audio ref={audioRef} src="/bitcrushedexplosion.mp3" preload="auto" />
      
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        className="relative w-80 h-80 mx-auto rounded-lg shadow-lg overflow-hidden"
        style={{
          backgroundImage: 'url(/sprites/card-background.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <div className="absolute inset-0 flex items-center justify-center">
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
                width={200}
                height={200}
                className="object-contain z-10"
                priority
              />
            </motion.div>
          ) : validStatus === 'egg' ? (
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
                src={petSprites[validStatus]}
                alt={`Pet status: ${validStatus}`}
                width={200}
                height={200}
                className="object-contain z-10"
                priority
              />
            </motion.div>
          ) : (
            <Image
              src={petSprites[validStatus]}
              alt={`Pet status: ${validStatus}`}
              width={200}
              height={200}
              className="object-contain z-10"
              priority
            />
          )}
        </div>
        
        {isHatching && (
          <motion.div
            animate={{ opacity: [0, 1, 0.5, 1] }}
            transition={{ duration: 1.5, repeat: 1 }}
            className="absolute bottom-4 left-0 right-0 text-center z-20 text-lg font-bold"
          >
            🥚 Hatching!
          </motion.div>
        )}
        
        {validStatus === 'healthy' && (
          <motion.div
            animate={{ y: [-5, 5, -5] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute bottom-4 left-0 right-0 text-center z-20 text-lg font-bold"
          >
            🎉 Doing great!
          </motion.div>
        )}
      </motion.div>
    </>
  );
};

export default PetDisplay;