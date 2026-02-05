
import { motion } from 'framer-motion';

const FuturisticCard = ({ children, className }) => {
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      className={`relative overflow-hidden rounded-lg shadow-lg group ${className}`}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-indigo-600 opacity-20 group-hover:opacity-30 transition-opacity duration-300"></div>
      <div className="absolute inset-0 backdrop-filter backdrop-blur-sm"></div>
      <div className="relative p-4">
        {children}
      </div>
    </motion.div>
  );
};

export default FuturisticCard;
