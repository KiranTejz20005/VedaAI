import { io, type Socket } from 'socket.io-client';
import { normalizeBaseUrl } from '@/utils/url';

// In production, NEXT_PUBLIC_SOCKET_URL must be set via Vercel env vars
// In development, NEXT_PUBLIC_SOCKET_URL defaults to localhost
// If the env var is missing in production, this fails at build time via Next.js static analysis
const rawSocketUrl = process.env.NEXT_PUBLIC_SOCKET_URL;
const SOCKET_URL =
  rawSocketUrl && rawSocketUrl !== 'undefined'
    ? normalizeBaseUrl(rawSocketUrl)
    : 'http://localhost:5000';
const isSocketDebugEnabled = process.env.NODE_ENV !== 'production' || process.env.NEXT_PUBLIC_API_DEBUG === 'true';

if (!SOCKET_URL && typeof window !== 'undefined') {
  console.error('[SOCKET] NEXT_PUBLIC_SOCKET_URL is not set. Socket.IO will not connect.');
}

let socket: Socket | null = null;
let reconnectCount = 0;
const MAX_RECONNECT_ATTEMPTS = 20;
const subscriptions = new Set<string>();

export function getSocket(): Socket {
  if (!socket) {
    if (isSocketDebugEnabled) {
      console.log('[SOCKET CONNECT]', { socketURL: SOCKET_URL });
    }

    socket = io(SOCKET_URL || undefined, {
      // websocket first for lower latency, polling fallback for restricted networks
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 15000,
      randomizationFactor: 0.5,
      timeout: 20000,
      // Disable auto-unix socket, force HTTP
      autoConnect: false,
    });

    socket.on('connect', () => {
      reconnectCount = 0;
      for (const id of subscriptions) {
        socket?.emit('subscribe:assignment', { assignmentId: id });
      }
    });

    socket.on('disconnect', (reason) => {
      if (reason === 'io server disconnect') {
        // Server initiated disconnect — reconnect manually
        socket?.connect();
      }
    });

    socket.on('reconnect_attempt', () => {
      reconnectCount++;
    });

    socket.on('reconnect_error', () => {
      if (reconnectCount >= MAX_RECONNECT_ATTEMPTS) {
        socket?.close();
      }
    });

    socket.on('connect_error', () => {
      const s = socket;
      if (s && reconnectCount >= 3 && s.io.opts.transports?.[0] !== 'polling') {
        s.io.opts.transports = ['polling', 'websocket'];
      }
    });

    socket.connect();
  }
  return socket;
}

export function subscribeToAssignment(assignmentId: string): void {
  subscriptions.add(assignmentId);
  const s = getSocket();
  if (s.connected) {
    s.emit('subscribe:assignment', { assignmentId });
  }
}

export function unsubscribeFromAssignment(assignmentId: string): void {
  subscriptions.delete(assignmentId);
  const s = getSocket();
  if (s.connected) {
    s.emit('unsubscribe:assignment', { assignmentId });
  }
}

export function disconnectSocket(): void {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket.close();
    socket = null;
    reconnectCount = 0;
    subscriptions.clear();
  }
}
