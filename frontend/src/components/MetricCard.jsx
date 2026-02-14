import React from 'react';
import { motion } from 'framer-motion';
import clsx from 'clsx';
import { Activity, Flame, Moon, AlertTriangle } from 'lucide-react';

const icons = {
  focus: Activity,
  burnout: Flame,
  recovery: Moon,
  risk: AlertTriangle
};

const typeConfig = {
  success: {
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    border: 'border-emerald-500/20',
    bar: 'bg-emerald-500',
    iconBg: 'bg-emerald-500/15',
  },
  warning: {
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    border: 'border-amber-500/20',
    bar: 'bg-amber-500',
    iconBg: 'bg-amber-500/15',
  },
  error: {
    bg: 'bg-rose-500/10',
    text: 'text-rose-400',
    border: 'border-rose-500/20',
    bar: 'bg-rose-500',
    iconBg: 'bg-rose-500/15',
  },
};

const MetricCard = ({ title, value, unit, type = 'success', icon }) => {
  const Icon = icons[icon] || Activity;
  const config = typeConfig[type] || typeConfig.success;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      className="bg-slate-800/40 border border-white/[0.06] rounded-xl p-4 relative overflow-hidden group transition-all duration-200 hover:border-white/[0.1]"
    >
      {/* Header Row */}
      <div className="flex items-center justify-between mb-3">
        <div className={clsx("p-1.5 rounded-lg", config.iconBg)}>
          <Icon size={14} className={config.text} />
        </div>
        <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">{title}</span>
      </div>

      {/* Value */}
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold text-white tracking-tight">{value}</span>
        <span className={clsx("text-xs font-medium", config.text)}>{unit}</span>
      </div>

      {/* Progress Bar */}
      <div className="mt-3 h-[3px] w-full bg-white/[0.04] rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(parseInt(value) || 50, 100)}%` }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className={clsx("h-full rounded-full", config.bar)}
        />
      </div>
    </motion.div>
  );
};

export default MetricCard;
