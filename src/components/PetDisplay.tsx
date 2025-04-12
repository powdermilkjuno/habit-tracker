import { motion } from 'framer-motion';
import useStore from '../stores/useStore';

const PetDisplay = () => {
  const { petStatus } = useStore();
  
  const petSprites = {
    egg: '/sprites/egg.png',
    weak: '/sprites/weak.png',
    healthy: '/sprites/healthy.png'
  };

  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', stiffness: 260, damping: 20 }}
      className="relative w-48 h-48 mx-auto"
    >
      <img
        src={petSprites[petStatus]}
        alt="Pet status"
        className="absolute inset-0 w-full h-full object-contain"
        style={{ imageRendering: 'pixelated' }}
      />
      
      {petStatus === 'healthy' && (
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