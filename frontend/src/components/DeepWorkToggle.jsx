import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Focus, Maximize2, X, Music } from 'lucide-react';

const DeepWorkToggle = ({ isDeepWork, toggleDeepWork }) => {
  return (
    <motion.button
      onClick={toggleDeepWork}
      whileTap={{ scale: 0.95 }}
      whileHover={{ scale: 1.05 }}
      className={`relative group overflow-hidden rounded-full flex items-center justify-center p-3 transition-all duration-300 shadow-lg border border-white/10 ${
        isDeepWork 
          ? 'bg-rose-500 text-white shadow-[0_0_30px_rgba(244,63,94,0.4)]' 
          : 'bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600/40 hover:text-white hover:shadow-[0_0_20px_rgba(99,102,241,0.3)]'
      }`}
    >
      <AnimatePresence mode='wait'>
        {isDeepWork ? (
          <motion.div
            key="exit"
            initial={{ opacity: 0, scale: 0.5, rotate: -90 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            exit={{ opacity: 0, scale: 0.5, rotate: 90 }}
          >
            <X size={24} />
          </motion.div>
        ) : (
          <motion.div
            key="enter"
            initial={{ opacity: 0, scale: 0.5, rotate: 90 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            exit={{ opacity: 0, scale: 0.5, rotate: -90 }}
          >
            <Focus size={24} />
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Tooltip */}
      <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 px-2 py-1 bg-black/80 text-xs text-white rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap pointer-events-none">
        {isDeepWork ? "Exit Deep Work" : "Enter Deep Focus"}
      </div>
    </motion.button>
  );
};

export default DeepWorkToggle;
