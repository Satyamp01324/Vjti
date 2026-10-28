import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Coffee, X, Plus, Sparkles, Check, Clock, Heart } from 'lucide-react';
import { getDopamineMenu, engageDopamineItem, addDopamineItem } from '../api';

/**
 * DopamineMenuModal Component (FEAT-E4)
 *
 * Micro-activity off-ramp drawer for cognitive fatigue:
 * - Suggested when spoons drop below 3.0
 * - Engaging in activities restores +0.2 to +0.5 spoons
 * - Allows user to add custom favorite micro-activities
 */
export default function DopamineMenuModal({
  isOpen,
  onClose,
  userId,
  onEngageSuccess,
}) {
  const [menu, setMenu] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [engagedItem, setEngagedItem] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newEmoji, setNewEmoji] = useState('✨');
  const [newCredit, setNewCredit] = useState(0.2);

  const fetchMenu = async () => {
    try {
      setIsLoading(true);
      const res = await getDopamineMenu(userId);
      if (res && res.menu) setMenu(res.menu);
    } catch (err) {
      console.error('Failed to load dopamine menu:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchMenu();
      setEngagedItem(null);
      setIsAdding(false);
    }
  }, [isOpen, userId]);

  const handleEngage = async (item) => {
    try {
      const res = await engageDopamineItem(userId, item.id);
      setEngagedItem(res?.result || item);
      if (onEngageSuccess) onEngageSuccess(res);
      setTimeout(() => {
        setEngagedItem(null);
        onClose();
      }, 1500);
    } catch (err) {
      console.error('Engage error:', err);
    }
  };

  const handleAddCustom = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    try {
      await addDopamineItem(userId, {
        title: newTitle,
        emoji: newEmoji,
        spoon_credit: parseFloat(newCredit),
        minutes: 5,
      });
      setNewTitle('');
      setIsAdding(false);
      await fetchMenu();
    } catch (err) {
      console.error('Add item error:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-md"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          className="relative w-full max-w-lg bg-slate-900 border border-white/10 rounded-3xl p-6 sm:p-7 shadow-2xl z-10 max-h-[85vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-500/15 text-amber-300 border border-amber-500/30">
                <Coffee className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Dopamine Menu</h3>
                <span className="text-[11px] text-slate-400">
                  Low-friction pauses to restore spoons & prevent overwhelm
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {engagedItem ? (
            /* Celebration State */
            <div className="py-10 text-center space-y-2">
              <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto text-2xl">
                {engagedItem.emoji || '✨'}
              </div>
              <h4 className="text-base font-bold text-white">{engagedItem.title}</h4>
              <p className="text-xs text-emerald-300">
                +{engagedItem.spoon_credit} spoons restored & garden tended! 🌱
              </p>
            </div>
          ) : (
            <div className="mt-4 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-300">
                  Pick any micro-activity to take a restful off-ramp:
                </span>
                <button
                  onClick={() => setIsAdding(!isAdding)}
                  className="flex items-center gap-1 text-[11px] text-amber-400 hover:text-amber-300 font-medium"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isAdding ? 'Cancel' : 'Add Custom'}</span>
                </button>
              </div>

              {/* Add Custom Input Form */}
              {isAdding && (
                <form
                  onSubmit={handleAddCustom}
                  className="p-3 rounded-2xl bg-slate-800/60 border border-white/10 space-y-2.5 text-xs"
                >
                  <div className="grid grid-cols-4 gap-2">
                    <input
                      type="text"
                      value={newEmoji}
                      onChange={(e) => setNewEmoji(e.target.value)}
                      placeholder="Emoji"
                      className="col-span-1 bg-slate-900 border border-white/10 rounded-xl px-2 py-1.5 text-center text-white text-sm"
                    />
                    <input
                      type="text"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      placeholder="Activity name (e.g. Pet my dog)"
                      required
                      className="col-span-3 bg-slate-900 border border-white/10 rounded-xl px-3 py-1.5 text-white placeholder-slate-500"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">Spoons restored: +0.2</span>
                    <button
                      type="submit"
                      className="px-3 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-medium text-xs"
                    >
                      Save Item
                    </button>
                  </div>
                </form>
              )}

              {/* Menu Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {menu.map((item) => (
                  <motion.button
                    key={item.id}
                    whileHover={{ scale: 1.02, y: -1 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleEngage(item)}
                    className="flex items-center justify-between p-3 rounded-2xl bg-slate-800/40 border border-white/5 hover:border-amber-500/40 text-left transition-all group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-xl group-hover:scale-110 transition-transform flex-shrink-0">
                        {item.emoji}
                      </span>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-white truncate">
                          {item.title}
                        </div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                          <Clock className="w-2.5 h-2.5" />
                          <span>{item.minutes || 5} min</span>
                        </div>
                      </div>
                    </div>
                    <span className="text-[11px] font-bold text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-lg flex-shrink-0 ml-2">
                      +{item.spoon_credit} 🥄
                    </span>
                  </motion.button>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
