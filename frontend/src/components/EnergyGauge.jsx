import React, { useEffect, useState } from 'react';
import { motion, useAnimation } from 'framer-motion';

const EnergyGauge = ({ energyLevel = 85 }) => {
  const [color, setColor] = useState('#10B981');
  const controls = useAnimation();

  useEffect(() => {
    if (energyLevel > 70) setColor('#10B981');
    else if (energyLevel > 40) setColor('#F59E0B');
    else setColor('#EF4444');

    controls.start({
      strokeDashoffset: 440 - (440 * energyLevel) / 100,
      transition: { duration: 1, ease: "easeInOut" }
    });
  }, [energyLevel, controls]);

  const getLabel = () => {
    if (energyLevel > 70) return 'Optimal';
    if (energyLevel > 40) return 'Moderate';
    return 'Low';
  };

  return (
    <div className="relative w-52 h-52 flex items-center justify-center">
      {/* Subtle glow */}
      <div
        className="absolute inset-4 rounded-full blur-2xl opacity-15"
        style={{ backgroundColor: color }}
      />

      {/* SVG Gauge */}
      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 200 200">
        {/* Background track */}
        <circle
          cx="100" cy="100" r="70"
          fill="none"
          stroke="rgba(255,255,255,0.05)"
          strokeWidth="8"
          strokeLinecap="round"
        />
        {/* Progress */}
        <motion.circle
          cx="100" cy="100" r="70"
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray="440"
          strokeDashoffset="440"
          animate={controls}
          style={{ filter: `drop-shadow(0 0 6px ${color}40)` }}
        />
      </svg>

      {/* Center Content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-bold text-white tracking-tight">{energyLevel}%</span>
        <span className="text-[10px] font-medium text-slate-500 uppercase tracking-widest mt-1">
          {getLabel()}
        </span>
        <span className="text-[9px] text-slate-600 mt-0.5">Cognitive Bandwidth</span>
      </div>
    </div>
  );
};

export default EnergyGauge;
