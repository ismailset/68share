import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  QrCode, Clipboard, Check, Users, Clock, UploadCloud, File, Download, 
  ShieldAlert, ArrowLeft, Lock, AlertTriangle, RefreshCw, FileText, Image as ImageIcon, Film, Archive,
  Laptop, Smartphone, Tablet, Monitor, Eye, X, Loader2, Share2, Sparkles, Wifi, Shield, Info, Activity, Music
} from 'lucide-react';
import { Room, SharedFile, ActivityItem } from '../types';
import { 
  dbGetRoom, dbUpdateRoom, dbSubscribeRoom, dbUploadFileToRoom, dbTriggerDownload, dbGetFileData,
  formatBytes, getQrCodeUrl, getDeviceName, dbJoinRoomPresence, dbLeaveRoomPresence, dataURLtoBlob,
  dbDeleteRoom
} from '../lib/storage';
import { hashPassword } from '../lib/crypto';
import { AbuseProtection } from '../lib/errorMonitor';
import { useToast } from './Toast';
import { ClipboardSync } from './ClipboardSync';

interface RoomDashboardProps {
  key?: string;
  roomCode: string;
  onLeave: () => void;
}

export function RoomDashboard({ roomCode, onLeave }: RoomDashboardProps) {
  const { toast } = useToast();
  const [room, setRoom] = useState<Room | null>(null);
  const [activeTab, setActiveTab] = useState<'files' | 'clipboard'>('files');
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
  
  // Real-time Upload Progress, cancellation and retry states
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadingFileName, setUploadingFileName] = useState<string | null>(null);
  const [failedFile, setFailedFile] = useState<File | null>(null);
  const cancelUploadRef = useRef<{ cancel?: () => void }>({});

  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const lastKnownClipboardTextRef = useRef<string | undefined>(undefined);
  const hasInitializedTabRef = useRef(false);
  const sessionIdRef = useRef(crypto.randomUUID());

  // File Preview capability state
  const [previewFile, setPreviewFile] = useState<SharedFile | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [previewContent, setPreviewContent] = useState<string | null>(null);
  const activeObjectUrlRef = useRef<string | null>(null);

  // Room deletion states
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteRoom = async () => {
    setShowDeleteConfirm(true);
  };

  const confirmDeleteRoom = async () => {
    setIsDeleting(true);
    try {
      await dbDeleteRoom(roomCode);
      toast('Room successfully deleted.', 'success');
      onLeave();
    } catch (e: any) {
      console.error('Delete room failed:', e);
      toast('Failed to delete room: ' + (e.message || 'Unknown error'), 'error');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const isPreviewable = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    const imageExts = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp'];
    const textExts = ['txt', 'md', 'json', 'js', 'jsx', 'ts', 'tsx', 'html', 'css', 'csv', 'xml', 'ini', 'yaml', 'yml'];
    const pdfExts = ['pdf'];
    const audioExts = ['mp3', 'wav', 'ogg', 'm4a', 'aac'];
    const videoExts = ['mp4', 'webm', 'mov'];
    return imageExts.includes(ext) || textExts.includes(ext) || pdfExts.includes(ext) || audioExts.includes(ext) || videoExts.includes(ext);
  };

  const closePreview = () => {
    if (activeObjectUrlRef.current) {
      try {
        URL.revokeObjectURL(activeObjectUrlRef.current);
      } catch (e) {
        console.warn('Failed to revoke object URL:', e);
      }
      activeObjectUrlRef.current = null;
    }
    setPreviewFile(null);
    setPreviewContent(null);
  };

  const handlePreviewFile = async (file: SharedFile) => {
    // Revoke any previous object URL to avoid leaks
    if (activeObjectUrlRef.current) {
      try {
        URL.revokeObjectURL(activeObjectUrlRef.current);
      } catch (e) {}
      activeObjectUrlRef.current = null;
    }

    setPreviewFile(file);
    setPreviewLoading(true);
    setPreviewError(null);
    setPreviewContent(null);

    try {
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      const isImg = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp'].includes(ext);
      const isPdf = ['pdf'].includes(ext);
      const isAudio = ['mp3', 'wav', 'ogg', 'm4a', 'aac'].includes(ext);
      const isVideo = ['mp4', 'webm', 'mov'].includes(ext);
      const isMedia = isImg || isPdf || isAudio || isVideo;
      
      if (isMedia) {
        if (file.isStorage && file.dataUrl) {
          setPreviewContent(file.dataUrl);
        } else {
          let base64Data: string | null = null;
          if (file.dataUrl && file.dataUrl.startsWith('FIRESTORE_CHUNKED:')) {
            const fileId = file.dataUrl.substring(18);
            base64Data = await dbGetFileData(fileId, true, file.chunkCount);
          } else if (file.dataUrl && file.dataUrl.startsWith('FIRESTORE:')) {
            const fileId = file.dataUrl.substring(10);
            base64Data = await dbGetFileData(fileId);
          } else if (file.isChunked) {
            base64Data = await dbGetFileData(file.id, true, file.chunkCount);
          } else {
            base64Data = await dbGetFileData(file.id);
          }

          if (base64Data) {
            if (isPdf || isAudio || isVideo) {
              const blob = dataURLtoBlob(base64Data);
              const objectUrl = URL.createObjectURL(blob);
              activeObjectUrlRef.current = objectUrl;
              setPreviewContent(objectUrl);
            } else {
              setPreviewContent(base64Data);
            }
          } else {
            throw new Error("Unable to retrieve file content");
          }
        }
      } else {
        // Text file
        let textContent = '';
        if (file.isStorage && file.dataUrl) {
          const res = await fetch(file.dataUrl);
          if (!res.ok) {
            throw new Error(`Failed to fetch text content: ${res.statusText}`);
          }
          textContent = await res.text();
        } else {
          let base64Data: string | null = null;
          if (file.dataUrl && file.dataUrl.startsWith('FIRESTORE_CHUNKED:')) {
            const fileId = file.dataUrl.substring(18);
            base64Data = await dbGetFileData(fileId, true, file.chunkCount);
          } else if (file.dataUrl && file.dataUrl.startsWith('FIRESTORE:')) {
            const fileId = file.dataUrl.substring(10);
            base64Data = await dbGetFileData(fileId);
          } else if (file.isChunked) {
            base64Data = await dbGetFileData(file.id, true, file.chunkCount);
          } else {
            base64Data = await dbGetFileData(file.id);
          }

          if (base64Data) {
            if (base64Data.startsWith('data:')) {
              const parts = base64Data.split(',');
              if (parts.length >= 2) {
                const isBase64 = parts[0].includes('base64');
                if (isBase64) {
                  const binaryString = atob(parts[1]);
                  const len = binaryString.length;
                  const bytes = new Uint8Array(len);
                  for (let i = 0; i < len; i++) {
                    bytes[i] = binaryString.charCodeAt(i);
                  }
                  textContent = new TextDecoder('utf-8').decode(bytes);
                } else {
                  textContent = decodeURIComponent(parts[1]);
                }
              } else {
                textContent = base64Data;
              }
            } else {
              textContent = base64Data;
            }
          } else {
            throw new Error("Unable to retrieve text content");
          }
        }
        setPreviewContent(textContent);
      }
    } catch (err: any) {
      console.error('Preview error:', err);
      setPreviewError(err?.message || 'Failed to assemble preview contents.');
    } finally {
      setPreviewLoading(false);
    }
  };

  // Synchronize initial active tab with room focus
  useEffect(() => {
    if (room && room.defaultTab && !hasInitializedTabRef.current) {
      setActiveTab(room.defaultTab);
      hasInitializedTabRef.current = true;
    }
  }, [room]);

  // Subscribe to real-time room updates in Firestore
  useEffect(() => {
    const uppercaseCode = roomCode.trim().toUpperCase();
    
    const unsubscribe = dbSubscribeRoom(uppercaseCode, (active) => {
      if (!active) {
        toast('This room has expired or been closed.', 'warning');
        onLeave();
        return;
      }

      // Live real-time Clipboard update notification
      if (
        active.clipboardText !== undefined &&
        active.clipboardText !== null &&
        active.clipboardText !== lastKnownClipboardTextRef.current
      ) {
        if (lastKnownClipboardTextRef.current !== undefined && active.clipboardText !== '') {
          const latestHistory = active.clipboardHistory && active.clipboardHistory[0];
          if (latestHistory && latestHistory.sender !== getDeviceName()) {
            toast(`Clipboard updated by ${latestHistory.sender}`, 'info');
          }
        }
        lastKnownClipboardTextRef.current = active.clipboardText;
      } else if (!active.clipboardText) {
        lastKnownClipboardTextRef.current = '';
      }

      setRoom(active);
    });

    // Handle initial join increments & password shield checks
    dbGetRoom(uppercaseCode).then(async (active) => {
      if (active) {
        if (active.passwordHash || active.password) {
          setIsAuthenticated(false);
        } else {
          // No password, join room presence atomically
          await dbJoinRoomPresence(uppercaseCode, sessionIdRef.current, getDeviceName());
        }
      }
    }).catch(err => {
      console.error("Error fetching room on mount:", err);
    });

    return () => {
      unsubscribe();
      // Remove current session atomically upon exiting
      dbLeaveRoomPresence(uppercaseCode, sessionIdRef.current).catch(e => console.error(e));
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
        toast('This room has reached its duration limits and has expired.', 'warning', 5000);
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

  // Handler for password lock with secure hashing and brute force protection
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!room) return;
    const uppercaseCode = roomCode.trim().toUpperCase();

    if (AbuseProtection.isPasswordLocked(uppercaseCode)) {
      const remaining = AbuseProtection.getPasswordLockRemaining(uppercaseCode);
      setPasswordError(`Too many failed attempts. Locked. Please try again in ${remaining}s.`);
      toast(`Verification is locked for ${remaining}s.`, 'error');
      return;
    }

    let isValid = false;
    if (room.passwordHash && room.passwordSalt) {
      const hashed = await hashPassword(passwordInput, room.passwordSalt);
      isValid = hashed === room.passwordHash;
    } else if (room.password) {
      isValid = passwordInput === room.password;
    }

    if (isValid) {
      AbuseProtection.resetPasswordAttempts(uppercaseCode);
      setIsAuthenticated(true);
      toast('Shield room unlocked successfully!', 'success');
      
      // Update room presence atomically
      await dbJoinRoomPresence(uppercaseCode, sessionIdRef.current, getDeviceName());
    } else {
      const result = AbuseProtection.recordFailedPasswordAttempt(uppercaseCode);
      if (result.isLocked) {
        setPasswordError('Too many failed attempts. Access locked for 30 seconds.');
        toast('Access locked due to too many failed attempts.', 'error');
      } else {
        const attemptsLeft = 5 - result.attempts;
        setPasswordError(`Invalid password. ${attemptsLeft} attempts remaining.`);
        toast(`Invalid password! ${attemptsLeft} attempts remaining.`, 'error');
      }
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
      await processFileUpload(files);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await processFileUpload(files);
    }
  };

  const processFileUpload = async (fileList: FileList | File[]) => {
    if (!room) return;

    // Rate Limiting Check
    if (!AbuseProtection.checkUploadRateLimit()) {
      setUploadError('Upload frequency too high. Please wait a few seconds before trying again.');
      toast('Upload frequency limit exceeded.', 'error');
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    setFailedFile(null);
    
    const filesArray = Array.from(fileList);
    const maxCapacity = 25 * 1024 * 1024; // 25MB

    // Increment upload stats for feedback trigger
    const currentUploads = Number(localStorage.getItem('68share_upload_count') || '0') + filesArray.length;
    localStorage.setItem('68share_upload_count', String(currentUploads));

    for (const file of filesArray) {
      if (file.size > maxCapacity) {
        setUploadError(`File "${file.name}" is too large (${formatBytes(file.size)}). Max limit is 25MB.`);
        toast(`"${file.name}" exceeds 25MB limit.`, 'error');
        continue;
      }

      setUploadingFileName(file.name);
      setUploadProgress(0);

      try {
        const parsed = await dbUploadFileToRoom(
          room.code, 
          file, 
          (progress) => {
            setUploadProgress(Math.round(progress));
          },
          cancelUploadRef.current
        );
        if (parsed) {
          toast(`Successfully uploaded & shared "${file.name}"!`, 'success');
        }
      } catch (err: any) {
        console.error(err);
        if (err?.code === 'storage/canceled') {
          toast(`Upload of "${file.name}" was cancelled.`, 'warning');
        } else {
          setFailedFile(file);
          setUploadError(`Failed to upload "${file.name}": ${err?.message || 'Transfer error'}`);
          toast(`Failed to upload "${file.name}".`, 'error');
        }
      }
    }

    setIsUploading(false);
    setUploadProgress(null);
    setUploadingFileName(null);
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

  const getDeviceIcon = (name: string) => {
    const lowercase = name.toLowerCase();
    if (lowercase.includes('macbook') || lowercase.includes('dell') || lowercase.includes('thinkpad') || lowercase.includes('laptop')) {
      return <Laptop className="w-4 h-4 text-[#2563EB]" />;
    }
    if (lowercase.includes('iphone') || lowercase.includes('pixel') || lowercase.includes('galaxy') || lowercase.includes('phone')) {
      return <Smartphone className="w-4 h-4 text-[#2563EB]" />;
    }
    if (lowercase.includes('ipad') || lowercase.includes('tablet')) {
      return <Tablet className="w-4 h-4 text-[#2563EB]" />;
    }
    return <Monitor className="w-4 h-4 text-[#2563EB]" />;
  };

  const formatJoinedTime = (isoString: string) => {
    try {
      const joined = new Date(isoString).getTime();
      const diff = Date.now() - joined;
      if (diff < 60000) return 'Just joined';
      const minutes = Math.floor(diff / 60000);
      if (minutes < 60) return `${minutes}m ago`;
      const hours = Math.floor(minutes / 60);
      if (hours < 24) return `${hours}h ago`;
      return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return 'Joined';
    }
  };

  return (
    <section className="py-8 max-w-5xl mx-auto px-4 md:px-6 relative z-10 font-sans">
      
      {/* Top dashboard control header bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-6 border-b border-neutral-200/60 pb-6 mb-8">
        <div className="flex items-center gap-4">
          <button 
            id="back-btn"
            onClick={onLeave}
            className="p-2.5 rounded-full border border-neutral-200 bg-white hover:bg-neutral-50 hover:text-neutral-950 text-neutral-500 hover:scale-105 active:scale-95 hover:shadow-sm transition-all duration-200 cursor-pointer flex items-center justify-center shrink-0 animate-card-gpu"
            title="Go Back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="text-left">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse shrink-0" />
              <h1 className="text-2xl font-bold text-neutral-900 tracking-tight leading-tight">{room.name}</h1>
            </div>
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              <span className="text-[10px] font-sans font-bold tracking-wider text-neutral-400 uppercase">Room Code</span>
              <div className="flex items-center gap-1.5 bg-indigo-50/50 border border-indigo-100/80 rounded-lg px-2 py-0.5">
                <span className="font-mono text-xs font-bold text-indigo-700">{room.code}</span>
                <button 
                  id="copy-code-badge"
                  onClick={handleCopyCode}
                  className="text-neutral-400 hover:text-indigo-600 transition-colors duration-150 cursor-pointer"
                  title="Copy Room Code"
                >
                  {copiedCode ? <Check className="w-3 h-3 text-emerald-600" /> : <Clipboard className="w-3 h-3" />}
                </button>
              </div>

              <span className="text-neutral-300">|</span>

              <button 
                id="share-qr-toggle"
                onClick={() => setShowHeaderQr(!showHeaderQr)}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 font-sans cursor-pointer transition-all duration-150 active:scale-95"
                aria-expanded={showHeaderQr}
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>{showHeaderQr ? 'Hide QR Code' : 'Share QR Code'}</span>
              </button>
            </div>

            {/* Expandable Interactive QR Panel */}
            <AnimatePresence>
              {showHeaderQr && (
                <motion.div
                  initial={{ opacity: 0, y: 12, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 12, scale: 0.95 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                  className="absolute left-0 mt-3 z-50 bg-white border border-neutral-200/90 shadow-2xl rounded-2xl p-5 w-[310px] text-left"
                >
                  <div className="flex items-center justify-between border-b border-neutral-100 pb-2.5 mb-3">
                    <div className="flex items-center gap-2">
                      <QrCode className="w-4 h-4 text-indigo-600" />
                      <span className="font-sans font-bold text-neutral-800 text-sm">Join via QR Code</span>
                    </div>
                    <button 
                      onClick={() => setShowHeaderQr(false)}
                      className="text-neutral-400 hover:text-neutral-700 rounded-full p-1 hover:bg-neutral-50 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex flex-col items-center">
                    {/* Interactive Color Settings */}
                    <div className="flex items-center justify-between w-full mb-3 bg-neutral-50 px-3 py-1.5 rounded-xl border border-neutral-150/40">
                      <span className="text-[9px] font-sans font-bold text-neutral-400 tracking-wider uppercase">Style Color:</span>
                      <div className="flex items-center gap-1.5">
                        {[
                          { name: 'Blue', hex: '2563eb', bg: 'bg-blue-600' },
                          { name: 'Dark', hex: '111111', bg: 'bg-neutral-900' },
                          { name: 'Emerald', hex: '059669', bg: 'bg-emerald-600' },
                          { name: 'Amber', hex: 'ea580c', bg: 'bg-amber-600' },
                        ].map((swatch) => (
                          <button
                            key={swatch.name}
                            onClick={() => setQrColorCode(swatch.hex)}
                            className={`w-3.5 h-3.5 rounded-full cursor-pointer transition-all ${swatch.bg} ${
                              qrColorCode === swatch.hex ? 'ring-2 ring-indigo-500 scale-110' : 'border border-white hover:scale-105'
                            }`}
                            title={swatch.name}
                          />
                        ))}
                      </div>
                    </div>

                    {/* QR Code */}
                    <div className="bg-white p-2.5 rounded-2xl border border-neutral-200 flex items-center justify-center mb-3 shadow-3xs relative overflow-hidden group/qr">
                      <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&color=${qrColorCode}&bgcolor=ffffff&data=${encodeURIComponent(getShareUrl())}`} 
                        alt="Join Room QR Code" 
                        className="w-32 h-32 select-none group-hover/qr:scale-[1.02] transition-transform duration-300"
                        referrerPolicy="no-referrer"
                      />
                    </div>

                    {/* Actions */}
                    <div className="w-full flex gap-2 border-t border-neutral-100 pt-3">
                      <button
                        onClick={() => {
                          const customUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&color=${qrColorCode}&bgcolor=ffffff&data=${encodeURIComponent(getShareUrl())}`;
                          window.open(customUrl, '_blank');
                        }}
                        className="flex-1 bg-white hover:bg-neutral-50 text-neutral-700 border border-neutral-200 py-2 rounded-xl font-sans text-xs font-semibold select-none cursor-pointer transition-colors text-center shadow-3xs flex items-center justify-center gap-1.5 animate-card-gpu"
                      >
                        <Download className="w-3.5 h-3.5 text-neutral-500" />
                        <span>Save</span>
                      </button>

                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(getShareUrl());
                          setCopiedQrLink(true);
                          toast('Room link copied!', 'success', 1500);
                          setTimeout(() => setCopiedQrLink(false), 2000);
                        }}
                        className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-xl font-sans text-xs font-semibold select-none cursor-pointer transition-all duration-150 text-center shadow-xs flex items-center justify-center gap-1.5 hover:shadow-indigo-500/10"
                      >
                        {copiedQrLink ? <Check className="w-3.5 h-3.5" /> : <Clipboard className="w-3.5 h-3.5" />}
                        <span>{copiedQrLink ? 'Copied' : 'Copy link'}</span>
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Status Indicators */}
        <div className="flex items-center gap-3.5 flex-wrap md:flex-nowrap shrink-0">
          {/* Live Screens Counter Widget */}
          <div className="flex items-center gap-2.5 bg-white border border-neutral-200/80 rounded-2xl p-3 px-4 shadow-3xs hover:shadow-2xs transition-shadow duration-200">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-sans font-bold text-neutral-700">
              {room.activeUsers?.length || room.usersOnline || 1} Screen{(room.activeUsers?.length || room.usersOnline || 1) > 1 ? 's' : ''} Live
            </span>
          </div>

          {/* Expiration Timer Widget */}
          <div className="flex items-center gap-2.5 bg-amber-50/50 border border-amber-200/30 rounded-2xl p-3 px-4 shadow-3xs">
            <Clock className="w-4 h-4 text-amber-600 shrink-0" />
            <span className="font-sans text-xs font-semibold text-neutral-500">
              Expires in: <span className="font-mono font-bold text-amber-700">{timeLeft}</span>
            </span>
          </div>

          {/* Delete Room Button */}
          <button
            id="delete-room-btn"
            onClick={handleDeleteRoom}
            className="flex items-center gap-2 bg-rose-50 hover:bg-rose-100 border border-rose-150 text-rose-600 hover:text-rose-750 rounded-2xl p-3 px-4 shadow-3xs transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98] font-sans text-xs font-bold animate-card-gpu"
            title="Delete Room"
          >
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>Delete Room</span>
          </button>
        </div>
      </div>

      {/* Main split dashboard area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        
        {/* Left Columns: Upload area & file listing or Clipboard */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          
          {/* Tab Selector with spring slide animation */}
          <div className="flex bg-neutral-100 p-1.5 rounded-2xl border border-neutral-200/40 gap-1.5 relative z-10">
            <button
              onClick={() => setActiveTab('files')}
              className="flex-1 font-sans font-bold text-xs py-2.5 rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2 relative z-20 select-none"
            >
              {activeTab === 'files' && (
                <motion.div
                  layoutId="activeTabPill"
                  className="absolute inset-0 bg-white rounded-xl shadow-xs border border-black/5 -z-10"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
              <File className={`w-4 h-4 transition-colors ${activeTab === 'files' ? 'text-indigo-600' : 'text-neutral-400'}`} />
              <span className={activeTab === 'files' ? 'text-neutral-900 font-extrabold' : 'text-neutral-500 hover:text-neutral-800'}>Files Vault</span>
            </button>
            <button
              onClick={() => setActiveTab('clipboard')}
              className="flex-1 font-sans font-bold text-xs py-2.5 rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2 relative z-20 select-none"
            >
              {activeTab === 'clipboard' && (
                <motion.div
                  layoutId="activeTabPill"
                  className="absolute inset-0 bg-white rounded-xl shadow-xs border border-black/5 -z-10"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
              <Clipboard className={`w-4 h-4 transition-colors ${activeTab === 'clipboard' ? 'text-indigo-600' : 'text-neutral-400'}`} />
              <span className={activeTab === 'clipboard' ? 'text-neutral-900 font-extrabold' : 'text-neutral-500 hover:text-neutral-800'}>Clipboard Sharing</span>
            </button>
          </div>

          {activeTab === 'files' ? (
            <>
              {/* Active Upload Zone */}
              <div 
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={triggerSelectFile}
                className={`cursor-pointer group relative p-8 md:p-10 border-2 border-dashed rounded-[32px] flex flex-col items-center text-center transition-all duration-300 ${
                  isDragging 
                    ? 'border-indigo-500 bg-indigo-50/20' 
                    : 'border-neutral-200 bg-white hover:border-indigo-400 hover:shadow-lg'
                }`}
              >
                <input 
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                />
                
                <div className="w-14 h-14 rounded-2xl bg-indigo-50/50 border border-indigo-100 flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform duration-300 shadow-3xs">
                  <UploadCloud className="w-7 h-7 text-indigo-600 animate-pulse" />
                </div>

                <h3 className="font-sans font-bold text-neutral-800 mt-5 text-[15px] tracking-tight">
                  {isUploading ? 'Uploading file...' : 'Drag & Drop files here'}
                </h3>
                
                <p className="font-sans text-xs text-neutral-500 mt-1 max-w-[340px] leading-relaxed">
                  {isUploading 
                    ? 'Uploading secure file segments and syncing across all connected screens...' 
                    : 'or click to browse local files. Shared files immediately sync for high-speed download.'}
                </p>

                {/* Acceptable file types guides */}
                <div className="flex flex-wrap items-center justify-center gap-1.5 mt-5 max-w-md">
                  <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-semibold rounded-lg border border-emerald-100/50">Images</span>
                  <span className="px-2.5 py-1 bg-rose-50 text-rose-700 text-[10px] font-semibold rounded-lg border border-rose-100/50 font-sans">Documents</span>
                  <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 text-[10px] font-semibold rounded-lg border border-indigo-100/50 font-sans font-medium">Media</span>
                  <span className="px-2.5 py-1 bg-amber-50 text-amber-700 text-[10px] font-semibold rounded-lg border border-amber-100/50 font-sans">Archives</span>
                  <span className="px-2.5 py-1 bg-neutral-100 text-neutral-600 text-[10px] font-semibold rounded-lg border border-neutral-200/50">Up to 25MB</span>
                </div>

                {uploadProgress !== null && isUploading && (
                  <div className="w-full max-w-sm bg-indigo-50 border border-indigo-100/60 rounded-2xl p-3.5 mt-4 text-left shadow-xs">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] font-sans font-bold text-indigo-950 truncate max-w-[200px]" title={uploadingFileName || ''}>
                        Uploading: {uploadingFileName}
                      </span>
                      <span className="text-[11px] font-mono font-bold text-indigo-700">{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-neutral-200/80 rounded-full h-1.5 overflow-hidden animate-pulse">
                      <div 
                        className="bg-indigo-600 h-1.5 rounded-full transition-all duration-150" 
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (cancelUploadRef.current?.cancel) {
                          cancelUploadRef.current.cancel();
                        }
                      }}
                      className="text-[10px] text-red-600 hover:text-red-700 font-sans font-extrabold uppercase mt-2.5 inline-block cursor-pointer hover:underline"
                    >
                      Cancel Upload
                    </button>
                  </div>
                )}

                {uploadError && (
                  <div className="flex flex-col items-center gap-2 mt-3">
                    <p className="text-red-600 text-xs font-sans font-semibold flex items-center gap-1 bg-red-50 px-3 py-1.5 rounded-lg border border-red-100 animate-bounce">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      {uploadError}
                    </p>
                    {failedFile && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          processFileUpload([failedFile]);
                        }}
                        className="text-xs text-indigo-600 hover:text-indigo-800 font-sans font-bold hover:underline flex items-center gap-1 cursor-pointer animate-card-gpu"
                      >
                        <RefreshCw className="w-3 h-3.5 animate-spin" />
                        <span>Retry Uploading "{failedFile.name}"</span>
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Shared Files Grid Layout */}
              <div className="bg-white border border-neutral-200/80 rounded-[28px] p-6 shadow-sm text-left">
                <div className="flex items-center justify-between border-b border-neutral-100 pb-4 mb-5">
                  <h2 className="text-sm font-sans font-extrabold text-neutral-800 tracking-wider uppercase flex items-center gap-2">
                    <File className="w-4 h-4 text-[#2563EB]" />
                    <span>Shared Files Catalog ({room.files.length})</span>
                  </h2>
                  <span className="text-xs text-neutral-400 font-medium font-sans">
                    {room.files.length > 0 ? 'Click preview or download' : 'Vault is empty'}
                  </span>
                </div>

                {room.files.length === 0 ? (
                  <div className="py-20 text-center rounded-2xl bg-neutral-50/40 border border-neutral-100">
                    <File className="w-11 h-11 text-neutral-300 mx-auto mb-3 animate-pulse" />
                    <h4 className="font-sans font-bold text-sm text-neutral-700">No files uploaded yet</h4>
                    <p className="font-sans text-xs text-neutral-400 mt-1 max-w-[300px] mx-auto leading-relaxed">
                      Files uploaded to this room will immediately sync and pop up for download on all other connected screen dashboards.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[520px] overflow-y-auto pr-1">
                    <AnimatePresence initial={false}>
                      {room.files.map((file) => {
                        const visualTheme = getFileStyleAndIcon(file.name);
                        
                        return (
                          <motion.div 
                            initial={{ opacity: 0, scale: 0.97 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, x: -10 }}
                            whileHover={{ y: -2 }}
                            transition={{ type: "spring", stiffness: 350, damping: 25 }}
                            key={file.id}
                            className="p-4 bg-gradient-to-br from-white to-neutral-50/20 border border-neutral-200/80 hover:border-indigo-400/80 rounded-2xl flex flex-col justify-between gap-4 transition-all duration-300 hover:shadow-md group animate-card-gpu"
                          >
                            <div className="flex items-start gap-3">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-3xs ${visualTheme.bg}`}>
                                {visualTheme.icon}
                              </div>
                              
                              <div className="min-w-0 text-left flex-grow">
                                <h4 className="text-xs font-sans font-bold text-neutral-800 truncate pr-0.5 group-hover:text-indigo-650 transition-colors" title={file.name}>
                                  {file.name}
                                </h4>
                                <p className="text-[9px] font-sans font-extrabold text-neutral-400 uppercase tracking-widest mt-0.5">
                                  {visualTheme.label}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center justify-between border-t border-neutral-100/80 pt-3 relative z-10">
                              <div className="text-[10px] font-sans text-neutral-500 flex flex-col">
                                <span className="font-bold text-neutral-700 font-mono">{formatBytes(file.size)}</span>
                                <span className="text-neutral-400 mt-0.5 truncate max-w-[130px] font-medium" title={`Uploaded by ${file.uploader}`}>
                                  By: {file.uploader}
                                </span>
                              </div>

                              <div className="flex gap-1.5 items-center">
                                {isPreviewable(file.name) && (
                                  <button
                                    id={`preview-btn-${file.id}`}
                                    onClick={async (e) => {
                                      e.stopPropagation();
                                      toast(`Assembling preview for "${file.name}"...`, 'success', 1500);
                                      await handlePreviewFile(file);
                                    }}
                                    className="bg-white hover:bg-neutral-50 text-neutral-600 hover:text-neutral-900 w-8.5 h-8.5 rounded-xl flex items-center justify-center transition-all select-none shadow-3xs hover:scale-105 cursor-pointer border border-neutral-200"
                                    title="Preview File"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </button>
                                )}

                                <button 
                                  id={`download-btn-${file.id}`}
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    toast(`Downloading "${file.name}"...`, 'success', 2000);
                                    
                                    // Update local stats for feedback trigger
                                    const currentDownloads = Number(localStorage.getItem('68share_download_count') || '0') + 1;
                                    localStorage.setItem('68share_download_count', String(currentDownloads));

                                    await dbTriggerDownload(file, roomCode);
                                  }}
                                  className="bg-indigo-600 hover:bg-indigo-700 text-white w-8.5 h-8.5 rounded-xl flex items-center justify-center transition-all select-none shadow-xs hover:scale-105 cursor-pointer hover:shadow-indigo-500/10"
                                  title="Download File"
                                >
                                  <Download className="w-4 h-4" />
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
            </>
          ) : (
            <ClipboardSync room={room} onUpdateRoom={dbUpdateRoom} />
          )}

        </div>

        {/* Right Columns: Share utilities & Activity logs */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          
          {/* Share widgets */}
          <div className="bg-white border border-neutral-200/80 rounded-[28px] p-5 shadow-sm text-left relative overflow-hidden">
            <h3 className="font-sans font-bold text-neutral-400 text-[10px] tracking-wider uppercase mb-3.5 flex items-center gap-1">
              <Share2 className="w-3.5 h-3.5 text-indigo-500" />
              <span>Room Share accessories</span>
            </h3>
            
            <div className="flex flex-col gap-3">
              <button 
                onClick={handleCopyLink}
                className="w-full bg-neutral-50/50 hover:bg-neutral-50 border border-neutral-200 hover:border-neutral-300 rounded-xl p-2.5 px-3 flex items-center justify-between text-left transition-all active:scale-[0.99] cursor-pointer group animate-card-gpu"
              >
                <div className="truncate pr-2">
                  <span className="text-[9px] font-sans text-neutral-400 uppercase block leading-none mb-1 font-extrabold">Copy Room Join URL</span>
                  <span className="text-xs text-neutral-600 font-mono truncate block max-w-[185px]">{getShareUrl()}</span>
                </div>
                <div className="shrink-0 p-1.5 bg-white rounded-lg border border-neutral-200 shadow-3xs group-hover:border-neutral-300 transition-colors">
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Clipboard className="w-3.5 h-3.5 text-neutral-500" />}
                </div>
              </button>

              {/* QR expander */}
              <div className="border border-neutral-200 rounded-xl p-3 bg-white shadow-3xs">
                <button
                  onClick={() => setShowQr(!showQr)}
                  className="w-full font-sans text-xs font-semibold text-neutral-600 hover:text-neutral-850 flex items-center justify-between cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <QrCode className="w-4 h-4 text-indigo-600" />
                    <span>{showQr ? 'Hide Large QR Code' : 'Display QR Code'}</span>
                  </span>
                  <span className="text-[10px] uppercase font-bold text-neutral-400">{showQr ? 'Close' : 'View'}</span>
                </button>

                {showQr && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="flex flex-col items-center gap-3 mt-3 border-t border-neutral-100 pt-3"
                  >
                    <div className="bg-white p-2 rounded-xl border border-neutral-150 flex items-center justify-center">
                      <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&color=${qrColorCode}&bgcolor=ffffff&data=${encodeURIComponent(getShareUrl())}`} 
                        alt="Room QR Code" 
                        className="w-24 h-24 select-none animate-card-gpu"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <span className="text-[10px] text-neutral-400 font-sans text-center max-w-[190px] leading-relaxed font-medium">
                      Scan this code with an external device camera to connect to this space instantly.
                    </span>
                  </motion.div>
                )}
              </div>
            </div>
          </div>



          {/* Activity Logs (Professional activity card) */}
          <div className="bg-white border border-neutral-200/80 rounded-[28px] p-5 shadow-xs flex flex-col justify-between flex-grow min-h-[350px]">
            <div>
              <div className="flex items-center justify-between border-b border-neutral-100 pb-3 mb-4">
                <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1">
                  <Activity className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Activity Timeline</span>
                </span>
                <span className="text-[9px] font-mono font-bold text-neutral-400 bg-neutral-100 px-1.5 py-0.5 rounded uppercase border border-neutral-200">Real-time</span>
              </div>

              {/* Beautiful custom-designed light timeline track */}
              <div className="relative pl-6 space-y-4 border-l-2 border-neutral-100 ml-2.5 my-1.5 max-h-[240px] overflow-y-auto pr-1">
                {room.activity.map((act) => {
                  const getEventMeta = (type: string) => {
                    switch (type) {
                      case 'upload':
                        return { icon: <UploadCloud className="w-3 h-3" />, color: 'bg-emerald-50 text-emerald-600 border-emerald-150 shadow-3xs' };
                      case 'download':
                        return { icon: <Download className="w-3 h-3" />, color: 'bg-blue-50 text-blue-600 border-blue-150 shadow-3xs' };
                      case 'leave':
                        return { icon: <X className="w-3 h-3" />, color: 'bg-rose-50 text-rose-600 border-rose-150 shadow-3xs' };
                      case 'clipboard':
                        return { icon: <Clipboard className="w-3 h-3" />, color: 'bg-amber-50 text-amber-600 border-amber-150 shadow-3xs' };
                      default:
                        return { icon: <Users className="w-3 h-3" />, color: 'bg-indigo-50 text-indigo-600 border-indigo-150 shadow-3xs' };
                    }
                  };
                  const meta = getEventMeta(act.type);
                  return (
                    <div key={act.id} className="relative text-left font-sans text-xs pl-1">
                      {/* Timeline Bullet */}
                      <span className={`absolute -left-[31px] top-0.5 w-5 h-5 rounded-full flex items-center justify-center border ${meta.color} bg-white`}>
                        {meta.icon}
                      </span>
                      <div className="flex flex-col gap-0.5">
                        <p className="text-neutral-700 font-semibold leading-normal">{act.details}</p>
                        <span className="text-[9px] font-mono text-neutral-400 font-medium">
                          {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="border-t border-neutral-100/80 pt-3 mt-4 text-center font-sans text-[10px] text-neutral-400 font-semibold flex items-center justify-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping" />
              <span>Listening for live connection & device actions...</span>
            </div>
          </div>

        </div>

      </div>

      {/* File Preview Modal */}
      <AnimatePresence>
        {previewFile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-neutral-950/40 backdrop-blur-md z-50 flex items-center justify-center p-4 md:p-6"
            onClick={closePreview}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: "spring", duration: 0.4 }}
              className="bg-white rounded-[28px] border border-neutral-200/80 shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden text-left"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-5 border-b border-neutral-100 bg-neutral-50/50">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-3xs ${getFileStyleAndIcon(previewFile.name).bg}`}>
                    {getFileStyleAndIcon(previewFile.name).icon}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-sans font-bold text-neutral-800 truncate pr-2" title={previewFile.name}>
                      {previewFile.name}
                    </h3>
                    <p className="text-[10px] font-sans font-semibold text-neutral-400 uppercase tracking-wider mt-0.5">
                      {formatBytes(previewFile.size)} • Uploaded by {previewFile.uploader}
                    </p>
                  </div>
                </div>
                <button
                  id="close-preview-x"
                  onClick={closePreview}
                  className="w-8 h-8 rounded-full bg-white border border-neutral-200 flex items-center justify-center text-neutral-500 hover:text-neutral-800 hover:shadow-xs transition-all cursor-pointer animate-card-gpu"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Content Area */}
              <div className="flex-grow overflow-auto p-6 flex flex-col items-center justify-center min-h-[250px] bg-neutral-50/20">
                {previewLoading && (
                  <div className="flex flex-col items-center gap-3 text-neutral-500 py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                    <span className="text-xs font-medium font-sans animate-pulse">Assembling secure preview payload...</span>
                  </div>
                )}

                {previewError && (
                  <div className="flex flex-col items-center gap-3 text-neutral-500 max-w-md text-center py-12">
                    <AlertTriangle className="w-10 h-10 text-amber-500" />
                    <p className="text-sm font-sans font-bold text-neutral-700">Preview Generation Error</p>
                    <p className="text-xs font-sans text-neutral-500">{previewError}</p>
                  </div>
                )}

                {!previewLoading && !previewError && previewContent && (() => {
                  const ext = previewFile.name.split('.').pop()?.toLowerCase() || '';
                  const isImage = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp'].includes(ext);
                  const isPdf = ext === 'pdf';
                  const isAudio = ['mp3', 'wav', 'ogg', 'm4a', 'aac'].includes(ext);
                  const isVideo = ['mp4', 'webm', 'mov'].includes(ext);

                  return (
                    <div className="w-full h-full flex items-center justify-center">
                      {isImage && (
                        <img
                          src={previewContent}
                          alt={previewFile.name}
                          className="max-h-[55vh] md:max-h-[62vh] object-contain rounded-xl border border-neutral-200/60 shadow-xs bg-white p-1.5 select-none animate-card-gpu"
                          referrerPolicy="no-referrer"
                        />
                      )}

                      {isPdf && (
                        <object
                          data={previewContent}
                          type="application/pdf"
                          className="w-full h-[55vh] md:h-[60vh] rounded-xl border border-neutral-200"
                        >
                          <iframe
                            src={previewContent}
                            className="w-full h-full border-none rounded-xl"
                            title="PDF Preview"
                          />
                        </object>
                      )}

                      {isAudio && (
                        <div className="flex flex-col items-center gap-4 p-8 bg-white rounded-3xl border border-neutral-200/80 max-w-md w-full shadow-md">
                          <Music className="w-16 h-16 text-indigo-500 animate-pulse" />
                          <span className="text-xs font-semibold text-neutral-600 truncate max-w-xs">{previewFile.name}</span>
                          <audio
                            src={previewContent}
                            controls
                            className="w-full mt-2"
                            autoPlay={false}
                          />
                        </div>
                      )}

                      {isVideo && (
                        <video
                          src={previewContent}
                          controls
                          className="max-h-[55vh] md:max-h-[62vh] rounded-xl border border-neutral-200/60 shadow-xs bg-black w-full"
                        />
                      )}

                      {!isImage && !isPdf && !isAudio && !isVideo && (
                        <div className="w-full max-h-[55vh] md:max-h-[62vh] bg-white rounded-xl border border-neutral-200/80 shadow-3xs overflow-auto">
                          <pre className="font-mono text-[11px] leading-relaxed text-neutral-800 p-5 whitespace-pre-wrap select-text text-left">
                            {previewContent}
                          </pre>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-neutral-100 bg-neutral-50/50 flex items-center justify-between">
                <span className="text-[10px] font-sans text-neutral-400 font-semibold flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Verification Preview Mode • Files are encrypted in transit</span>
                </span>
                
                <div className="flex items-center gap-2.5">
                  <button
                    id="close-preview-btn"
                    onClick={closePreview}
                    className="px-4 py-2 bg-white hover:bg-neutral-50 border border-neutral-200 hover:border-neutral-300 text-neutral-700 font-sans font-semibold text-xs rounded-xl transition-all cursor-pointer shadow-3xs active:scale-[0.99] animate-card-gpu"
                  >
                    Close View
                  </button>
                  <button
                    id="download-preview-btn"
                    onClick={async () => {
                      toast(`Downloading "${previewFile.name}"...`, 'success', 2000);
                      const currentDownloads = Number(localStorage.getItem('68share_download_count') || '0') + 1;
                      localStorage.setItem('68share_download_count', String(currentDownloads));
                      await dbTriggerDownload(previewFile, roomCode);
                    }}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-750 text-white font-sans font-semibold text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-[0.99] hover:scale-[1.01] animate-card-gpu"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download File</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Room Deletion Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-neutral-950/40 backdrop-blur-md z-50 flex items-center justify-center p-4"
            onClick={() => !isDeleting && setShowDeleteConfirm(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: "spring", duration: 0.4 }}
              className="bg-white rounded-[28px] border border-neutral-200/80 shadow-2xl w-full max-w-md p-6 overflow-hidden text-center"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4 border border-rose-100">
                <AlertTriangle className="w-6 h-6 text-rose-600" />
              </div>

              <h3 className="text-base font-sans font-bold text-neutral-800">Delete Room?</h3>
              <p className="text-xs text-neutral-500 font-sans mt-2 leading-relaxed">
                You are about to permanently delete room <strong className="font-mono text-neutral-700">{room.code}</strong>. This will instantly disconnect all screens and delete all uploaded items.
              </p>

              <div className="flex gap-3 mt-6">
                <button
                  id="cancel-delete-btn"
                  disabled={isDeleting}
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 px-4 py-2.5 bg-neutral-100 hover:bg-neutral-200 border border-neutral-200 text-neutral-700 font-sans font-bold text-xs rounded-xl transition-all cursor-pointer shadow-3xs hover:scale-102 active:scale-98 disabled:opacity-50"
                >
                  No, Keep Room
                </button>
                <button
                  id="confirm-delete-btn"
                  disabled={isDeleting}
                  onClick={confirmDeleteRoom}
                  className="flex-1 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-sans font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs hover:scale-102 active:scale-98 disabled:opacity-50"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <span>Yes, Delete Room</span>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </section>
  );
}
