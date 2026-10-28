import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Check,
  Clock,
  ChevronDown,
  ChevronUp,
  Microscope,
  Sparkles,
  Lightbulb,
  Phone,
  Heart,
  Loader2,
} from 'lucide-react';
import { shrinkTask, shrinkSmaller, getCopingStrategies } from '../api';

/**
 * TaskShrinkerModal Component (FEAT-D1, D2, D3, D4, D5)
 *
 * Anti-paralysis micro-step shrinker:
 * - Breaks overwhelming tasks into tiny, doable steps with AI sequencing
 * - "Smaller Please" recursive sub-divider on each step
 * - Coping strategy card with task-type-specific advice
 * - Crisis / diagnostic redirect handling with warm, zero-shame language
 * - Garden XP awards for each step completed
 * - Confetti celebration when all steps done
 */
export default function TaskShrinkerModal({
  isOpen,
  onClose,
  task,
  userId,
  liveSpoons = 6.0,
  onStepCompleted,
}) {
  const [sequence, setSequence] = useState(null);
  const [loading, setLoading] = useState(false);
  const [completedSteps, setCompletedSteps] = useState(new Set());
  const [expandedWhys, setExpandedWhys] = useState(new Set());
  const [subSteps, setSubSteps] = useState(new Map());
  const [loadingSmaller, setLoadingSmaller] = useState(null);
  const [userNote, setUserNote] = useState('');
  const [error, setError] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);

  const modalRef = useRef(null);
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Reset state when modal opens with a new task
  useEffect(() => {
    if (isOpen && task) {
      setSequence(null);
      setLoading(false);
      setCompletedSteps(new Set());
      setExpandedWhys(new Set());
      setSubSteps(new Map());
      setLoadingSmaller(null);
      setUserNote('');
      setError(null);
      setShowConfetti(false);
    }
  }, [isOpen, task?.id]);

  // Escape key handler
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  // Focus trap
  useEffect(() => {
    if (!isOpen || !modalRef.current) return;
    const focusable = modalRef.current.querySelectorAll(
      'button, [href], input, textarea, select, [tabindex]:not([tabindex="-1"])'
    );
    if (focusable.length) focusable[0].focus();
  }, [isOpen, sequence]);

  const handleBreakDown = useCallback(async () => {
    if (!task) return;
    setLoading(true);
    setError(null);
    try {
      const result = await shrinkTask({
        title: task.title,
        taskType: task.task_type || 'other',
        liveSpoons,
        userNote,
        userId,
      });
      setSequence(result);
    } catch (err) {
      setError('We couldn\'t reach the server right now. You can try again whenever you\'re ready. 💜');
      console.warn('Shrink task error:', err);
    } finally {
      setLoading(false);
    }
  }, [task, liveSpoons, userNote, userId]);

  const handleSmallerPlease = useCallback(async (stepIndex, step) => {
    setLoadingSmaller(stepIndex);
    try {
      const result = await shrinkSmaller({
        stepText: step.text,
        taskType: task?.task_type || 'other',
        recursionDepth: step._depth || 0,
        userId,
      });
      setSubSteps((prev) => {
        const next = new Map(prev);
        next.set(stepIndex, result);
        return next;
      });
    } catch (err) {
      console.warn('Smaller step error:', err);
    } finally {
      setLoadingSmaller(null);
    }
  }, [task, userId]);

  const handleToggleStep = useCallback((stepIndex) => {
    setCompletedSteps((prev) => {
      const next = new Set(prev);
      if (next.has(stepIndex)) {
        next.delete(stepIndex);
      } else {
        next.add(stepIndex);
        // Award XP
        if (onStepCompleted) {
          onStepCompleted({
            taskId: task?.id,
            stepIndex,
            gardenXP: 5,
          });
        }
      }
      return next;
    });
  }, [task, onStepCompleted]);

  const toggleWhy = useCallback((idx) => {
    setExpandedWhys((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  }, []);

  // Celebrate when all steps completed
  const steps = sequence?.steps || [];
  const totalSteps = steps.length;
  const completedCount = completedSteps.size;
  const allDone = totalSteps > 0 && completedCount === totalSteps;

  useEffect(() => {
    if (allDone && !showConfetti) {
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [allDone]);

  if (!isOpen) return null;

  const noteChips = [
    'I feel stuck',
    "I can't start",
    "It's overwhelming",
    "I don't know where to begin",
  ];

  const isCrisis = sequence?.type === 'crisis_redirect';
  const isDiagnostic = sequence?.type === 'diagnostic_redirect';
  const sourceBadge = sequence?.source;

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-label="Task breakdown helper"
      >
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-md"
        />

        {/* Modal Panel */}
        <motion.div
          ref={modalRef}
          initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95, y: 16 }}
          animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
          exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95, y: 16 }}
          className="relative w-full max-w-2xl bg-slate-900 border border-white/10 rounded-3xl p-6 sm:p-7 shadow-2xl z-10 max-h-[90vh] overflow-y-auto"
        >
          {/* ── Header ─────────────────────────────────── */}
          <div className="flex items-start justify-between pb-4 border-b border-white/10">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold text-white">🧩 Let's Break This Down</h3>
                {sourceBadge && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                      sourceBadge === 'ai' || sourceBadge === 'gemini'
                        ? 'bg-violet-500/20 text-violet-300 border-violet-500/30'
                        : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                    }`}
                  >
                    {sourceBadge === 'ai' || sourceBadge === 'gemini' ? '✨ AI-Powered' : '📋 Offline Template'}
                  </span>
                )}
              </div>
              {task && (
                <p className="text-sm text-violet-300 mt-1 truncate">{task.title}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 ml-3 flex-shrink-0"
              aria-label="Close breakdown helper"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* ── Crisis Redirect ────────────────────────── */}
          {isCrisis && (
            <div className="mt-5 p-5 rounded-2xl bg-gradient-to-br from-violet-900/40 to-indigo-900/40 border border-violet-500/20">
              <p className="text-base text-white font-medium leading-relaxed mb-4">
                {sequence.message || 'We noticed you might be going through something tough. You\'re not alone. 💜'}
              </p>
              {sequence.helplines && sequence.helplines.length > 0 && (
                <div className="space-y-2.5">
                  {sequence.helplines.map((line, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10"
                    >
                      <div className="flex items-center gap-2.5">
                        <Phone className="w-4 h-4 text-violet-300" />
                        <div>
                          <span className="text-sm font-semibold text-white">{line.name}</span>
                          {line.availability && (
                            <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              {line.availability}
                            </span>
                          )}
                        </div>
                      </div>
                      <a
                        href={`tel:${line.number}`}
                        className="text-sm font-bold text-violet-300 hover:text-violet-200 underline"
                        aria-label={`Call ${line.name} at ${line.number}`}
                      >
                        {line.number}
                      </a>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-xs text-slate-300 mt-4 text-center">
                Reaching out takes courage. We're proud of you. 💜
              </p>
            </div>
          )}

          {/* ── Diagnostic Redirect ────────────────────── */}
          {isDiagnostic && (
            <div className="mt-5 p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30">
              <p className="text-sm text-amber-200 font-medium leading-relaxed mb-3">
                {sequence.message || 'This seems like it could use a different approach. Let\'s pivot together.'}
              </p>
              {sequence.suggestion && (
                <p className="text-xs text-slate-300 mb-4">{sequence.suggestion}</p>
              )}
              <button
                onClick={() => {
                  setSequence(null);
                  setUserNote('');
                  setError(null);
                }}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold transition-colors"
                aria-label="Reset and plan study tasks"
              >
                Let's plan your study tasks instead
              </button>
            </div>
          )}

          {/* ── Pre-Sequence: User Note Input ──────────── */}
          {!sequence && !loading && !isCrisis && !isDiagnostic && (
            <div className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5" htmlFor="shrink-note">
                  How are you feeling about this task?
                </label>
                <input
                  id="shrink-note"
                  type="text"
                  value={userNote}
                  onChange={(e) => setUserNote(e.target.value)}
                  placeholder="Share anything — there's no wrong answer here"
                  className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors"
                  aria-label="How are you feeling about this task"
                />
              </div>

              {/* Quick-select chips */}
              <div className="flex flex-wrap gap-2">
                {noteChips.map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => setUserNote(chip)}
                    className={`px-3 py-1.5 rounded-xl text-xs border transition-all ${
                      userNote === chip
                        ? 'bg-violet-600/30 border-violet-500/50 text-violet-200'
                        : 'bg-slate-800/60 border-white/10 text-slate-300 hover:border-violet-500/30 hover:text-violet-200'
                    }`}
                    aria-label={`Select: ${chip}`}
                  >
                    {chip}
                  </button>
                ))}
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200">
                  {error}
                </div>
              )}

              <button
                onClick={handleBreakDown}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-violet-500 hover:from-violet-500 hover:to-violet-400 text-white text-sm font-bold transition-all shadow-lg shadow-violet-600/20"
                aria-label="Break down this task into smaller steps"
              >
                🧩 Break it down
              </button>
            </div>
          )}

          {/* ── Loading State ──────────────────────────── */}
          {loading && (
            <div className="mt-8 flex flex-col items-center justify-center py-10 space-y-3">
              <Loader2 className={`w-8 h-8 text-violet-400 ${prefersReducedMotion ? '' : 'animate-spin'}`} />
              <p className="text-sm text-slate-300 text-center">
                Breaking your task into tiny, doable steps
                <span className={prefersReducedMotion ? '' : 'animate-pulse'}>...</span>
              </p>
            </div>
          )}

          {/* ── Steps Display ──────────────────────────── */}
          {sequence && !isCrisis && !isDiagnostic && steps.length > 0 && (
            <div className="mt-5 space-y-3">
              {steps.map((step, idx) => {
                const isChecked = completedSteps.has(idx);
                const isWhyOpen = expandedWhys.has(idx);
                const sub = subSteps.get(idx);
                const isSmallerLoading = loadingSmaller === idx;

                return (
                  <div key={idx} className="space-y-1">
                    {/* Step Card */}
                    <div
                      className={`p-3.5 rounded-2xl border transition-all ${
                        isChecked
                          ? 'bg-emerald-950/20 border-emerald-500/30'
                          : 'bg-slate-800/50 border-white/5 hover:border-white/15'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Checkbox */}
                        <button
                          onClick={() => handleToggleStep(idx)}
                          className="mt-0.5 flex-shrink-0 transition-colors"
                          aria-label={`${isChecked ? 'Unmark' : 'Mark'} step ${idx + 1} as done`}
                        >
                          {isChecked ? (
                            <motion.div
                              initial={prefersReducedMotion ? {} : { scale: 0.5 }}
                              animate={{ scale: 1 }}
                              className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center"
                            >
                              <Check className="w-3 h-3 text-white" />
                            </motion.div>
                          ) : (
                            <div className="w-5 h-5 rounded-full border-2 border-slate-600 hover:border-violet-400 transition-colors" />
                          )}
                        </button>

                        {/* Position Badge */}
                        <span className="flex-shrink-0 w-5 h-5 rounded-full bg-violet-600 text-white text-[10px] font-bold flex items-center justify-center mt-0.5">
                          {idx + 1}
                        </span>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <p
                            className={`text-sm leading-relaxed ${
                              isChecked ? 'line-through text-slate-400' : 'text-white'
                            }`}
                          >
                            {step.text}
                          </p>

                          {/* Badges Row */}
                          <div className="flex flex-wrap items-center gap-2 mt-1.5">
                            {step.minutes && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-700 text-[10px] text-slate-300">
                                <Clock className="w-2.5 h-2.5" />
                                {step.minutes} min
                              </span>
                            )}
                            {step.spoon_cost && (
                              <span className="px-2 py-0.5 rounded-lg bg-slate-700 text-[10px] text-slate-300">
                                🥄 {step.spoon_cost}
                              </span>
                            )}

                            {/* "Why this works" toggle */}
                            {step.why && (
                              <button
                                onClick={() => toggleWhy(idx)}
                                className="inline-flex items-center gap-1 text-[10px] text-violet-300 hover:text-violet-200 transition-colors"
                                aria-label={`${isWhyOpen ? 'Hide' : 'Show'} why this step works`}
                              >
                                {isWhyOpen ? (
                                  <ChevronUp className="w-3 h-3" />
                                ) : (
                                  <ChevronDown className="w-3 h-3" />
                                )}
                                Why this works
                              </button>
                            )}

                            {/* Smaller Please button */}
                            {!isChecked && (
                              <button
                                onClick={() => handleSmallerPlease(idx, step)}
                                disabled={isSmallerLoading}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border border-violet-500/30 text-[10px] text-violet-300 hover:bg-violet-500/15 hover:text-violet-200 transition-all opacity-0 group-hover:opacity-100 sm:opacity-100"
                                aria-label={`Break step ${idx + 1} into even smaller pieces`}
                              >
                                {isSmallerLoading ? (
                                  <Loader2 className="w-2.5 h-2.5 animate-spin" />
                                ) : (
                                  <Microscope className="w-2.5 h-2.5" />
                                )}
                                Smaller Please 🔬
                              </button>
                            )}

                            {/* XP badge on completion */}
                            {isChecked && (
                              <motion.span
                                initial={prefersReducedMotion ? {} : { scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="px-2 py-0.5 rounded-lg bg-emerald-500/20 text-[10px] text-emerald-300 font-semibold border border-emerald-500/30"
                              >
                                +5 XP 🌱
                              </motion.span>
                            )}
                          </div>

                          {/* Why explanation */}
                          <AnimatePresence>
                            {isWhyOpen && step.why && (
                              <motion.p
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mt-2 text-xs text-slate-400 italic leading-relaxed overflow-hidden"
                              >
                                {step.why}
                              </motion.p>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    </div>

                    {/* Sub-steps from "Smaller Please" */}
                    {sub && (
                      <div className="ml-8 pl-3 border-l-2 border-violet-500/30 space-y-1.5">
                        {sub.max_reached ? (
                          <div className="p-3 rounded-xl bg-violet-950/30 border border-violet-500/20 text-xs text-violet-200 text-center">
                            You've reached the smallest step. Being here is enough. 💜
                          </div>
                        ) : (
                          sub.sub_steps &&
                          sub.sub_steps.map((ss, si) => (
                            <div
                              key={si}
                              className="p-2.5 rounded-xl bg-slate-800/40 border border-white/5 text-xs text-slate-200 flex items-start gap-2"
                            >
                              <span className="flex-shrink-0 w-4 h-4 rounded-full bg-violet-500/30 text-violet-300 text-[9px] font-bold flex items-center justify-center mt-0.5">
                                {si + 1}
                              </span>
                              <div className="flex-1">
                                <p>{ss.text}</p>
                                {ss.minutes && (
                                  <span className="inline-flex items-center gap-1 mt-1 text-[10px] text-slate-400">
                                    <Clock className="w-2.5 h-2.5" />
                                    {ss.minutes} min
                                  </span>
                                )}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* ── Coping Strategy Card ───────────────────── */}
          {sequence && sequence.strategy && !isCrisis && (
            <div className="mt-5 p-4 rounded-2xl bg-violet-500/10 border border-violet-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb className="w-4 h-4 text-violet-300" />
                <span className="text-xs font-bold text-violet-200">Strategy</span>
              </div>
              <p className="text-sm text-white leading-relaxed">{sequence.strategy.text || sequence.strategy}</p>
              {sequence.strategy.source && (
                <p className="text-[10px] text-slate-400 mt-2">Source: {sequence.strategy.source}</p>
              )}
            </div>
          )}

          {/* ── Progress Footer ────────────────────────── */}
          {sequence && !isCrisis && !isDiagnostic && totalSteps > 0 && (
            <div className="mt-5 pt-4 border-t border-white/10">
              {/* Progress bar */}
              <div className="h-2 rounded-full bg-slate-800 overflow-hidden mb-2">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-violet-500 to-emerald-400"
                  initial={{ width: 0 }}
                  animate={{ width: `${(completedCount / totalSteps) * 100}%` }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                />
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">
                  Steps completed: {completedCount}/{totalSteps}
                </span>

                {allDone && (
                  <motion.span
                    initial={prefersReducedMotion ? {} : { scale: 0 }}
                    animate={{ scale: 1 }}
                    className="text-emerald-300 font-semibold"
                  >
                    Great work! Every tiny step counts. 🌱
                  </motion.span>
                )}
              </div>

              {/* Confetti burst */}
              {showConfetti && !prefersReducedMotion && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-center mt-3 text-2xl"
                  aria-hidden="true"
                >
                  🎉🎊✨🌟🎉
                </motion.div>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
