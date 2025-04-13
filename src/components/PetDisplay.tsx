import { motion } from 'framer-motion';
import useStore from '../stores/useStore';

// Define the allowed pet status types
type PetStatus = 'egg' | 'weak' | 'healthy';

const PetDisplay = () => {
  const { petStatus } = useStore();
  
  // Define petSprites with the correct type
  const petSprites: Record<PetStatus, string> = {
    egg: '/sprites/egg.png',
    weak: '/sprites/weak.png',
    healthy: '/sprites/healthy.png'
  };

  // Ensure petStatus is one of the valid types
  const validStatus: PetStatus = 
    (petStatus === 'egg' || petStatus === 'weak' || petStatus === 'healthy') 
      ? petStatus as PetStatus 
      : 'egg'; // Default to 'egg' if status is invalid

  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', stiffness: 260, damping: 20 }}
      className="relative w-48 h-48 mx-auto"
    >
      <img
        src={petSprites[validStatus]}
        alt={`Pet status: ${validStatus}`}
        className="absolute inset-0 w-full h-full object-contain"
        style={{ imageRendering: 'pixelated' }}
      />
      
      {validStatus === 'healthy' && (
        <motion.div
          animate={{ y: [-5, 5, -5] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute -bottom-2 left-0 right-0 text-center"
        >
          🎉 Doing great!
        </motion.div>
      )}
    </motion.div>
  );
};

export default PetDisplay;