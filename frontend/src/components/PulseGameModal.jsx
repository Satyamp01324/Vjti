import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, CheckCircle2, Zap, ArrowRight, ShieldCheck } from 'lucide-react';
import { submitGameResult } from '../api';

/**
 * Pulse 20-Second Attention & Reaction Probe (FEAT-B1, FEAT-B2, FEAT-B3)
 *
 * Rules:
 * - 20 seconds total duration.
 * - Random stimulus intervals between 1.5s and 4.0s.
 * - Taps under 100ms are discarded as anticipatory guesses.
 * - Lapses (>1000ms with no tap) are recorded.
 * - Raw trial times stay local; only aggregate summary (median RT, MAD, lapses) is sent.
 * - Non-punitive skip button: zero penalty, no guilt messaging.
 * - No red error colors, no "Game Over" text.
 */
export default function PulseGameModal({ isOpen, onClose, userId, onComplete }) {
  // Game state: 'intro' | 'playing' | 'completed' | 'skipped'
  const [gameState, setGameState] = useState('intro');
  const [timeLeft, setTimeLeft] = useState(20);
  const [isStimulusActive, setIsStimulusActive] = useState(false);
  const [feedback, setFeedback] = useState(null); // 'quick' | 'valid' | 'miss'
  const [summary, setSummary] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Trial tracking in memory
  const trialsRef = useRef([]);
  const stimulusTimestampRef = useRef(null);
  const nextTrialTimeoutRef = useRef(null);
  const gameIntervalRef = useRef(null);
  const stimulusTimeoutRef = useRef(null);

  // Clean reset on modal open/close
  useEffect(() => {
    if (isOpen) {
      setGameState('intro');
      setTimeLeft(20);
      setIsStimulusActive(false);
      setFeedback(null);
      setSummary(null);
      trialsRef.current = [];
    } else {
      clearAllTimers();
    }
    return () => clearAllTimers();
  }, [isOpen]);

  const clearAllTimers = () => {
    if (nextTrialTimeoutRef.current) clearTimeout(nextTrialTimeoutRef.current);
    if (gameIntervalRef.current) clearInterval(gameIntervalRef.current);
    if (stimulusTimeoutRef.current) clearTimeout(stimulusTimeoutRef.current);
  };

  // Schedule the next stimulus with a random delay (1500ms - 4000ms)
  const scheduleNextStimulus = useCallback(() => {
    setIsStimulusActive(false);
    const delay = Math.floor(Math.random() * 2500) + 1500; // 1500ms to 4000ms

    nextTrialTimeoutRef.current = setTimeout(() => {
      setIsStimulusActive(true);
      stimulusTimestampRef.current = performance.now();

      // If no response within 1200ms, mark as a lapse
      stimulusTimeoutRef.current = setTimeout(() => {
        if (stimulusTimestampRef.current !== null) {
          trialsRef.current.push({ rt: 1200, isLapse: true });
          stimulusTimestampRef.current = null;
          setFeedback('miss');
          setTimeout(() => setFeedback(null), 400);
          scheduleNextStimulus();
        }
      }, 1200);
    }, delay);
  }, []);

  // Handle user tap or spacebar
  const handleTap = useCallback(() => {
    if (gameState !== 'playing') return;

    const now = performance.now();

    // If stimulus is not active, tap was anticipatory
    if (!isStimulusActive || stimulusTimestampRef.current === null) {
      return;
    }

    const rt = now - stimulusTimestampRef.current;
    stimulusTimestampRef.current = null;

    if (stimulusTimeoutRef.current) {
      clearTimeout(stimulusTimeoutRef.current);
    }

    // Ignore anticipatory taps under 100ms
    if (rt < 100) {
      setFeedback('quick');
      setTimeout(() => setFeedback(null), 300);
      scheduleNextStimulus();
      return;
    }

    // Valid trial
    trialsRef.current.push({ rt, isLapse: false });
    setFeedback('valid');
    setTimeout(() => setFeedback(null), 300);
    scheduleNextStimulus();
  }, [gameState, isStimulusActive, scheduleNextStimulus]);

  // Keyboard spacebar listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space') {
        e.preventDefault();
        handleTap();
      }
    };
    if (gameState === 'playing') {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, handleTap]);

  // Start the 20-second game loop
  const startGame = () => {
    setGameState('playing');
    setTimeLeft(20);
    trialsRef.current = [];
    scheduleNextStimulus();

    gameIntervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          endGame();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Compute local summary and submit to backend
  const endGame = async () => {
    clearAllTimers();
    setGameState('completed');
    setSubmitting(true);

    const validTrials = trialsRef.current.filter((t) => !t.isLapse && t.rt >= 100);
    const lapses = trialsRef.current.filter((t) => t.isLapse).length;

    let medianRt = 300;
    let variability = 20;

    if (validTrials.length > 0) {
      const rts = validTrials.map((t) => t.rt).sort((a, b) => a - b);
      const mid = Math.floor(rts.length / 2);
      medianRt = rts.length % 2 !== 0 ? rts[mid] : (rts[mid - 1] + rts[mid]) / 2;

      // Median Absolute Deviation (MAD)
      const deviations = rts.map((val) => Math.abs(val - medianRt)).sort((a, b) => a - b);
      variability = deviations.length % 2 !== 0 ? deviations[mid] : (deviations[mid - 1] + deviations[mid]) / 2;
    }

    const payload = {
      user_id: userId || 'anonymous',
      game: 'pulse',
      median_rt: Math.round(medianRt),
      lapses,
      variability: Math.round(variability),
      valid: validTrials.length >= 3,
      skipped: false,
      time_of_day: new Date().getHours() < 12 ? 'morning' : 'afternoon',
    };

    try {
      const resp = await submitGameResult(payload);
      setSummary(resp);
      if (onComplete) onComplete(resp);
    } catch (err) {
      console.warn('Game sync failed, using local result:', err);
      const localFallback = {
        status: 'success',
        message: 'Thanks. That helps me plan.',
        median_rt: Math.round(medianRt),
        probe_multiplier: 1.0,
      };
      setSummary(localFallback);
      if (onComplete) onComplete(localFallback);
    } finally {
      setSubmitting(false);
    }
  };

  // Non-punitive skip bailout (FR-GM-04)
  const handleSkip = async () => {
    clearAllTimers();
    setGameState('skipped');
    try {
      await submitGameResult({
        user_id: userId || 'anonymous',
        game: 'pulse',
        skipped: true,
      });
    } catch (e) {
      /* ignore */
    }
    setTimeout(() => {
      onClose();
    }, 400);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-lg bg-[#0f172a] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden text-center select-none"
      >
        {/* Top bar */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-xs uppercase tracking-wider font-semibold text-slate-400">
              20-Second Pulse Check
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Intro View */}
        {gameState === 'intro' && (
          <div className="py-6 space-y-6">
            <div className="w-20 h-20 mx-auto rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Zap size={36} className="animate-pulse" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-white">How responsive is your brain right now?</h3>
              <p className="text-sm text-slate-400 mt-2 max-w-sm mx-auto leading-relaxed">
                When the circle glows green, tap the screen or press <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-xs border border-white/10">Space</kbd>. Takes only 20 seconds.
              </p>
            </div>

            <div className="flex flex-col gap-3 pt-2">
              <button
                onClick={startGame}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-medium shadow-lg shadow-emerald-500/25 transition active:scale-[0.99]"
              >
                Start Check-in (20s)
              </button>
              <button
                onClick={handleSkip}
                className="w-full py-2.5 text-xs text-slate-400 hover:text-slate-200 transition"
              >
                Skip, just use my schedule
              </button>
            </div>
          </div>
        )}

        {/* Playing View */}
        {gameState === 'playing' && (
          <div className="py-6 flex flex-col items-center">
            {/* Countdown timer pill */}
            <div className="px-3.5 py-1 rounded-full bg-slate-800/80 border border-white/10 text-xs text-slate-300 font-mono mb-8">
              {timeLeft}s remaining
            </div>

            {/* Tap stimulus orb */}
            <div
              onClick={handleTap}
              className="w-56 h-56 rounded-full flex items-center justify-center cursor-pointer transition-all duration-150 relative active:scale-95"
            >
              <div
                className={`w-44 h-44 rounded-full transition-all duration-100 flex items-center justify-center shadow-2xl ${
                  isStimulusActive
                    ? 'bg-gradient-to-tr from-emerald-400 to-teal-300 scale-110 shadow-emerald-500/50'
                    : 'bg-slate-800/60 border border-white/10 hover:border-white/20'
                }`}
              >
                <span className="text-xs uppercase tracking-widest font-semibold text-white/70">
                  {isStimulusActive ? 'TAP NOW!' : 'Wait for glow...'}
                </span>
              </div>

              {/* Gentle ripple ring */}
              {isStimulusActive && (
                <div className="absolute inset-0 rounded-full border-2 border-emerald-400/40 animate-ping"></div>
              )}
            </div>

            {/* Subtle feedback indicator */}
            <div className="h-6 mt-6">
              {feedback === 'valid' && (
                <span className="text-xs text-emerald-400 font-medium animate-in fade-in">✓ Got it</span>
              )}
              {feedback === 'quick' && (
                <span className="text-xs text-amber-400 font-medium animate-in fade-in">Too early — wait for glow</span>
              )}
              {feedback === 'miss' && (
                <span className="text-xs text-slate-500 font-medium animate-in fade-in">No worries, continuing</span>
              )}
            </div>

            {/* Skip bailout during game */}
            <button
              onClick={handleSkip}
              className="mt-6 text-xs text-slate-500 hover:text-slate-400 transition"
            >
              Skip, just use my schedule
            </button>
          </div>
        )}

        {/* Completed View */}
        {gameState === 'completed' && (
          <div className="py-6 space-y-6">
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <CheckCircle2 size={32} />
            </div>

            <div>
              <h3 className="text-xl font-semibold text-white">Thanks. That helps me plan.</h3>
              <p className="text-sm text-slate-400 mt-2">
                We've adjusted your energy budget to match your focus today. No grades, no pressure.
              </p>
            </div>

            {summary && (
              <div className="p-4 rounded-2xl bg-slate-800/40 border border-white/5 grid grid-cols-2 gap-4 text-left">
                <div>
                  <span className="text-[11px] uppercase tracking-wider text-slate-500">Response Speed</span>
                  <p className="text-lg font-semibold text-white mt-0.5">
                    {summary.median_rt || 300} ms
                  </p>
                </div>
                <div>
                  <span className="text-[11px] uppercase tracking-wider text-slate-500">Capacity Multiplier</span>
                  <p className="text-lg font-semibold text-emerald-400 mt-0.5">
                    ×{summary.probe_multiplier || 1.0}
                  </p>
                </div>
              </div>
            )}

            <button
              onClick={onClose}
              className="w-full py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium border border-white/10 transition"
            >
              See Today's Plan
            </button>
          </div>
        )}

        {/* Skipped View */}
        {gameState === 'skipped' && (
          <div className="py-8 space-y-3">
            <ShieldCheck size={36} className="text-slate-400 mx-auto" />
            <h3 className="text-base font-medium text-white">Using your normal schedule</h3>
            <p className="text-xs text-slate-500">Zero penalty applied. Have a calm session.</p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
