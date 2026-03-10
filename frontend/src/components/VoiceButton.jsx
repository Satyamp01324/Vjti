import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff } from 'lucide-react';
import { analyzeVoice } from '../api';

const VoiceButton = ({ onVoiceResult, userId }) => {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });

        if (audioBlob.size < 1000) {
          console.warn('Audio recording too short:', audioBlob.size);
          alert('Recording too short. Please speak for at least 3 seconds.');
          return;
        }

        await sendAudioToBackend(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start(200); // Collect data every 200ms
      setIsListening(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Could not access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setIsListening(false);
      setIsProcessing(true);
    }
  };

  const sendAudioToBackend = async (audioBlob) => {
    try {
      const audioFile = new File([audioBlob], 'recording.webm', { type: 'audio/webm' });
      const result = await analyzeVoice(audioFile, userId);
      if (result.status === 'error') {
        alert(`Analysis Failed: ${result.error}\n${result.details || ''}`);
      } else if (onVoiceResult) {
        onVoiceResult(result);
      }
    } catch (error) {
      console.error('Error analyzing voice:', error);
      alert('Failed to analyze voice. Server error.');
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleListening = () => {
    if (isListening) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <div className="relative flex items-center justify-center">
      <AnimatePresence>
        {isListening && (
          <motion.div
            initial={{ scale: 1, opacity: 0.5 }}
            animate={{ scale: 1.5, opacity: 0 }}
            exit={{ scale: 1, opacity: 0 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
            className="absolute inset-0 bg-emerald-500 rounded-full blur-xl"
          />
        )}
      </AnimatePresence>

      <motion.button
        type="button"
        onClick={toggleListening}
        whileTap={{ scale: 0.9 }}
        disabled={isProcessing}
        className={`
          relative z-10 p-1.5 rounded-lg flex items-center justify-center transition-all duration-300 border border-white/10
          ${isListening ? 'bg-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.5)]' : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'}
          ${isProcessing ? 'animate-pulse bg-amber-500 text-white cursor-not-allowed' : ''}
        `}
      >
        {isProcessing ? (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity }}
            className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
          />
        ) : (
          isListening ? <MicOff size={16} /> : <Mic size={16} />
        )}
      </motion.button>

      {/* Waveform Visualization (when listening) */}
      <AnimatePresence>
        {isListening && (
          <motion.div
            initial={{ opacity: 0, scaleY: 0 }}
            animate={{ opacity: 1, scaleY: 1 }}
            exit={{ opacity: 0, scaleY: 0 }}
            className="absolute -right-16 top-1/2 -translate-y-1/2 flex items-center gap-1 h-6 pointer-events-none"
          >
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                className="w-1 bg-emerald-400 rounded-full"
                animate={{ height: [8, 20, 8] }}
                transition={{
                  duration: 0.5,
                  repeat: Infinity,
                  delay: i * 0.1,
                  repeatType: "mirror"
                }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default VoiceButton;
