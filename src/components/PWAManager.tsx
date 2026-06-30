import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Share, Plus, Download, X, WifiOff, Loader2, Info } from 'lucide-react';
import { useToast } from './Toast';

interface PWAContextType {
  isInstallable: boolean;
  isInstalled: boolean;
  isOffline: boolean;
  isIOS: boolean;
  installApp: () => Promise<void>;
  showInstallBanner: boolean;
  setShowInstallBanner: (show: boolean) => void;
}

const PWAContext = createContext<PWAContextType | undefined>(undefined);

export function usePWA() {
  const context = useContext(PWAContext);
  if (!context) {
    throw new Error('usePWA must be used within a PWAProvider');
  }
  return context;
}

interface PWAManagerProps {
  children: React.ReactNode;
}

export function PWAManager({ children }: PWAManagerProps) {
  const { toast } = useToast();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [isIOS, setIsIOS] = useState(false);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  
  // Track visual states for install triggers
  const hasPromptedThisSession = useRef(false);

  // 1. Service Worker Registration
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
          .then(reg => {
            console.log('ServiceWorker registration successful with scope: ', reg.scope);
            
            // Check for updates
            reg.onupdatefound = () => {
              const installingWorker = reg.installing;
              if (installingWorker) {
                installingWorker.onstatechange = () => {
                  if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    toast('New update available! Refresh to get the latest features.', 'info', 6000);
                  }
                };
              }
            };
          })
          .catch(err => {
            console.error('ServiceWorker registration failed: ', err);
          });
      });
    }
  }, [toast]);

  // 2. Track Offline/Online State
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      toast('📡 Reconnected! You are back online.', 'success');
    };
    
    const handleOffline = () => {
      setIsOffline(true);
      toast('📡 You are offline. Accessing cached rooms and files...', 'error', 5000);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [toast]);

  // 3. Detect PWA Installation State, iOS, and capture BeforeInstallPrompt
  useEffect(() => {
    // Detect if running in standalone mode (installed as PWA)
    const checkStandalone = () => {
      const isStandalone = 
        window.matchMedia('(display-mode: standalone)').matches || 
        (window.navigator as any).standalone === true || 
        document.referrer.includes('android-app://');
      setIsInstalled(isStandalone);
    };

    checkStandalone();

    // Capture install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Detect iOS/Safari
    const ua = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /ipad|iphone|ipod/.test(ua) && !(window as any).MSStream;
    const isSafari = ua.includes('safari') && !ua.includes('chrome') && !ua.includes('crios') && !ua.includes('fxios');
    setIsIOS(isIOSDevice && isSafari);

    if (isIOSDevice && isSafari && !window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstallable(true);
    }

    // Monitor changes to display-mode
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleMediaChange = (e: MediaQueryListEvent) => {
      setIsInstalled(e.matches);
    };
    mediaQuery.addEventListener('change', handleMediaChange);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      mediaQuery.removeEventListener('change', handleMediaChange);
    };
  }, []);

  // 4. Hide splash screen after short duration
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 850); // Less than 1 second splash as requested
    return () => clearTimeout(timer);
  }, []);

  // 5. Trigger PWA Installation
  const installApp = async () => {
    if (isIOS) {
      // iOS doesn't support programmatic install prompts, so we show standard info toast/modal
      setShowInstallBanner(true);
      return;
    }

    if (!deferredPrompt) {
      toast('To install: Open your browser menu (e.g. three dots in Chrome or share button in Safari) and tap "Install App" or "Add to Home Screen".', 'info', 5000);
      return;
    }

    // Show the native browser installation prompt
    deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`PWA install prompt response: ${outcome}`);
    
    if (outcome === 'accepted') {
      setIsInstalled(true);
      setIsInstallable(false);
      setShowInstallBanner(false);
      toast('🎉 Thank you for installing 68Share!', 'success');
    }
    
    // Clear prompt state
    setDeferredPrompt(null);
  };

  return (
    <PWAContext.Provider
      value={{
        isInstallable,
        isInstalled,
        isOffline,
        isIOS,
        installApp,
        showInstallBanner,
        setShowInstallBanner,
      }}
    >
      {/* Animated Splash Screen (less than 1s) */}
      <AnimatePresence>
        {showSplash && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="fixed inset-0 bg-[#FAFAFA] z-[9999] flex flex-col items-center justify-center text-center px-6"
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="flex flex-col items-center gap-4"
            >
              {/* Logo Circle/Square */}
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[#2563EB] to-[#1D4ED8] flex items-center justify-center text-white font-mono font-extrabold text-3xl shadow-xl shadow-blue-500/25">
                68
              </div>
              <h1 className="text-2xl font-sans font-black tracking-tight text-neutral-900 mt-2">
                68Share
              </h1>
              <p className="text-[14px] font-sans font-medium text-neutral-500 max-w-xs leading-relaxed">
                Share Anything. Anywhere. Instantly.
              </p>
              
              {/* Animated Loading Ring */}
              <div className="mt-8 flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content App */}
      <div className="flex flex-col min-h-screen">
        {children}
      </div>

      {/* Subtle Install Floating Card Prompt */}
      <AnimatePresence>
        {showInstallBanner && isInstallable && !isInstalled && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="fixed bottom-6 right-6 z-[100] max-w-sm w-full mx-auto px-4 sm:px-0"
          >
            <div className="bg-white border border-neutral-200/90 rounded-3xl p-5 shadow-2xl text-left relative overflow-hidden">
              <button 
                onClick={() => setShowInstallBanner(false)}
                className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-neutral-100 text-neutral-400 hover:text-neutral-600 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              {isIOS ? (
                // iOS Installation Card
                <div className="font-sans">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                      <Download className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-[15px] font-extrabold text-neutral-900">Install 68Share</h4>
                      <p className="text-[11px] text-neutral-400 font-semibold uppercase tracking-wider">Safari iOS Instruction</p>
                    </div>
                  </div>
                  
                  <p className="text-[13px] text-neutral-600 font-medium leading-relaxed mb-4">
                    Install 68Share on your iPhone or iPad for instant file sharing from your home screen.
                  </p>

                  <div className="space-y-2.5 mb-4">
                    <div className="flex items-center gap-2.5 text-neutral-700 bg-neutral-50/70 p-2.5 rounded-2xl border border-neutral-100">
                      <div className="w-6 h-6 rounded-lg bg-white shadow-xs border border-neutral-200/50 flex items-center justify-center text-blue-600 shrink-0">
                        <Share className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-[12.5px] font-semibold">1. Tap the Share button in Safari</span>
                    </div>

                    <div className="flex items-center gap-2.5 text-neutral-700 bg-neutral-50/70 p-2.5 rounded-2xl border border-neutral-100">
                      <div className="w-6 h-6 rounded-lg bg-white shadow-xs border border-neutral-200/50 flex items-center justify-center text-blue-600 shrink-0">
                        <Plus className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-[12.5px] font-semibold">2. Select "Add to Home Screen"</span>
                    </div>

                    <div className="flex items-center gap-2.5 text-neutral-700 bg-neutral-50/70 p-2.5 rounded-2xl border border-neutral-100">
                      <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-[#2563EB] to-[#1D4ED8] flex items-center justify-center text-white font-mono font-bold text-[9px] shrink-0">
                        68
                      </div>
                      <span className="text-[12.5px] font-semibold">3. Open 68Share from your home screen</span>
                    </div>
                  </div>

                  <button
                    onClick={() => setShowInstallBanner(false)}
                    className="w-full bg-[#F1F5F9] hover:bg-neutral-200 text-neutral-800 font-semibold text-[13px] py-2.5 px-4 rounded-2xl transition-all cursor-pointer active:scale-[0.98] text-center"
                  >
                    Got It
                  </button>
                </div>
              ) : (
                // Android / Desktop standard install prompt card
                <div className="font-sans">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#2563EB] to-[#1D4ED8] text-white flex items-center justify-center font-mono font-bold text-base shadow-md shadow-blue-500/15 shrink-0">
                      68
                    </div>
                    <div>
                      <h4 className="text-[15px] font-extrabold text-neutral-900">📱 Install 68Share</h4>
                      <p className="text-[11px] text-neutral-400 font-semibold uppercase tracking-wider">Fast Web App</p>
                    </div>
                  </div>
                  
                  <p className="text-[13px] text-neutral-600 font-medium leading-relaxed mb-4">
                    Access your rooms faster and share files instantly from your home screen.
                  </p>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={installApp}
                      className="flex-1 bg-[#2563EB] hover:bg-blue-700 text-white font-bold text-[13px] py-2.5 px-4 rounded-2xl transition-all cursor-pointer shadow-sm shadow-blue-500/10 active:scale-[0.98] text-center"
                    >
                      Install
                    </button>
                    <button
                      onClick={() => setShowInstallBanner(false)}
                      className="flex-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-semibold text-[13px] py-2.5 px-4 rounded-2xl transition-all cursor-pointer active:scale-[0.98] text-center"
                    >
                      Maybe Later
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Offline Screen Banner */}
      <AnimatePresence>
        {isOffline && (
          <motion.div
            initial={{ opacity: 0, y: -40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ type: 'spring', stiffness: 350, damping: 28 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-[999] max-w-md w-full px-4"
          >
            <div className="bg-amber-500 border border-amber-600/20 rounded-3xl p-4 shadow-xl text-left flex items-start gap-3.5 text-white">
              <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
                <WifiOff className="w-5 h-5 text-white animate-pulse" />
              </div>
              <div className="font-sans flex-grow min-w-0">
                <h4 className="text-[14px] font-extrabold tracking-tight">📡 Offline Mode</h4>
                <p className="text-[12.5px] text-white/90 font-medium leading-normal mt-0.5">
                  You're currently offline. Reconnect to continue sharing files. Showing cached rooms and UI assets.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </PWAContext.Provider>
  );
}
