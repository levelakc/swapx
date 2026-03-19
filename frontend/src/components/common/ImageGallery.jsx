import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import ImageWithFallback from './ImageWithFallback';

export default function ImageGallery({ images = [], title = "" }) {
  const [currentIndex, setCurrentStep] = useState(0);

  if (!images || images.length === 0) {
    return (
      <div className="w-full h-full bg-muted flex items-center justify-center">
        <ImageWithFallback src="" alt={title} className="w-full h-full object-cover" />
      </div>
    );
  }

  const next = () => setCurrentStep((prev) => (prev + 1) % images.length);
  const prev = () => setCurrentStep((prev) => (prev - 1 + images.length) % images.length);

  return (
    <div className="relative w-full h-full group overflow-hidden bg-black/5">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="w-full h-full"
        >
          <ImageWithFallback 
            src={images[currentIndex]} 
            alt={`${title} - ${currentIndex + 1}`} 
            className="w-full h-full object-cover"
          />
        </motion.div>
      </AnimatePresence>

      {/* Navigation Arrows */}
      {images.length > 1 && (
        <>
          <button
            onClick={(e) => { e.preventDefault(); prev(); }}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/20 backdrop-blur-md text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/40"
          >
            <ChevronLeft size={24} />
          </button>
          <button
            onClick={(e) => { e.preventDefault(); next(); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/20 backdrop-blur-md text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/40"
          >
            <ChevronRight size={24} />
          </button>

          {/* Dots Indicator */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={(e) => { e.preventDefault(); setCurrentStep(i); }}
                className={`w-2 h-2 rounded-full transition-all ${i === currentIndex ? 'w-6 bg-primary' : 'bg-white/50 hover:bg-white/80'}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
