import React, { useEffect, useState } from 'react';
import { motion, useAnimation } from 'framer-motion';

const EnergyGauge = ({ energyLevel = 85 }) => {
  const [color, setColor] = useState('#10B981'); // Default Green
  const controls = useAnimation();

  useEffect(() => {
    if (energyLevel > 70) setColor('#10B981'); // Emerald/Green
    else if (energyLevel > 40) setColor('#F59E0B'); // Amber
    else setColor('#EF4444'); // Red
    
    controls.start({
      strokeDashoffset: 440 - (440 * energyLevel) / 100,
      transition: { duration: 0.8, ease: "easeInOut" }
    });
  }, [energyLevel, controls]);

  return (
    <div className="relative w-64 h-64 flex items-center justify-center">
      {/* Outer Glow Ring */}
      <motion.div 
        className="absolute inset-0 rounded-full blur-xl opacity-30"
        style={{ backgroundColor: color }}
        animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      />
      
      {/* Floating Particles */}
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-white rounded-full opacity-50"
          animate={{
            x: [0, (Math.random() - 0.5) * 100],
            y: [0, (Math.random() - 0.5) * 100],
            opacity: [0, 1, 0]
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            repeat: Infinity,
            repeatType: "reverse",
            ease: "easeInOut"
          }}
          style={{ top: '50%', left: '50%' }}
        />
      ))}

      {/* SVG Gauge */}
      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 200 200">
        {/* Track */}
        <circle
          cx="100"
          cy="100"
          r="70"
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="10"
          strokeLinecap="round"
        />
        
        {/* Progress */}
        <motion.circle
          cx="100"
          cy="100"
          r="70"
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray="440"
          strokeDashoffset="440"
          animate={controls}
          filter="url(#glow)"
        />
        
        {/* Glow Filter */}
        <defs>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
      </svg>

      {/* Center Text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-white z-10">
        <span className="text-4xl font-bold tracking-tighter drop-shadow-lg">
          {energyLevel}%
        </span>
        <span className="text-xs font-medium text-slate-400 uppercase tracking-widest mt-1">
          Cognitive Bandwidth
        </span>
      </div>
      
      {/* Rotating Border */}
      <motion.div
        className="absolute inset-0 rounded-full border border-white/5 border-t-white/20"
        animate={{ rotate: 360 }}
        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
      />
    </div>
  );
};

export default EnergyGauge;
