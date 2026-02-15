import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X } from 'lucide-react';

const PWAInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handleInstallPrompt = (e) => {
      setDeferredPrompt(e.detail);
      setShowPrompt(true);
    };

    window.addEventListener('pwaInstallAvailable', handleInstallPrompt);

    return () => {
      window.removeEventListener('pwaInstallAvailable', handleInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    console.log(`User response to install prompt: ${outcome}`);
    
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    // Remember dismissal for 7 days
    localStorage.setItem('pwaPromptDismissed', Date.now().toString());
  };

  // Check if user dismissed recently
  useEffect(() => {
    const dismissed = localStorage.getItem('pwaPromptDismissed');
    if (dismissed) {
      const dismissedTime = parseInt(dismissed);
      const daysSinceDismissal = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24);
      if (daysSinceDismissal < 7) {
        setShowPrompt(false);
      }
    }
  }, []);

  if (!showPrompt || !deferredPrompt) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 max-w-md w-full mx-4"
      >
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl p-4 shadow-2xl border border-white/10">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Download className="text-white" size={20} />
            </div>
            
            <div className="flex-1">
              <h3 className="text-white font-semibold text-sm mb-1">
                Install NeuroPilot
              </h3>
              <p className="text-white/80 text-xs mb-3">
                Install our app for a better experience. Works offline and loads faster!
              </p>
              
              <div className="flex gap-2">
                <button
                  onClick={handleInstall}
                  className="flex-1 bg-white text-emerald-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-white/90 transition-colors"
                >
                  Install
                </button>
                <button
                  onClick={handleDismiss}
                  className="px-4 py-2 bg-white/10 text-white rounded-lg text-sm font-medium hover:bg-white/20 transition-colors"
                >
                  Not now
                </button>
              </div>
            </div>
            
            <button
              onClick={handleDismiss}
              className="flex-shrink-0 text-white/60 hover:text-white transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PWAInstallPrompt;
