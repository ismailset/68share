import React, { useState, useEffect } from 'react';
import { AnimatePresence } from 'motion/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { HowItWorks } from './components/HowItWorks';
import { Features } from './components/Features';
import { Security } from './components/Security';
import { Footer } from './components/Footer';
import { CreateRoom } from './components/CreateRoom';
import { RoomDashboard } from './components/RoomDashboard';
import { Room } from './types';
import { dbGetRoom } from './lib/storage';
import { useToast } from './components/Toast';

export default function App() {
  const { toast } = useToast();
  const [activeRoomCode, setActiveRoomCode] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState<'files' | 'clipboard' | null>(null);

  // Parse URL search parameters on boot to see if direct link or QR scan was used
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    if (roomParam) {
      const code = roomParam.trim().toUpperCase();
      
      dbGetRoom(code).then((existing) => {
        if (existing) {
          setActiveRoomCode(code);
          localStorage.setItem('68share_active_room_code', code);
          toast(`Successfully connected to Room ${code}!`, 'success');
        } else {
          // Clear URL if invalid room specified to avoid noise
          window.history.pushState({}, '', window.location.pathname);
          toast(`Could not find Room "${code}". It may have expired or been deleted.`, 'error', 4000);
        }
      }).catch((err) => {
        console.error("Error joining room on boot:", err);
        window.history.pushState({}, '', window.location.pathname);
      });
    } else {
      // Check if there is an active room in memory/storage
      const stored = localStorage.getItem('68share_active_room_code');
      if (stored) {
        dbGetRoom(stored).then((existing) => {
          if (existing) {
            setActiveRoomCode(stored);
          } else {
            localStorage.removeItem('68share_active_room_code');
          }
        });
      }
    }
  }, [toast]);

  const handleOpenSetup = (mode: 'files' | 'clipboard' = 'files') => {
    setShowCreateModal(mode);
  };

  const handleRoomCreated = (room: Room) => {
    setActiveRoomCode(room.code);
    localStorage.setItem('68share_active_room_code', room.code);
    setShowCreateModal(null);
    toast(`Room "${room.code}" successfully created and secured!`, 'success');

    // Sync URL queries to include active code so direct reloads match instantly
    const newUrl = `${window.location.origin}${window.location.pathname}?room=${room.code}`;
    window.history.pushState({}, '', newUrl);
  };

  const handleLeaveRoom = () => {
    setActiveRoomCode(null);
    localStorage.removeItem('68share_active_room_code');
    // Wipe URL search query
    window.history.pushState({}, '', window.location.pathname);
  };

  const handleJoin = (code: string) => {
    const formatted = code.trim().toUpperCase();
    if (formatted) {
      setActiveRoomCode(formatted);
      localStorage.setItem('68share_active_room_code', formatted);
      toast(`Successfully joined Room ${formatted}!`, 'success');
      const newUrl = `${window.location.origin}${window.location.pathname}?room=${formatted}`;
      window.history.pushState({}, '', newUrl);
    }
  };

  return (
    <div id="root-container" className="min-h-screen bg-[#FAFAFA] text-neutral-900 font-sans flex flex-col justify-between selection:bg-blue-100 selection:text-blue-900 selection:font-semibold">
      
      {/* Floating pill navigation layout */}
      <Navbar 
        onCreateRoom={handleOpenSetup} 
        onNavigateHome={handleLeaveRoom}
      />

      <main className="flex-grow">
        <AnimatePresence mode="wait">
          {activeRoomCode ? (
            <RoomDashboard 
              key={`dashboard-${activeRoomCode}`}
              roomCode={activeRoomCode} 
              onLeave={handleLeaveRoom} 
            />
          ) : (
            <React.Fragment key="homepage">
              <Hero 
                onCreateRoom={handleOpenSetup} 
                onJoinRoom={handleJoin}
              />
              <HowItWorks />
              <Features />
              <Security />
              <Footer onCreateRoom={handleOpenSetup} />
            </React.Fragment>
          )}
        </AnimatePresence>
      </main>

      {/* Slide overlay for room setup */}
      <AnimatePresence>
        {showCreateModal && (
          <CreateRoom 
            onClose={() => setShowCreateModal(null)} 
            onRoomCreated={handleRoomCreated} 
            initialMode={showCreateModal}
          />
        )}
      </AnimatePresence>

      <SpeedInsights />
    </div>
  );
}
