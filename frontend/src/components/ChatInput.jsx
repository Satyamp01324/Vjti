import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Sparkles, BrainCircuit, Clock, Mic } from 'lucide-react';
import VoiceButton from './VoiceButton';
import { analyzeText } from '../api';

const suggestions = [
  { id: 1, text: "Schedule deep work", icon: BrainCircuit },
  { id: 2, text: "I'm feeling exhausted", icon: Clock },
  { id: 3, text: "Analyze my mood", icon: Sparkles },
];

const ChatInput = ({ onSendMessage, onAnalysisComplete, userId }) => {
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const textareaRef = useRef(null);

  const handleInput = (e) => {
    setInput(e.target.value);
    setIsTyping(e.target.value.length > 0);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    setIsAnalyzing(true);

    try {
      // Call the backend API to analyze the text
      const result = await analyzeText(input, userId);
      console.log('Analysis result:', result);

      // Pass the result to parent component
      if (onSendMessage) {
        onSendMessage(input, result);
      }

      // Update dashboard immediately with the result
      if (onAnalysisComplete) {
        onAnalysisComplete(result);
      }

      // Clear input
      setInput('');
      setIsTyping(false);
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
    } catch (error) {
      console.error('Error analyzing text:', error);
      alert('Failed to analyze text. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleVoiceResult = (result) => {
    console.log("Voice Result in ChatInput:", result);
    if (!result) return;

    // Set text in input for visibility
    const text = result.transcription?.text || result.input_text || "";
    setInput(text);

    // Pass full analysis up to dashboard
    if (result.status === 'success') {
      if (onSendMessage) {
        onSendMessage(text, result);
      }
      if (onAnalysisComplete) {
        onAnalysisComplete(result);
      }
    }
  };

  return (
    <div className="relative w-full max-w-2xl mx-auto">
      <AnimatePresence>
        {isAnalyzing && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="absolute -top-10 left-0 right-0 flex items-center justify-center gap-2 text-emerald-400 text-sm font-medium z-10"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            >
              <BrainCircuit size={16} />
            </motion.div>
            <span>Analyzing cognitive signals...</span>
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit}>
        <div className="bg-[#151922] border border-white/[0.08] rounded-xl p-3 transition-all duration-200 focus-within:border-emerald-500/30">
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
            className="w-full bg-transparent text-white text-sm placeholder-slate-500 resize-none outline-none min-h-[44px] max-h-[160px] scrollbar-hide"
            rows={1}
          />

          <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/[0.04]">
            <div className="flex gap-1">
              <button type="button" className="p-1.5 text-slate-500 hover:text-slate-300 transition-colors rounded-md hover:bg-white/5">
                <Sparkles size={16} />
              </button>
              <VoiceButton onVoiceResult={handleVoiceResult} userId={userId} />
            </div>

            <button
              type="submit"
              disabled={!input.trim() || isAnalyzing}
              className={`
                flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200
                ${input.trim()
                  ? 'bg-emerald-500 text-white hover:bg-emerald-400'
                  : 'bg-white/5 text-slate-500 cursor-not-allowed'}
              `}
            >
              {isAnalyzing ? (
                <div className="flex gap-1">
                  <span className="w-1 h-1 bg-current rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1 h-1 bg-current rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1 h-1 bg-current rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              ) : (
                <>
                  <span>Send</span>
                  <Send size={14} />
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Suggestions */}
      <div className="flex flex-wrap gap-2 mt-3 justify-start">
        <AnimatePresence>
          {!isTyping && !isAnalyzing && suggestions.map((s) => (
            <motion.button
              key={s.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              whileHover={{ scale: 1.02 }}
              onClick={() => setInput(s.text)}
              className="px-3 py-1.5 bg-white/[0.04] border border-white/[0.06] rounded-lg text-xs text-slate-400 flex items-center gap-1.5 hover:bg-white/[0.06] hover:text-slate-300 transition-colors"
            >
              <s.icon size={12} className="text-emerald-400/70" />
              {s.text}
            </motion.button>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ChatInput;
