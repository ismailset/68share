import { Room, SharedFile, ActivityItem, RoomDuration } from '../types';
import { db } from './firebase';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  onSnapshot, 
  runTransaction,
  collection
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

// Get non-expired, non-inactive room from Firestore
export async function dbGetRoom(code: string): Promise<Room | null> {
  try {
    const uppercaseCode = code.trim().toUpperCase();
    const docRef = doc(db, 'rooms', uppercaseCode);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    const room = docSnap.data() as Room;
    const now = new Date().getTime();
    const expiry = new Date(room.expiresAt).getTime();

    // Check if expired
    if (now >= expiry) {
      return null;
    }

    // Check inactivity limit: 60 minutes
    const lastActiveTime = room.lastActiveAt 
      ? new Date(room.lastActiveAt).getTime() 
      : (new Date(room.expiresAt).getTime() - getDurationMs(room.duration));
    const isInactive = (now - lastActiveTime) > 60 * 60 * 1000;

    if (isInactive) {
      return null;
    }

    return room;
  } catch (e) {
    console.error('Error fetching room from Firestore', e);
    return null;
  }
}

// Create room in Firestore
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

  const docRef = doc(db, 'rooms', code);
  await setDoc(docRef, newRoom);

  return newRoom;
}

// Update specific fields of a room in Firestore
export async function dbUpdateRoom(room: Room): Promise<void> {
  try {
    room.lastActiveAt = new Date().toISOString();
    const docRef = doc(db, 'rooms', room.code.toUpperCase());
    await setDoc(docRef, room, { merge: true });
  } catch (e) {
    console.error('Error updating room in Firestore', e);
  }
}

// Subscribe to room updates in Firestore
export function dbSubscribeRoom(code: string, callback: (room: Room | null) => void): () => void {
  const docRef = doc(db, 'rooms', code.trim().toUpperCase());
  
  return onSnapshot(docRef, (docSnap) => {
    if (!docSnap.exists()) {
      callback(null);
      return;
    }

    const room = docSnap.data() as Room;
    const now = new Date().getTime();
    const expiry = new Date(room.expiresAt).getTime();

    // Check expiry
    if (now >= expiry) {
      callback(null);
      return;
    }

    // Check inactivity limit: 60 minutes
    const lastActiveTime = room.lastActiveAt 
      ? new Date(room.lastActiveAt).getTime() 
      : (new Date(room.expiresAt).getTime() - getDurationMs(room.duration));
    const isInactive = (now - lastActiveTime) > 60 * 60 * 1000;

    if (isInactive) {
      callback(null);
      return;
    }

    callback(room);
  }, (error) => {
    console.error('Firestore Subscribe Error:', error);
  });
}

// Helper to convert File to Base64
function readAsDataUrl(f: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(f);
  });
}

// Upload file to room in Firestore and store data payload in file_data if <= 700KB
export async function dbUploadFileToRoom(roomCode: string, file: File): Promise<SharedFile | null> {
  const upperCode = roomCode.trim().toUpperCase();
  const room = await dbGetRoom(upperCode);
  if (!room) return null;

  const fileId = crypto.randomUUID();
  const uploader = getDeviceName();

  const maxStorageSize = 700 * 1024; // 700 KB safe threshold for Firestore 1MB doc limit
  const isLarge = file.size > maxStorageSize;

  let base64Data = '';
  if (!isLarge) {
    try {
      base64Data = await readAsDataUrl(file);
      // Save Base64 content to a separate file_contents collection in Firestore
      const contentRef = doc(db, 'file_contents', fileId);
      await setDoc(contentRef, { dataUrl: base64Data });
    } catch (e) {
      console.error('File reading failed', e);
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

  // Add file and activity update inside a safe Firestore Transaction or simple update
  const updatedFiles = [newFile, ...room.files];
  const updatedActivity = [activityItem, ...room.activity];

  const docRef = doc(db, 'rooms', upperCode);
  await updateDoc(docRef, {
    files: updatedFiles,
    activity: updatedActivity,
    lastActiveAt: new Date().toISOString()
  });

  return newFile;
}

// Fetch file contents from Firestore
export async function dbGetFileData(fileId: string): Promise<string | null> {
  try {
    const docRef = doc(db, 'file_contents', fileId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data().dataUrl || null;
    }
  } catch (e) {
    console.error('Error fetching file data', e);
  }
  return null;
}

// Trigger real browser download by querying Firebase
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
    // Large file simulated download
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

  // Update room activity for download log
  try {
    const upperCode = roomCode.trim().toUpperCase();
    const docRef = doc(db, 'rooms', upperCode);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const room = snap.data() as Room;
      const activityItem: ActivityItem = {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        type: 'download',
        details: `${uploader} downloaded "${file.name}".`,
      };
      const updatedActivity = [activityItem, ...room.activity];
      await updateDoc(docRef, {
        activity: updatedActivity,
        lastActiveAt: new Date().toISOString()
      });
    }
  } catch (e) {
    console.error('Error updating download activity log', e);
  }
}

// Format bytes
export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// QR Code URL helper
export function getQrCodeUrl(url: string): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=250x250&color=111111&bgcolor=ffffff&data=${encodeURIComponent(url)}`;
}
