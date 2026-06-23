import React, { useState, useEffect } from 'react';
import { AnimatePresence } from 'motion/react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { HowItWorks } from './components/HowItWorks';
import { Features } from './components/Features';
import { Security } from './components/Security';
import { Footer } from './components/Footer';
import { CreateRoom } from './components/CreateRoom';
import { RoomDashboard } from './components/RoomDashboard';
import { Room } from './types';
import { getRoom, getAllRooms } from './lib/storage';
import { useToast } from './components/Toast';

export default function App() {
  const { toast } = useToast();
  const [activeRoomCode, setActiveRoomCode] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Background interval timer to auto-delete rooms after 60 mins of inactivity or upon reaching limit
  useEffect(() => {
    const checkInterval = setInterval(() => {
      // Calling getAllRooms() filters out both expired and inactive (60m) rooms on-the-fly and saves.
      const activeRooms = getAllRooms();
      
      if (activeRoomCode) {
        const uppercaseCode = activeRoomCode.toUpperCase();
        if (!activeRooms[uppercaseCode]) {
          toast('Room automatically closed due to 60 minutes of inactivity or expiration.', 'warning', 5000);
          handleLeaveRoom();
        }
      }
    }, 10000); // Check every 10 seconds

    return () => clearInterval(checkInterval);
  }, [activeRoomCode, toast]);

  // Parse URL search parameters on boot to see if direct link or QR scan was used
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    if (roomParam) {
      const code = roomParam.trim().toUpperCase();
      const existing = getRoom(code);
      if (existing) {
        setActiveRoomCode(code);
        localStorage.setItem('68share_active_room_code', code);
        toast(`Successfully joined Room ${code}!`, 'success');
      } else {
        // Clear URL if invalid room specified to avoid noise
        window.history.pushState({}, '', window.location.pathname);
        toast(`Could not find Room "${code}". It may have expired or been deleted.`, 'error', 4000);
      }
    }
  }, [toast]);

  const handleOpenSetup = () => {
    setShowCreateModal(true);
  };

  const handleRoomCreated = (room: Room) => {
    setActiveRoomCode(room.code);
    localStorage.setItem('68share_active_room_code', room.code);
    setShowCreateModal(false);
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

  const handleCheckRoomExists = (code: string): boolean => {
    return !!getRoom(code);
  };

  const handleJoin = (code: string) => {
    const formatted = code.trim().toUpperCase();
    if (formatted && handleCheckRoomExists(formatted)) {
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
                onCheckRoomExists={handleCheckRoomExists}
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
            onClose={() => setShowCreateModal(false)} 
            onRoomCreated={handleRoomCreated} 
          />
        )}
      </AnimatePresence>

    </div>
  );
}
