import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Sun,
  CloudSun,
  CloudRain,
  CloudLightning,
  HelpCircle,
  Activity,
  Sliders,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

/**
 * Spoon Capacity Meter Component (FEAT-E1)
 *
 * Visual representation of 12 spoons daily cognitive budget:
 * - Filled/active spoons (cognitive energy ready to spend)
 * - 20% reserved breathing room (burnout buffer)
 * - Spent or schedule-deducted spoons
 * - Soft range display ("about 5 to 6 spoons")
 * - Weather condition badge
 * - Non-judgmental manual override slider (FR-SP-04)
 * - "Why?" factor breakdown trigger
 * - "20s Attention Pulse" probe trigger
 */
export default function SpoonMeter({
  snapshot,
  onOpenWhy,
  onOpenPulse,
  onOverrideSpoons,
  className = '',
}) {
  const [sliderVal, setSliderVal] = useState(null);
  const [isAdjusting, setIsAdjusting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Extract values from snapshot (or sensible defaults)
  const spoons = snapshot?.live_spoons ?? snapshot?.prior_spoons ?? 6.0;
  const currentSpoons = sliderVal !== null ? sliderVal : spoons;
  const weather = snapshot?.weather || 'partly_cloudy';
  const rangeText = snapshot?.range_text || `about ${Math.floor(currentSpoons)} to ${Math.ceil(currentSpoons)} spoons`;
  const reservedBuffer = Math.min(2.4, Number((currentSpoons * 0.2).toFixed(1)));
  const usableSpoons = Math.max(0, Number((currentSpoons - reservedBuffer).toFixed(1)));

  // Weather badge styling & iconography
  const weatherConfig = {
    sunny: {
      label: 'Sunny',
      sublabel: 'Expansive Capacity',
      icon: Sun,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10 border-amber-500/30',
      description: 'Low external load. Great day for deep focus or challenging tasks.',
    },
    partly_cloudy: {
      label: 'Partly Cloudy',
      sublabel: 'Balanced Capacity',
      icon: CloudSun,
      color: 'text-sky-400',
      bg: 'bg-sky-500/10 border-sky-500/30',
      description: 'Moderate transit and classes. Pace yourself steadily.',
    },
    cloudy: {
      label: 'Rainy',
      sublabel: 'Low Energy Load',
      icon: CloudRain,
      color: 'text-indigo-400',
      bg: 'bg-indigo-500/10 border-indigo-500/30',
      description: 'Heavy commute or classes. Keep focus to 1-2 core priorities.',
    },
    stormy: {
      label: 'Stormy',
      sublabel: 'Rest First Mode',
      icon: CloudLightning,
      color: 'text-rose-400',
      bg: 'bg-rose-500/10 border-rose-500/30',
      description: 'Overload warning. Micro-shrink tasks and protect recovery.',
    },
  };

  const activeWeather = weatherConfig[weather] || weatherConfig.partly_cloudy;
  const WeatherIcon = activeWeather.icon;

  const handleSliderChange = (e) => {
    setSliderVal(parseFloat(e.target.value));
  };

  const handleSaveOverride = async () => {
    if (sliderVal === null) {
      setIsAdjusting(false);
      return;
    }
    setIsSaving(true);
    try {
      if (onOverrideSpoons) {
        await onOverrideSpoons(sliderVal);
      }
    } catch (err) {
      console.error('Failed to override spoons:', err);
    } finally {
      setIsSaving(false);
      setIsAdjusting(false);
    }
  };

  const handleCancelOverride = () => {
    setSliderVal(null);
    setIsAdjusting(false);
  };

  // Render 12 spoons grid / icons
  const totalSpoons = 12;
  const filledCount = Math.round(currentSpoons);
  const reservedCount = Math.round(reservedBuffer);
  const activeCount = Math.max(0, filledCount - reservedCount);

  return (
    <div
      className={`relative bg-gradient-to-br from-slate-900/90 via-slate-800/80 to-slate-900/90 border border-white/10 rounded-2xl p-6 backdrop-blur-xl shadow-2xl overflow-hidden ${className}`}
    >
      {/* Background ambient glow */}
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-violet-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header Row */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold tracking-wider uppercase text-violet-400">
              Cognitive Energy Budget
            </span>
            <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30">
              Zero-Shame
            </span>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight mt-0.5">
            Spoon Capacity
          </h2>
        </div>

        {/* Weather Badge & Quick Actions */}
        <div className="flex items-center gap-2.5">
          {/* Weather pill */}
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border ${activeWeather.bg}`}
            title={activeWeather.description}
          >
            <WeatherIcon className={`w-4 h-4 ${activeWeather.color}`} />
            <div className="text-left">
              <div className={`text-xs font-semibold ${activeWeather.color} leading-none`}>
                {activeWeather.label}
              </div>
              <div className="text-[10px] text-slate-400 leading-none mt-0.5">
                {activeWeather.sublabel}
              </div>
            </div>
          </div>

          {/* Why? Button */}
          {onOpenWhy && (
            <button
              onClick={onOpenWhy}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all shadow-sm"
              title="See factor breakdown (Commute, Campus, Deadlines)"
            >
              <HelpCircle className="w-3.5 h-3.5 text-violet-400" />
              <span>Why?</span>
            </button>
          )}

          {/* 20s Pulse Probe Button */}
          {onOpenPulse && (
            <button
              onClick={onOpenPulse}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-300 hover:text-emerald-200 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 rounded-xl transition-all shadow-sm"
              title="Calibrate cognitive energy with a 20-second non-punitive focus pulse"
            >
              <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span>Take Pulse (20s)</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Budget Display */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        {/* Left: Capacity Number & Range */}
        <div className="md:col-span-5 flex flex-col justify-center">
          <div className="flex items-baseline gap-3">
            <span className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-violet-300 via-sky-200 to-emerald-300 tracking-tight">
              {currentSpoons.toFixed(1)}
            </span>
            <div className="text-slate-400 font-medium">
              <span className="text-xl text-white font-semibold">/ 12</span>
              <span className="text-xs block text-slate-400">spoons today</span>
            </div>
          </div>

          <div className="mt-2 flex items-center gap-2">
            <span className="text-sm font-medium text-violet-200 bg-violet-500/15 px-2.5 py-1 rounded-lg border border-violet-500/20">
              {rangeText}
            </span>
          </div>

          {/* Capacity Buffer Breakdown */}
          <div className="mt-4 space-y-1.5 text-xs text-slate-300">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-slate-400">
                <Sparkles className="w-3 h-3 text-violet-400" /> Usable Focus Spoons:
              </span>
              <span className="font-semibold text-white">{usableSpoons} spoons</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-slate-400">
                <ShieldCheck className="w-3 h-3 text-emerald-400" /> Protected Buffer (20%):
              </span>
              <span className="font-semibold text-emerald-300">{reservedBuffer} spoons</span>
            </div>
          </div>

          {/* Manual adjustment trigger */}
          {!isAdjusting ? (
            <button
              onClick={() => {
                setSliderVal(currentSpoons);
                setIsAdjusting(true);
              }}
              className="mt-4 flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors w-fit"
            >
              <Sliders className="w-3 h-3 text-slate-500" />
              <span>Feel different? Adjust budget</span>
            </button>
          ) : (
            <div className="mt-4 p-3 bg-white/5 border border-white/10 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300">Set feel: {sliderVal.toFixed(1)} spoons</span>
                <span className="text-slate-400 text-[10px]">Zero judgment</span>
              </div>
              <input
                type="range"
                min="1.0"
                max="12.0"
                step="0.5"
                value={sliderVal}
                onChange={handleSliderChange}
                className="w-full accent-violet-400 h-1.5 bg-slate-700 rounded-lg cursor-pointer"
              />
              <div className="flex justify-end gap-2 pt-1">
                <button
                  onClick={handleCancelOverride}
                  className="px-2 py-1 text-[11px] text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveOverride}
                  disabled={isSaving}
                  className="px-3 py-1 text-[11px] font-semibold bg-violet-600 hover:bg-violet-500 text-white rounded-lg transition-colors"
                >
                  {isSaving ? 'Updating...' : 'Set Budget'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right: 12-Spoon Visual Grid / Shelf */}
        <div className="md:col-span-7 bg-slate-950/40 border border-white/5 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
            <span className="font-medium text-slate-300">12 Spoon Visual Shelf</span>
            <div className="flex items-center gap-3 text-[11px]">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-violet-500 shadow-sm shadow-violet-500/50" />
                <span>Active</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 border border-emerald-300/40" />
                <span>Buffer</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-700/60 border border-white/5" />
                <span>Spent</span>
              </span>
            </div>
          </div>

          {/* 12 Spoons Visual Slices */}
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2.5">
            {Array.from({ length: totalSpoons }).map((_, idx) => {
              const spoonIndex = idx + 1;
              const isActive = spoonIndex <= activeCount;
              const isBuffer = spoonIndex > activeCount && spoonIndex <= filledCount;
              const isSpent = spoonIndex > filledCount;

              let cardBg = 'bg-slate-800/30 border-white/5 text-slate-600';
              let iconGlow = '';

              if (isActive) {
                cardBg = 'bg-gradient-to-b from-violet-500/30 to-violet-600/20 border-violet-500/40 text-violet-200 shadow-lg shadow-violet-600/10';
                iconGlow = 'drop-shadow-[0_0_8px_rgba(139,92,246,0.6)]';
              } else if (isBuffer) {
                cardBg = 'bg-gradient-to-b from-emerald-500/25 to-teal-600/15 border-emerald-400/40 text-emerald-300 shadow-md shadow-emerald-500/10';
                iconGlow = 'drop-shadow-[0_0_6px_rgba(52,211,153,0.5)]';
              }

              return (
                <motion.div
                  key={idx}
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: idx * 0.02 }}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-xl border transition-all duration-300 relative group ${cardBg}`}
                >
                  {/* Custom Spoon SVG Illustration */}
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={isActive || isBuffer ? '2' : '1.5'}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={`w-6 h-6 transition-transform group-hover:scale-110 ${iconGlow}`}
                  >
                    {/* Spoon Bowl */}
                    <path d="M12 2C8.5 2 6 4.5 6 8c0 3 2 5.5 5 5.9V21a1 1 0 0 0 2 0v-7.1c3-.4 5-2.9 5-5.9 0-3.5-2.5-6-6-6z" />
                    {/* Inner liquid highlight when filled */}
                    {(isActive || isBuffer) && (
                      <ellipse
                        cx="12"
                        cy="8"
                        rx="3.5"
                        ry="4"
                        fill="currentColor"
                        fillOpacity={isActive ? '0.35' : '0.2'}
                      />
                    )}
                  </svg>
                  <span className="text-[10px] font-bold mt-1 text-slate-400">
                    #{spoonIndex}
                  </span>
                  {isBuffer && (
                    <span className="absolute -top-1 -right-1 flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                  )}
                </motion.div>
              );
            })}
          </div>

          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-white/5">
            <span>Burnout protection active</span>
            <span className="text-slate-300">20% buffer prevents over-allocation</span>
          </div>
        </div>
      </div>
    </div>
  );
}
