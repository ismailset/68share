import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Smartphone, Download, X, Share } from 'lucide-react';
import { useToast } from './Toast';

export function PwaInstallPrompt() {
  const { toast } = useToast();
  const [showPrompt, setShowPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // 1. Detect if already installed or dismissed
    const dismissed = localStorage.getItem('68share_pwa_dismissed');
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
    if (dismissed || isStandalone) return;

    // 2. Track visit count
    const visitCount = Number(localStorage.getItem('68share_visits') || '0') + 1;
    localStorage.setItem('68share_visits', String(visitCount));

    // 3. Detect iOS Safari
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    const isSafari = /safari/.test(userAgent) && !/crios|fxios|chrome|opera|edge/.test(userAgent);
    setIsIOS(isIOSDevice && isSafari);

    // 4. Listen for Chrome/Edge native PWA trigger
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      
      // Delay showing until visits >= 2 OR user spends >15 seconds on the page
      if (visitCount >= 2) {
        setShowPrompt(true);
      } else {
        const timer = setTimeout(() => {
          setShowPrompt(true);
        }, 15000);
        return () => clearTimeout(timer);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // 5. If iOS, show custom Safari prompt after visitCount >= 2 or 15 seconds
    if (isIOSDevice && isSafari) {
      if (visitCount >= 2) {
        setShowPrompt(true);
      } else {
        const timer = setTimeout(() => {
          setShowPrompt(true);
        }, 15000);
        return () => clearTimeout(timer);
      }
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      // iOS just gets the guided instructional toast or view
      toast('Tap the Share button in Safari and select "Add to Home Screen" to install.', 'info', 6000);
      return;
    }

    if (!deferredPrompt) return;

    // Show Chrome native prompt
    deferredPrompt.prompt();
    
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      toast('Thank you for installing 68Share!', 'success');
      localStorage.setItem('68share_pwa_dismissed', 'true');
    }
    
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    localStorage.setItem('68share_pwa_dismissed', 'true');
    setShowPrompt(false);
  };

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 30, scale: 0.95 }}
          className="fixed bottom-6 right-6 z-50 max-w-sm w-[340px] bg-white border border-neutral-200 shadow-2xl rounded-3xl p-5 font-sans text-left text-neutral-800"
        >
          {/* Close Header */}
          <button
            onClick={handleDismiss}
            className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-700 cursor-pointer"
            title="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex gap-3.5 items-start">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
              <Smartphone className="w-5 h-5" />
            </div>
            
            <div className="flex-1 min-w-0 pr-4">
              <h4 className="text-sm font-bold text-neutral-900 tracking-tight flex items-center gap-1.5 leading-none">
                📱 Install 68Share
              </h4>
              <p className="text-[11.5px] text-neutral-500 mt-1.5 leading-relaxed">
                Access your rooms faster and share files instantly from your home screen.
              </p>
            </div>
          </div>

          {/* Conditional Instructions */}
          {isIOS ? (
            <div className="mt-4 bg-indigo-50/50 border border-indigo-100/60 rounded-2xl p-3 text-xs leading-relaxed text-indigo-900 flex flex-col gap-1.5">
              <div className="flex items-center gap-1.5 font-semibold text-indigo-950">
                <Share className="w-3.5 h-3.5" />
                <span>How to Install on iPhone/iPad:</span>
              </div>
              <ol className="list-decimal pl-4 space-y-0.5 font-medium">
                <li>Tap the <span className="font-bold">Share</span> button in Safari</li>
                <li>Scroll and select <span className="font-bold">Add to Home Screen</span></li>
              </ol>
            </div>
          ) : null}

          {/* Prompt Actions */}
          <div className="mt-4 flex gap-2.5">
            <button
              onClick={handleDismiss}
              className="flex-1 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200/80 py-2.5 rounded-xl font-semibold text-[11px] text-neutral-600 cursor-pointer text-center select-none"
            >
              Maybe Later
            </button>
            <button
              onClick={handleInstallClick}
              className="flex-1 bg-indigo-600 hover:bg-indigo-750 text-white py-2.5 rounded-xl font-bold text-[11px] cursor-pointer text-center select-none shadow-sm flex items-center justify-center gap-1"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Install Now</span>
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
