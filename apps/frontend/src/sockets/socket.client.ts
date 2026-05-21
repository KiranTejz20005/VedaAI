import { io, type Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL ?? 'http://localhost:5000';

let socket: Socket | null = null;
let reconnectCount = 0;
const MAX_RECONNECT_ATTEMPTS = 10;
const subscriptions = new Set<string>();

export function getSocket(): Socket {
  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ['polling', 'websocket'],
      reconnection: true,
      reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 10000,
      randomizationFactor: 0.5,
      timeout: 15000,
    });

    socket.on('connect', () => {
      reconnectCount = 0;
      // Re-subscribe ALL active subscriptions on every connect/reconnect
      // Socket.IO generates a new session on reconnect, losing all rooms
      for (const id of subscriptions) {
        socket?.emit('subscribe:assignment', { assignmentId: id });
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
