import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Sparkles, Zap, BrainCircuit, Clock } from 'lucide-react';
import clsx from 'clsx';
import VoiceButton from './VoiceButton';

const suggestions = [
  { id: 1, text: "Schedule deep work", icon: BrainCircuit },
  { id: 2, text: "I'm feeling exhausted", icon: Zap },
  { id: 3, text: "Prepare for exam", icon: Clock },
];

const ChatInput = ({ onSendMessage }) => {
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const textareaRef = useRef(null);

  const handleInput = (e) => {
    setInput(e.target.value);
    setIsTyping(e.target.value.length > 0);
    // Auto-resize
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    setIsAnalyzing(true);
    
    // Simulate AI Analysis
    setTimeout(() => {
      onSendMessage(input);
      setInput('');
      setIsTyping(false);
      setIsAnalyzing(false);
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
    }, 2000);
  };

  return (
    <div className="relative w-full max-w-2xl mx-auto">
      <AnimatePresence>
        {isAnalyzing && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute -top-12 left-0 right-0 flex items-center justify-center gap-2 text-emerald-400 font-medium z-10"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            >
              <BrainCircuit size={18} />
            </motion.div>
            <span>Analyzing cognitive signals...</span>
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit} className="relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500/30 to-cyan-500/30 rounded-2xl blur opacity-30 group-hover:opacity-60 transition duration-500"></div>
        
        <div className="relative bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl transition-all duration-300 group-focus-within:border-emerald-500/50 group-focus-within:shadow-[0_0_30px_rgba(16,185,129,0.1)]">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleInput}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            placeholder="Tell me what your brain needs to handle today..."
            className="w-full bg-transparent text-white placeholder-slate-500 resize-none outline-none text-lg min-h-[60px] max-h-[200px] scrollbar-hide"
            rows={1}
          />

          <div className="flex items-center justify-between mt-4 border-t border-white/5 pt-3">
            <div className="flex gap-2">
              <button type="button" className="p-2 text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-white/5">
                <Sparkles size={18} />
              </button>
              <VoiceButton />
            </div>

            <button
              type="submit"
              disabled={!input.trim() || isAnalyzing}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300 font-medium
                ${input.trim() 
                  ? 'bg-emerald-500 text-white hover:bg-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.4)]' 
                  : 'bg-white/5 text-slate-500 cursor-not-allowed hover:bg-white/10'}
              `}
            >
              {isAnalyzing ? (
                <motion.div className="flex gap-1">
                  <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </motion.div>
              ) : (
                <>
                  <span>Send</span>
                  <Send size={16} />
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Suggestions */}
      <motion.div 
        layout
        className="flex flex-wrap gap-2 mt-4 justify-center"
      >
        <AnimatePresence>
          {!isTyping && !isAnalyzing && suggestions.map((s) => (
            <motion.button
              key={s.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.1)" }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setInput(s.text)}
              className="px-4 py-2 bg-white/5 border border-white/10 rounded-full text-sm text-slate-300 flex items-center gap-2 hover:border-white/20 transition-colors backdrop-blur-md"
            >
              <s.icon size={14} className="text-emerald-400" />
              {s.text}
            </motion.button>
          ))}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default ChatInput;
