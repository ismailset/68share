import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  QrCode, Clipboard, Check, Users, Clock, UploadCloud, File, Download, 
  ShieldAlert, ArrowLeft, Lock, AlertTriangle, RefreshCw, FileText, Image as ImageIcon, Film, Archive
} from 'lucide-react';
import { Room, SharedFile, ActivityItem } from '../types';
import { 
  dbGetRoom, dbUpdateRoom, dbSubscribeRoom, dbUploadFileToRoom, dbTriggerDownload, 
  formatBytes, getQrCodeUrl, getDeviceName 
} from '../lib/storage';
import { useToast } from './Toast';

interface RoomDashboardProps {
  key?: string;
  roomCode: string;
  onLeave: () => void;
}

export function RoomDashboard({ roomCode, onLeave }: RoomDashboardProps) {
  const { toast } = useToast();
  const [room, setRoom] = useState<Room | null>(null);
  const [timeLeft, setTimeLeft] = useState<string>('00:00:00');
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [showHeaderQr, setShowHeaderQr] = useState(false);
  const [qrColorCode, setQrColorCode] = useState('2563eb'); // Brand blue default
  const [copiedQrLink, setCopiedQrLink] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Subscribe to real-time room updates in Firestore
  useEffect(() => {
    const uppercaseCode = roomCode.trim().toUpperCase();
    
    const unsubscribe = dbSubscribeRoom(uppercaseCode, (active) => {
      if (!active) {
        toast('This room has expired or been closed.', 'warning');
        onLeave();
        return;
      }
      setRoom(active);
    });

    // Handle initial join increments & password shield checks
    dbGetRoom(uppercaseCode).then((active) => {
      if (active) {
        if (active.password) {
          setIsAuthenticated(false);
        }
        
        // Increment online users count
        const updated = { ...active };
        updated.usersOnline = (updated.usersOnline || 0) + 1;
        dbUpdateRoom(updated);
      }
    }).catch(err => {
      console.error("Error fetching room on mount:", err);
    });

    return () => {
      unsubscribe();
      // Decrement online users count upon exiting
      dbGetRoom(uppercaseCode).then((active) => {
        if (active) {
          const updated = { ...active };
          updated.usersOnline = Math.max(1, (updated.usersOnline || 1) - 1);
          dbUpdateRoom(updated).catch(e => console.error(e));
        }
      }).catch(err => {
        console.error("Error decrementing online users:", err);
      });
    };
  }, [roomCode]);

  // Expiration countdown loop
  useEffect(() => {
    if (!room) return;

    const calculateTime = () => {
      const expiry = new Date(room.expiresAt).getTime();
      const now = new Date().getTime();
      const diff = expiry - now;

      if (diff <= 0) {
        setTimeLeft('00:00:00');
        alert('This room has reached its duration limits and has expired.');
        onLeave();
        return;
      }

      const hrs = Math.floor(diff / (3600 * 1000));
      const mins = Math.floor((diff % (3600 * 1000)) / (60 * 1000));
      const secs = Math.floor((diff % (60 * 1000)) / 1000);

      const fHrs = hrs.toString().padStart(2, '0');
      const fMins = mins.toString().padStart(2, '0');
      const fSecs = secs.toString().padStart(2, '0');

      setTimeLeft(`${fHrs}:${fMins}:${fSecs}`);
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [room?.expiresAt]);

  // Handler for password lock
  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!room) return;
    if (passwordInput === room.password) {
      setIsAuthenticated(true);
      toast('Shield room unlocked successfully!', 'success');
      
      // Log successful unlock activity
      const updated = { ...room };
      updated.activity.unshift({
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        type: 'join',
        details: `${getDeviceName()} entered correct room password keycode.`,
      });
      dbUpdateRoom(updated);
    } else {
      setPasswordError('Invalid passphrase passcode. Try again!');
      toast('Invalid passphrase passcode!', 'error');
    }
  };

  const getShareUrl = () => {
    return `${window.location.origin}${window.location.pathname}?room=${roomCode}`;
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(getShareUrl());
    setCopiedLink(true);
    toast('Room share link copied to clipboard!', 'success');
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopiedCode(true);
    toast(`Room code ${roomCode} copied!`, 'success');
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (!room) return;

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      await processFileUpload(files[0]);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await processFileUpload(files[0]);
    }
  };

  const processFileUpload = async (file: File) => {
    if (!room) return;
    setIsUploading(true);
    setUploadError(null);

    try {
      const maxCapacity = 700 * 1024; // 700KB limit for physical Firestore base64
      if (file.size > maxCapacity) {
        // Broadcast the file metadata to Firestore so all active devices get updated catalogs instantly
        const fileId = crypto.randomUUID();
        const uploader = getDeviceName();
        const fallbackFile: SharedFile = {
          id: fileId,
          name: file.name,
          size: file.size,
          type: file.type || 'application/octet-stream',
          uploadedAt: new Date().toISOString(),
          uploader,
        };

        const activityItem: ActivityItem = {
          id: crypto.randomUUID(),
          timestamp: new Date().toISOString(),
          type: 'upload',
          details: `${uploader} uploaded "${file.name}" (${formatBytes(file.size)}). [Direct Tunnel Link]`,
        };

        const updatedRoom = {
          ...room,
          files: [fallbackFile, ...room.files],
          activity: [activityItem, ...room.activity]
        };
        await dbUpdateRoom(updatedRoom);
        toast(`Broadcasted file metadata: "${file.name}" is visible to all other connected screens.`, 'success', 4000);
      } else {
        const parsed = await dbUploadFileToRoom(room.code, file);
        if (parsed) {
          toast(`Successfully uploaded & synced secure cluster: "${file.name}"!`, 'success');
        }
      }
    } catch (err) {
      setUploadError('Failed to broadcast file across cluster.');
      toast('Failed to upload file.', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const triggerSelectFile = () => {
    fileInputRef.current?.click();
  };

  // Helper to get stylized file icons and themes
  const getFileStyleAndIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(ext)) {
      return {
        bg: 'bg-emerald-50 text-emerald-600 border border-emerald-100',
        icon: <ImageIcon className="w-5 h-5" />,
        label: 'Image'
      };
    } else if (['pdf', 'doc', 'docx', 'txt', 'rtf', 'pdf', 'csv', 'xlsx', 'pptx'].includes(ext)) {
      return {
        bg: 'bg-rose-50 text-rose-600 border border-rose-100',
        icon: <FileText className="w-5 h-5" />,
        label: 'Document'
      };
    } else if (['zip', 'rar', 'tar', 'gz', '7z'].includes(ext)) {
      return {
        bg: 'bg-amber-50 text-amber-600 border border-amber-100',
        icon: <Archive className="w-5 h-5" />,
        label: 'Archive'
      };
    } else if (['mp3', 'wav', 'ogg', 'mp4', 'mov', 'avi', 'mkv'].includes(ext)) {
      return {
        bg: 'bg-indigo-50 text-indigo-600 border border-indigo-100',
        icon: <Film className="w-5 h-5" />,
        label: 'Media'
      };
    }
    return {
      bg: 'bg-neutral-50 text-neutral-600 border border-neutral-200/60',
      icon: <File className="w-5 h-5" />,
      label: 'File'
    };
  };

  if (!room) {
    return (
      <div className="py-24 text-center text-neutral-500 font-sans flex flex-col items-center justify-center gap-4">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
        <span className="font-sans font-medium text-neutral-600">Rebounding connection & loading Room {roomCode}...</span>
      </div>
    );
  }

  // Authentication shield screen
  if (!isAuthenticated) {
    return (
      <section className="py-16 px-4 max-w-md mx-auto relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-neutral-200/80 shadow-2xl rounded-3xl p-6 sm:p-8"
        >
          <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center border border-rose-100 mx-auto mb-4">
            <Lock className="w-6 h-6" />
          </div>
          
          <h2 className="text-xl font-sans font-bold text-neutral-900 text-center tracking-wide">Enter Room Password</h2>
          <p className="text-xs text-neutral-500 text-center mt-1 font-sans">Room {roomCode} requires verification.</p>

          <form onSubmit={handleAuthSubmit} className="mt-6 flex flex-col gap-4">
            <div>
              <label className="block text-xs font-sans font-semibold text-neutral-400 uppercase tracking-widest mb-1">Passkey Code</label>
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => {
                  setPasswordInput(e.target.value);
                  setPasswordError('');
                }}
                placeholder="Enter password"
                className="w-full bg-[#FAFAFA] border border-neutral-200 rounded-xl px-4 py-2.5 font-sans text-sm focus:outline-none focus:border-neutral-400"
                required
              />
              {passwordError && <p className="text-red-600 text-xs mt-1.5 font-sans font-medium">{passwordError}</p>}
            </div>

            <button
              type="submit"
              className="bg-neutral-950 hover:bg-neutral-800 text-white w-full rounded-xl py-3 font-sans font-bold text-sm transition-colors cursor-pointer"
            >
              Unlock Dashboard
            </button>
            
            <button
              type="button"
              onClick={onLeave}
              className="text-xs text-neutral-400 hover:text-neutral-600 font-sans text-center underline cursor-pointer mt-2"
            >
              Go back home
            </button>
          </form>
        </motion.div>
      </section>
    );
  }

  return (
    <section className="py-8 max-w-5xl mx-auto px-4 md:px-6 relative z-10 font-sans">
      
      {/* Top dashboard control header bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 border-b border-neutral-200/80 pb-6 mb-8">
        <div className="flex items-center gap-3">
          <button 
            onClick={onLeave}
            className="p-2.5 rounded-full border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-500 hover:text-neutral-800 transition-colors cursor-pointer shadow-sm flex items-center justify-center shrink-0"
            title="Leave Room"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="relative text-left">
            <h1 className="text-xl md:text-2xl font-serif font-bold text-neutral-950 tracking-wide">{room.name}</h1>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="text-[10px] font-sans font-bold tracking-wider text-neutral-400 uppercase">ROOM CODE:</span>
              <span className="font-mono text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">{room.code}</span>
              
              <button 
                onClick={handleCopyCode}
                className="text-xs text-neutral-400 hover:text-neutral-700 font-medium flex items-center gap-1 font-sans cursor-pointer transition-colors"
                title="Copy Room Code"
              >
                {copiedCode ? <Check className="w-3 h-3 text-emerald-600" /> : <Clipboard className="w-3 h-3" />}
                <span>{copiedCode ? 'Copied' : 'Copy'}</span>
              </button>

              <span className="text-neutral-200">|</span>

              <button 
                onClick={() => setShowHeaderQr(!showHeaderQr)}
                className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1 font-sans cursor-pointer transition-colors"
                aria-expanded={showHeaderQr}
              >
                <QrCode className="w-3 h-3" />
                <span>{showHeaderQr ? 'Hide QR' : 'Share QR'}</span>
              </button>
            </div>

            {/* Expandable Interactive QR Panel */}
            <AnimatePresence>
              {showHeaderQr && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="absolute left-0 mt-3 z-50 bg-white border border-neutral-200/80 rounded-3xl p-5 shadow-2xl w-[320px] text-left"
                >
                  <div className="flex items-center justify-between border-b border-neutral-100 pb-2.5 mb-3.5">
                    <div className="flex items-center gap-2">
                      <QrCode className="w-4 h-4 text-blue-600" />
                      <span className="font-sans font-bold text-neutral-900 text-sm">Scan to Join Room</span>
                    </div>
                    <button 
                      onClick={() => setShowHeaderQr(false)}
                      className="text-neutral-400 hover:text-neutral-600 text-[11px] font-medium cursor-pointer"
                    >
                      Close
                    </button>
                  </div>

                  <div className="flex flex-col items-center">
                    {/* Interactive Color Swatches */}
                    <div className="flex items-center gap-1.5 mb-3.5 bg-neutral-50 px-2 py-1 rounded-full border border-black/5">
                      <span className="text-[9px] font-sans font-bold text-neutral-400 tracking-wider uppercase mr-1">Tweak:</span>
                      {[
                        { name: 'Blue', hex: '2563eb', bg: 'bg-blue-600' },
                        { name: 'Dark', hex: '111111', bg: 'bg-neutral-950' },
                        { name: 'Emerald', hex: '059669', bg: 'bg-emerald-600' },
                        { name: 'Amber', hex: 'ea580c', bg: 'bg-amber-600' },
                      ].map((swatch) => (
                        <button
                          key={swatch.name}
                          onClick={() => setQrColorCode(swatch.hex)}
                          className={`w-4 h-4 rounded-full cursor-pointer transition-all ${swatch.bg} ${
                            qrColorCode === swatch.hex ? 'ring-2 ring-indigo-500 scale-110' : 'border border-white hover:scale-105'
                          }`}
                        />
                      ))}
                    </div>

                    {/* QR Code Graphic Area */}
                    <div className="bg-white p-2.5 rounded-2xl border border-neutral-200/80 shadow-md flex items-center justify-center mb-4">
                      <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&color=${qrColorCode}&bgcolor=ffffff&data=${encodeURIComponent(getShareUrl())}`} 
                        alt="Join Room QR Code" 
                        className="w-36 h-36 select-none"
                        referrerPolicy="no-referrer"
                      />
                    </div>

                    {/* Download & Copy links */}
                    <div className="w-full flex gap-2 border-t border-neutral-100 pt-3">
                      <button
                        onClick={() => {
                          const customUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&color=${qrColorCode}&bgcolor=ffffff&data=${encodeURIComponent(getShareUrl())}`;
                          window.open(customUrl, '_blank');
                        }}
                        className="flex-1 bg-white hover:bg-neutral-50 text-neutral-700 border border-neutral-200 py-1.5 px-2 rounded-xl font-sans text-xs font-semibold tracking-tight transition-all active:scale-98 flex items-center justify-center gap-1 cursor-pointer text-center"
                      >
                        <Download className="w-3 h-3 text-neutral-500" />
                        <span>Save QR</span>
                      </button>

                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(getShareUrl());
                          setCopiedQrLink(true);
                          setTimeout(() => setCopiedQrLink(false), 2000);
                        }}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-1.5 px-2 rounded-xl font-sans text-xs font-semibold tracking-tight transition-all active:scale-98 flex items-center justify-center gap-1 cursor-pointer text-center"
                      >
                        {copiedQrLink ? <Check className="w-3 h-3" /> : <Clipboard className="w-3 h-3" />}
                        <span>{copiedQrLink ? 'Copied' : 'Copy link'}</span>
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Sync panel telemetry elements */}
        <div className="flex items-center gap-3 bg-neutral-50 border border-neutral-200/65 rounded-2xl p-2.5 shrink-0 self-start md:self-auto flex-wrap text-left shadow-sm">
          
          <div className="flex items-center gap-2 border-r border-neutral-250 pr-3.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-[11px] font-mono font-bold uppercase text-neutral-600 flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-neutral-400" />
              <span>{room.usersOnline || 1} Screen{room.usersOnline > 1 ? 's' : ''} Online</span>
            </span>
          </div>

          <div className="flex items-center gap-2 border-r border-neutral-250 pr-3.5">
            <Clock className="w-3.5 h-3.5 text-[#EAB308]" />
            <span className="font-mono text-[11px] font-bold text-neutral-700 bg-white border border-neutral-200 px-2 py-0.5 rounded shadow-xs">
              EXPIRES: {timeLeft}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-indigo-500 inline-block animate-pulse" />
            <span className="text-[11px] font-sans font-bold text-neutral-500 tracking-tight" title="Auto-deletes to protect privacy">
              Active Sync Guard
            </span>
          </div>

        </div>
      </div>

      {/* Main split dashboard area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        
        {/* Left Interactive Zone: File uploads & files shelf */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          
          {/* Draggable Active Upload Zone */}
          <div 
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={triggerSelectFile}
            className={`cursor-pointer group relative p-8 md:p-11 border-2 border-dashed rounded-3xl flex flex-col items-center text-center transition-all ${
              isDragging 
                ? 'border-blue-600 bg-blue-50/20' 
                : 'border-neutral-200 bg-white hover:border-neutral-300 hover:shadow-xl hover:shadow-neutral-100/50'
            }`}
          >
            <input 
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
            />
            
            <div className="w-12 h-12 rounded-2xl bg-[#FAFAFA] border border-neutral-200/85 flex items-center justify-center text-neutral-600 group-hover:scale-105 transition-transform duration-300">
              <UploadCloud className="w-6 h-6 text-blue-600" />
            </div>

            <h3 className="font-sans font-bold text-neutral-900 mt-4 text-[15px] tracking-wide">
              {isUploading ? 'Registering file transmission...' : 'Drag & Drop files here'}
            </h3>
            
            <p className="font-sans text-xs text-neutral-500 mt-1 max-w-[280px]">
              {isUploading 
                ? 'Writing files directly to active synchronizer cluster...' 
                : 'or click to browse local files. Supports images, zipped logs, docs, and datasets.'}
            </p>
            
            <div className="mt-4 px-3 py-1 bg-[#FAFAFA] border border-black/5 rounded-full inline-flex items-center gap-1.5 text-[10px] font-sans font-semibold text-[#666666]">
              <ShieldAlert className="w-3.5 h-3.5 text-indigo-500" />
              <span>Capped up to 700KB for cloud sync, larger simulated sync</span>
            </div>

            {uploadError && (
              <p className="text-red-600 text-xs mt-3 font-sans font-semibold flex items-center gap-1 bg-red-50 px-3 py-1.5 rounded-lg border border-red-100">
                <AlertTriangle className="w-3.5 h-3.5" />
                {uploadError}
              </p>
            )}
          </div>

          {/* Shared Files Grid Layout - BENTO STYLE */}
          <div className="bg-white border border-neutral-200/80 rounded-3xl p-6 shadow-xs text-left">
            <h2 className="text-sm font-sans font-bold text-neutral-900 tracking-wide uppercase mb-4 flex items-center gap-2">
              <File className="w-4.5 h-4.5 text-blue-600" />
              <span>Room Shelf Catalog ({room.files.length} Item{room.files.length === 1 ? '' : 's'})</span>
            </h2>

            {room.files.length === 0 ? (
              <div className="py-16 text-center rounded-2xl bg-[#FAFAFA] border border-black/5">
                <File className="w-8 h-8 text-neutral-350 mx-auto mb-2" />
                <h4 className="font-sans font-semibold text-xs text-neutral-800">Shelf Catalog is Empty</h4>
                <p className="font-sans text-[11px] text-neutral-500 mt-1">Files dropped here will pop up on any connected computer instantly!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto pr-1">
                <AnimatePresence initial={false}>
                  {room.files.map((file) => {
                    const isBulky = !file.dataUrl;
                    const visualTheme = getFileStyleAndIcon(file.name);
                    
                    return (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, x: -10 }}
                        key={file.id}
                        className="p-4 bg-white hover:bg-neutral-50/50 border border-neutral-200 rounded-2xl flex flex-col justify-between gap-3.5 transition-all hover:shadow-md hover:border-neutral-300"
                      >
                        <div className="flex items-start gap-3">
                          {/* File Type Badge */}
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${visualTheme.bg}`}>
                            {visualTheme.icon}
                          </div>
                          
                          <div className="min-w-0 text-left flex-grow">
                            <h4 className="text-xs font-sans font-bold text-neutral-900 truncate pr-0.5" title={file.name}>
                              {file.name}
                            </h4>
                            <p className="text-[10px] font-sans font-medium text-neutral-400 uppercase tracking-tight mt-0.5">
                              {visualTheme.label}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between border-t border-neutral-150 pt-3 relative z-10">
                          <div className="text-[10px] font-mono text-neutral-500 flex flex-col">
                            <span className="font-semibold text-neutral-700">{formatBytes(file.size)}</span>
                            <span className="text-neutral-400 mt-0.5 truncate max-w-[125px]">By: {file.uploader}</span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            {isBulky && (
                              <span className="text-[9px] font-sans font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100 uppercase mr-1" title="Size exceeded normal cache cap. Transferred via direct proxy simulation.">
                                Proxy Sync
                              </span>
                            )}
                            <button 
                              onClick={async (e) => {
                                e.stopPropagation();
                                toast(`Initiating download: "${file.name}"`, 'success', 2000);
                                await dbTriggerDownload(file, roomCode);
                              }}
                              className="bg-blue-600 hover:bg-blue-700 text-white w-7.5 h-7.5 rounded-lg flex items-center justify-center transition-colors shadow-xs cursor-pointer"
                              title="Download Segment"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </div>

        </div>

        {/* Right Columns: QR utilities & logging activities */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          
          {/* Share widget card */}
          <div className="bg-white border border-neutral-200/80 rounded-3xl p-5 shadow-sm text-left relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />
            
            <h3 className="font-sans font-bold text-neutral-900 text-xs tracking-wider uppercase mb-3.5 text-neutral-400">Share Information</h3>
            
            <div className="flex flex-col gap-3">
              <button 
                onClick={handleCopyLink}
                className="w-full bg-[#FAFAFA] hover:bg-neutral-100 border border-neutral-200 rounded-xl p-2.5 px-3 flex items-center justify-between text-left transition-all active:scale-[0.99] cursor-pointer"
              >
                <div className="truncate pr-2">
                  <span className="text-[9px] font-mono text-neutral-400 uppercase block leading-none mb-1 font-semibold">Share Web Link</span>
                  <span className="text-xs text-neutral-800 font-sans truncate block max-w-[200px]">{getShareUrl()}</span>
                </div>
                <div className="shrink-0 p-1.5 bg-white rounded-lg border border-neutral-200">
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Clipboard className="w-3.5 h-3.5 text-neutral-500" />}
                </div>
              </button>

              {/* QR expander */}
              <div className="border border-black/5 rounded-xl p-3 bg-neutral-50/50">
                <button
                  onClick={() => setShowQr(!showQr)}
                  className="w-full font-sans text-xs font-semibold text-neutral-700 hover:text-neutral-950 flex items-center justify-between cursor-pointer"
                >
                  <span className="flex items-center gap-1.5">
                    <QrCode className="w-4 h-4 text-blue-600" />
                    <span>{showQr ? 'Hide Large QR' : 'Display Room QR'}</span>
                  </span>
                  <span>{showQr ? 'Close' : 'Expand'}</span>
                </button>

                {showQr && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="flex flex-col items-center gap-3.5 mt-3 border-t border-neutral-200/50 pt-3"
                  >
                    <div className="bg-white p-2.5 rounded-xl border border-neutral-200 shadow-sm">
                      <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&color=${qrColorCode}&bgcolor=ffffff&data=${encodeURIComponent(getShareUrl())}`} 
                        alt="Room QR Code" 
                        className="w-28 h-28 select-none"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <span className="text-[10px] text-neutral-500 font-sans text-center max-w-[180px]">Point any mobile camera at this code to join instantly.</span>
                  </motion.div>
                )}
              </div>
            </div>
          </div>

          {/* Activity Feed terminal widget */}
          <div className="bg-neutral-950 text-white border border-neutral-900 rounded-3xl p-5 shadow-2xl flex flex-col justify-between flex-grow min-h-[360px]">
            <div>
              <div className="flex items-center justify-between border-b border-neutral-900 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-400">Broadcaster Terminal</span>
                </div>
                <span className="font-mono text-[9px] text-neutral-600">68SHARE OS v1.1</span>
              </div>

              <div id="activity-console" className="flex flex-col gap-2.5 max-h-[260px] overflow-y-auto pr-1">
                {room.activity.map((act) => (
                  <div key={act.id} className="text-left leading-normal font-mono text-[10.5px]">
                    <span className="text-neutral-600 mr-2">[{new Date(act.timestamp).toLocaleTimeString()}]</span>
                    <span className={
                      act.type === 'upload' ? 'text-amber-400' 
                      : act.type === 'download' ? 'text-blue-400'
                      : act.type === 'leave' ? 'text-red-400'
                      : 'text-neutral-300'
                    }>
                      {act.details}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-neutral-900 pt-3 mt-4 text-center font-mono text-[9px] text-neutral-600">
              Live listener awaiting room actions...
            </div>
          </div>

        </div>

      </div>

    </section>
  );
}
