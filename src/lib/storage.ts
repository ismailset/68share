import { Room, SharedFile, ActivityItem, RoomDuration } from '../types';

const STORAGE_KEYS = {
  ROOMS: '68share_rooms_v1',
  USER_DEVICE: '68share_user_device',
};

// Get or create unique uploader/device name
export function getDeviceName(): string {
  let device = localStorage.getItem(STORAGE_KEYS.USER_DEVICE);
  if (!device) {
    const brands = ['MacBook Air', 'MacBook Pro', 'iPhone 15 Pro', 'Galaxy S24 Ultra', 'Dell XPS', 'iPad Pro', 'ThinkPad X1', 'Pixel 8 Pro'];
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

// Get all non-expired rooms
export function getAllRooms(): Record<string, Room> {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ROOMS);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, Room>;
    
    // Filter out expired rooms on-the-fly
    const now = new Date().getTime();
    const active: Record<string, Room> = {};
    let altered = false;

    for (const code in parsed) {
      const room = parsed[code];
      const expiry = new Date(room.expiresAt).getTime();
      if (now < expiry) {
        active[code] = room;
      } else {
        // Automatically delete associated larger keys if any
        room.files.forEach(file => {
          localStorage.removeItem(`68share_file_data_${file.id}`);
        });
        altered = true;
      }
    }

    if (altered) {
      localStorage.setItem(STORAGE_KEYS.ROOMS, JSON.stringify(active));
    }

    return active;
  } catch (e) {
    console.error('Error parsing rooms', e);
    return {};
  }
}

// Save rooms dictionary
function saveRooms(rooms: Record<string, Room>) {
  try {
    localStorage.setItem(STORAGE_KEYS.ROOMS, JSON.stringify(rooms));
  } catch (e) {
    console.error('Error saving rooms', e);
  }
}

// Get particular room by code
export function getRoom(code: string): Room | null {
  const activeRooms = getAllRooms();
  const room = activeRooms[code.toUpperCase()];
  if (!room) return null;
  return room;
}

// Create a new room
export function createRoom(name: string, duration: RoomDuration, password?: string | null): Room {
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
        timestamp: new Date().toISOString(),
        type: 'join',
        details: `${getDeviceName()} created and joined the room.`,
      }
    ],
    usersOnline: 1, // Will fluctuate with multiple tabs open
  };

  const activeRooms = getAllRooms();
  activeRooms[code] = newRoom;
  saveRooms(activeRooms);

  return newRoom;
}

// Update specific fields of a room
export function updateRoom(room: Room): void {
  const activeRooms = getAllRooms();
  activeRooms[room.code] = room;
  saveRooms(activeRooms);
  
  // Custom event trigger so other tabs or hooks receive active state changes
  window.dispatchEvent(new Event('68share_rooms_changed'));
}

// Upload file to room - chunks into single files
export async function uploadFileToRoom(roomCode: string, file: File): Promise<SharedFile | null> {
  const room = getRoom(roomCode);
  if (!room) return null;

  const fileId = crypto.randomUUID();
  const uploader = getDeviceName();

  // Helper to read file to base64
  const readAsDataUrl = (f: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(f);
    });
  };

  let dataUrl = '';
  // Bound max offline preview size to 4.5MB to stay within localStorage constraints safely
  const maxStorageSize = 4 * 1024 * 1024;
  if (file.size <= maxStorageSize) {
    try {
      dataUrl = await readAsDataUrl(file);
      // To satisfy local quotas, let's keep large file payloads segmented from the core room record
      localStorage.setItem(`68share_file_data_${fileId}`, dataUrl);
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
    // Store dataUrl only if it was small enough to fit inline, else keep external indicator
    dataUrl: file.size <= maxStorageSize ? `LOCAL_STORAGE:${fileId}` : undefined,
  };

  const activityItem: ActivityItem = {
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    type: 'upload',
    details: `${uploader} uploaded "${file.name}" (${formatBytes(file.size)}).`,
  };

  room.files.unshift(newFile);
  room.activity.unshift(activityItem);
  
  updateRoom(room);
  return newFile;
}

// Retrieve direct file data (either inline or segmented key)
export function getFileData(file: SharedFile): string | null {
  if (!file.dataUrl) return null;
  if (file.dataUrl.startsWith('LOCAL_STORAGE:')) {
    const key = file.dataUrl.substring(14);
    return localStorage.getItem(`68share_file_data_${key}`);
  }
  return file.dataUrl;
}

// Trigger browser download of file
export function triggerDownload(file: SharedFile) {
  const base64Data = getFileData(file);
  const uploader = getDeviceName();
  
  if (base64Data) {
    const link = document.createElement('a');
    link.href = base64Data;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } else {
    // Large File simulation download
    const blob = new Blob([`Simulated file download content for ${file.name}`], { type: file.type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  // Update room activity logs for download
  const room = getRoom(localStorage.getItem('68share_active_room_code') || '');
  if (room) {
    const activityItem: ActivityItem = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      type: 'download',
      details: `${uploader} downloaded "${file.name}".`,
    };
    room.activity.unshift(activityItem);
    updateRoom(room);
  }
}

// Helper: formats bytes seamlessly
export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// QR Code helper URL
export function getQrCodeUrl(url: string): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&color=111111&bgcolor=ffffff&data=${encodeURIComponent(url)}`;
}
