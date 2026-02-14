import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff } from 'lucide-react';

const VoiceButton = ({ onVoiceCommand }) => {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const toggleListening = () => {
    if (isListening) {
      setIsListening(false);
      setIsProcessing(true);
      setTimeout(() => setIsProcessing(false), 2000); // Simulate processing
    } else {
      setIsListening(true);
    }
  };

  return (
    <div className="relative flex items-center justify-center">
      <AnimatePresence>
        {isListening && (
          <motion.div
            initial={{ scale: 1, opacity: 0.5 }}
            animate={{ scale: 1.5, opacity: 0 }}
            exit={{ scale: 1, opacity: 0 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
            className="absolute inset-0 bg-emerald-500 rounded-full blur-xl"
          />
        )}
      </AnimatePresence>

      <motion.button
        onClick={toggleListening}
        whileTap={{ scale: 0.9 }}
        className={`
          relative z-10 w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg border border-white/10
          ${isListening ? 'bg-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.5)]' : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'}
          ${isProcessing ? 'animate-pulse bg-amber-500 text-white' : ''}
        `}
      >
        {isProcessing ? (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity }}
            className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
          />
        ) : (
          isListening ? <MicOff size={20} /> : <Mic size={20} />
        )}
      </motion.button>
      
      {/* Waveform Visualization Placeholder (when listening) */}
      <AnimatePresence>
        {isListening && (
          <motion.div 
             initial={{ opacity: 0, scaleY: 0 }}
             animate={{ opacity: 1, scaleY: 1 }}
             exit={{ opacity: 0, scaleY: 0 }}
             className="absolute -right-20 top-1/2 -translate-y-1/2 flex items-center gap-1 h-8 pointer-events-none"
          >
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                className="w-1 bg-emerald-400 rounded-full"
                animate={{ height: [10, 25, 10] }}
                transition={{ 
                  duration: 0.5, 
                  repeat: Infinity, 
                  delay: i * 0.1,
                  repeatType: "mirror" 
                }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default VoiceButton;
