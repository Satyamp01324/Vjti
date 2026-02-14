import React from 'react';
import { motion } from 'framer-motion';
import clsx from 'clsx';
import { AlertCircle, Flame, Moon, Timer } from 'lucide-react';

const icons = {
  focus: Timer,
  burnout: Flame,
  recovery: Moon,
  risk: AlertCircle
};

const MetricCard = ({ title, value, unit, trend, type, icon }) => {
  const Icon = icons[icon] || Timer;

  return (
    <motion.div
      whileHover={{ y: -5, boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" }}
      className="glass-card p-4 relative overflow-hidden group"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={clsx(
            "p-2 rounded-lg bg-opacity-20 backdrop-blur-md",
            type === 'success' ? 'bg-emerald-500 text-emerald-400' :
            type === 'warning' ? 'bg-amber-500 text-amber-400' :
            'bg-rose-500 text-rose-400'
          )}>
            <Icon size={18} />
          </div>
          <h3 className="text-sm font-medium text-slate-400">{title}</h3>
        </div>
        
        {trend && (
          <span className={clsx(
            "text-xs font-semibold px-2 py-0.5 rounded-full flex items-center gap-1",
            trend > 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
          )}>
            {trend > 0 ? '+' : ''}{trend}%
          </span>
        )}
      </div>

      <div className="mt-4 flex items-baseline gap-1">
        <span className="text-2xl font-bold text-white tracking-tight">{value}</span>
        <span className="text-sm text-slate-500 font-medium">{unit}</span>
      </div>

      {/* Mini Sparkline Visualization */}
      <div className="mt-4 h-1 w-full bg-white/5 rounded-full overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(parseInt(value) || 50, 100)}%` }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className={clsx(
            "h-full rounded-full",
            type === 'success' ? 'bg-emerald-500' :
            type === 'warning' ? 'bg-amber-500' :
            'bg-rose-500'
          )}
        />
      </div>

      {/* Hover Light Effect */}
      <div className="absolute -inset-full top-0 block h-full w-1/2 -skew-x-12 bg-gradient-to-r from-transparent to-white opacity-10 group-hover:animate-shine" />
    </motion.div>
  );
};

export default MetricCard;
