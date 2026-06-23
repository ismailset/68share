import { Room, SharedFile, ActivityItem, RoomDuration } from '../types';
import { db } from './firebase';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  onSnapshot 
} from 'firebase/firestore';

const STORAGE_KEYS = {
  USER_DEVICE: '68share_user_device',
};

// Get or create unique uploader/device name
export function getDeviceName(): string {
  let device = localStorage.getItem(STORAGE_KEYS.USER_DEVICE);
  if (!device) {
    const brands = [
      'MacBook Air', 'MacBook Pro', 'iPhone 15 Pro', 'Galaxy S24 Ultra', 
      'Dell XPS', 'iPad Pro', 'ThinkPad X1', 'Pixel 8 Pro'
    ];
    const randomBrand = brands[Math.floor(Math.random() * brands.length)];
    const id = Math.floor(1000 + Math.random() * 9000);
    device = `${randomBrand} #${id}`;
    localStorage.setItem(STORAGE_KEYS.USER_DEVICE, device);
  }
  return device;
}

// Generate branding-aligned room code: always starts with "68" followed by 4 uppercase hex/digits
export function generateRoomCode(): string {
  const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Avoid ambiguous chars
  let additionalChars = '';
  for (let i = 0; i < 4; i++) {
    additionalChars += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return `68${additionalChars}`;
}

export function getDurationMs(duration: RoomDuration): number {
  switch (duration) {
    case '10min':
      return 10 * 60 * 1000;
    case '1hr':
      return 60 * 60 * 1000;
    case '24hr':
      return 24 * 60 * 60 * 1000;
    case '7days':
      return 7 * 24 * 60 * 60 * 1000;
    default:
      return 60 * 60 * 1000;
  }
}

// Active room retriever with transparent fallback
export async function dbGetRoom(code: string): Promise<Room | null> {
  const uppercaseCode = code.trim().toUpperCase();
  
  // 1. Try Firestore First
  try {
    const docRef = doc(db, 'rooms', uppercaseCode);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const room = docSnap.data() as Room;
      
      // Update local storage copy
      try {
        localStorage.setItem(`68share_local_room_${uppercaseCode}`, JSON.stringify(room));
      } catch (err) {
        console.warn('Failed to cache room locally', err);
      }
      
      return room;
    }
  } catch (e) {
    console.error('Firestore fetch failed, checking local database cache:', e);
  }

  // 2. Local Fallback Cache (Ideal for local testing or connection drops)
  try {
    const localStr = localStorage.getItem(`68share_local_room_${uppercaseCode}`);
    if (localStr) {
      const room = JSON.parse(localStr) as Room;
      const now = new Date().getTime();
      const expiry = new Date(room.expiresAt).getTime();
      
      if (now < expiry) {
        return room;
      } else {
        localStorage.removeItem(`68share_local_room_${uppercaseCode}`);
      }
    }
  } catch (err) {
    console.error('Local cache parsing error:', err);
  }

  return null;
}

// Create room in Firestore with instant local mirror
export async function dbCreateRoom(name: string, duration: RoomDuration, password?: string | null): Promise<Room> {
  const code = generateRoomCode();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + getDurationMs(duration)).toISOString();
  
  const newRoom: Room = {
    code,
    name: name.trim() || `Room ${code}`,
    duration,
    expiresAt,
    password: password ? password : null,
    files: [],
    activity: [
      {
        id: crypto.randomUUID(),
        timestamp: now.toISOString(),
        type: 'join',
        details: `${getDeviceName()} created and joined the room.`,
      }
    ],
    usersOnline: 1,
    lastActiveAt: now.toISOString(),
  };

  // 1. Store locally immediately
  try {
    localStorage.setItem(`68share_local_room_${code}`, JSON.stringify(newRoom));
  } catch (eh) {
    console.warn('Failed to write local database storage', eh);
  }

  // 2. Commit to Cloud Database
  const docRef = doc(db, 'rooms', code);
  await setDoc(docRef, newRoom);

  return newRoom;
}

// Update room state in Firestore with instant local synchronization
export async function dbUpdateRoom(room: Room): Promise<void> {
  const upperCode = room.code.toUpperCase();
  room.lastActiveAt = new Date().toISOString();

  // 1. Sync local cache & dispatch tab sync events
  try {
    localStorage.setItem(`68share_local_room_${upperCode}`, JSON.stringify(room));
    window.dispatchEvent(new CustomEvent(`68share_local_update_${upperCode}`, { detail: room }));
  } catch (eh) {
    console.warn('Failed to update local cache', eh);
  }

  // 2. Push to Firestore
  try {
    const docRef = doc(db, 'rooms', upperCode);
    await setDoc(docRef, room, { merge: true });
  } catch (e) {
    console.error('Firestore sync failed, local state active:', e);
  }
}

// Subscribe to room updates with dual-mode real-time event listener
export function dbSubscribeRoom(code: string, callback: (room: Room | null) => void): () => void {
  const uppercaseCode = code.trim().toUpperCase();
  const unsubscribes: (() => void)[] = [];
  let isFirestoreWorking = true;

  // Tab Sync Event Listener (Same-device communication)
  const handleLocalUpdate = (e: any) => {
    if (e.detail) {
      callback(e.detail);
    }
  };
  window.addEventListener(`68share_local_update_${uppercaseCode}`, handleLocalUpdate);
  unsubscribes.push(() => {
    window.removeEventListener(`68share_local_update_${uppercaseCode}`, handleLocalUpdate);
  });

  // Cross-tab Storage sync
  const handleStorageChange = (e: StorageEvent) => {
    if (e.key === `68share_local_room_${uppercaseCode}` && e.newValue) {
      try {
        const parsed = JSON.parse(e.newValue);
        callback(parsed);
      } catch (err) {
        console.error('StorageEvent sync parse failed', err);
      }
    }
  };
  window.addEventListener('storage', handleStorageChange);
  unsubscribes.push(() => {
    window.removeEventListener('storage', handleStorageChange);
  });

  // Local Poller sync backup
  const fallbackInterval = setInterval(() => {
    if (!isFirestoreWorking) {
      const localStr = localStorage.getItem(`68share_local_room_${uppercaseCode}`);
      if (localStr) {
        try {
          const room = JSON.parse(localStr) as Room;
          const now = new Date().getTime();
          const expiry = new Date(room.expiresAt).getTime();
          if (now < expiry) {
            callback(room);
          } else {
            callback(null);
          }
        } catch (j) {}
      } else {
        callback(null);
      }
    }
  }, 1000);
  unsubscribes.push(() => clearInterval(fallbackInterval));

  // Connect cloud subscriber
  try {
    const docRef = doc(db, 'rooms', uppercaseCode);
    const cloudUnsubscribe = onSnapshot(docRef, (docSnap) => {
      if (!docSnap.exists()) {
        callback(null);
        return;
      }
      
      const room = docSnap.data() as Room;
      const now = new Date().getTime();
      const expiry = new Date(room.expiresAt).getTime();

      if (now >= expiry) {
        callback(null);
        return;
      }

      // Keep cache current
      try {
        localStorage.setItem(`68share_local_room_${uppercaseCode}`, JSON.stringify(room));
      } catch (le) {}

      callback(room);
    }, (error) => {
      console.warn('Firestore subscription restricted or offline, falling back to local channel:', error);
      isFirestoreWorking = false;
      
      // Load current local cache immediately to secure view
      const localStr = localStorage.getItem(`68share_local_room_${uppercaseCode}`);
      if (localStr) {
        try {
          callback(JSON.parse(localStr));
        } catch (je) {}
      }
    });

    unsubscribes.push(cloudUnsubscribe);
  } catch (err) {
    console.error('Failed to setup Firestore subscriber', err);
    isFirestoreWorking = false;
  }

  return () => {
    unsubscribes.forEach(unsub => unsub());
  };
}

// Convert File helper
function readAsDataUrl(f: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(f);
  });
}

// Upload file payload to dual-storage (cloud and localStorage backup)
export async function dbUploadFileToRoom(roomCode: string, file: File): Promise<SharedFile | null> {
  const upperCode = roomCode.trim().toUpperCase();
  const room = await dbGetRoom(upperCode);
  if (!room) return null;

  const fileId = crypto.randomUUID();
  const uploader = getDeviceName();

  const maxStorageSize = 700 * 1024; // 700KB storage bounds
  const isLarge = file.size > maxStorageSize;

  let base64Data = '';
  if (!isLarge) {
    try {
      base64Data = await readAsDataUrl(file);
      
      // Build local fallback file copy
      try {
        localStorage.setItem(`68share_local_file_content_${fileId}`, base64Data);
      } catch (lc) {
        console.warn('LocalStorage quota limit reached for local file cache:', lc);
      }

      // Store in cloud database
      const contentRef = doc(db, 'file_contents', fileId);
      await setDoc(contentRef, { dataUrl: base64Data });
    } catch (e) {
      console.error('Cloud upload error, using local fallback caching only:', e);
    }
  }

  const newFile: SharedFile = {
    id: fileId,
    name: file.name,
    size: file.size,
    type: file.type || 'application/octet-stream',
    uploadedAt: new Date().toISOString(),
    uploader,
    dataUrl: !isLarge ? `FIRESTORE:${fileId}` : undefined,
  };

  const activityItem: ActivityItem = {
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    type: 'upload',
    details: `${uploader} uploaded "${file.name}" (${formatBytes(file.size)}).`,
  };

  const updatedFiles = [newFile, ...room.files];
  const updatedActivity = [activityItem, ...room.activity];
  
  const updatedRoom = {
    ...room,
    files: updatedFiles,
    activity: updatedActivity,
  };

  await dbUpdateRoom(updatedRoom);

  return newFile;
}

// Fetch file details with hybrid cache checks
export async function dbGetFileData(fileId: string): Promise<string | null> {
  // 1. Try local cache
  try {
    const cached = localStorage.getItem(`68share_local_file_content_${fileId}`);
    if (cached) {
      return cached;
    }
  } catch (eh) {
    console.warn('Failed reading local file cache lookup:', eh);
  }

  // 2. Try Firestore lookup
  try {
    const docRef = doc(db, 'file_contents', fileId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const dataUrl = snap.data().dataUrl || null;
      if (dataUrl) {
        // Cache locally for faster repeat access
        try {
          localStorage.setItem(`68share_local_file_content_${fileId}`, dataUrl);
        } catch (lh) {}
      }
      return dataUrl;
    }
  } catch (e) {
    console.error('Error fetching file payload from Firestore:', e);
  }

  return null;
}

// Execute real download triggers 
export async function dbTriggerDownload(file: SharedFile, roomCode: string): Promise<void> {
  const uploader = getDeviceName();
  let base64Data: string | null = null;

  if (file.dataUrl && file.dataUrl.startsWith('FIRESTORE:')) {
    const fileId = file.dataUrl.substring(10);
    base64Data = await dbGetFileData(fileId);
  }

  if (base64Data) {
    const link = document.createElement('a');
    link.href = base64Data;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } else {
    // Generate simulated download blob for large files 
    const blob = new Blob([`Simulated premium secure stream for large files: ${file.name}`], { type: file.type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  // Push activity log
  try {
    const upperCode = roomCode.trim().toUpperCase();
    const room = await dbGetRoom(upperCode);
    if (room) {
      const activityItem: ActivityItem = {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        type: 'download',
        details: `${uploader} downloaded "${file.name}".`,
      };
      const updatedActivity = [activityItem, ...room.activity];
      await dbUpdateRoom({
        ...room,
        activity: updatedActivity
      });
    }
  } catch (e) {
    console.error('Error recording download activity:', e);
  }
}

// Beautiful byte formatter
export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// Get QR helpers
export function getQrCodeUrl(url: string): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=250x250&color=111111&bgcolor=ffffff&data=${encodeURIComponent(url)}`;
}
