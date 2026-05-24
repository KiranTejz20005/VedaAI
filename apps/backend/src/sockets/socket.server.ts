import { Server as SocketIOServer } from 'socket.io';
import type { Server as HTTPServer } from 'http';
import type { ServerToClientEvents, ClientToServerEvents } from '../types/socket.types';
import { env } from '../config/env';
import { logger } from '../utils/logger';

let io: SocketIOServer<ClientToServerEvents, ServerToClientEvents> | null = null;
const ASSIGNMENT_ID_RE = /^[a-f\d]{24}$/i;
const SUBSCRIBE_WINDOW_MS = 10_000;
const MAX_SUBSCRIBES_PER_WINDOW = 30;
const MAX_ROOMS_PER_SOCKET = 50;

function isValidAssignmentId(value: unknown): value is string {
  return typeof value === 'string' && ASSIGNMENT_ID_RE.test(value.trim());
}

function parseOrigins(raw: string): string[] {
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

export function initializeSocketServer(
  httpServer: HTTPServer
): SocketIOServer<ClientToServerEvents, ServerToClientEvents> {
  if (io) {
    logger.warn('Socket.IO already initialized — returning existing instance');
    return io;
  }

  const corsOrigins = env.SOCKET_CORS_ORIGIN
    ? parseOrigins(env.SOCKET_CORS_ORIGIN)
    : parseOrigins(env.FRONTEND_URL);

  io = new SocketIOServer<ClientToServerEvents, ServerToClientEvents>(httpServer, {
    cors: {
      origin: corsOrigins,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    // Production-safe settings:
    // websocket first for lower latency, polling fallback for restricted networks
    transports: ['websocket', 'polling'],
    pingTimeout: 30000,
    pingInterval: 12000,
    maxHttpBufferSize: 1e6,
    // Allow upgrades from polling to websocket
    allowUpgrades: true,
    // Cookie settings for sticky sessions
    cookie: {
      name: 'vedaai-socket',
      httpOnly: true,
      sameSite: 'lax',
    },
  });

  io.on('connection', (socket) => {
    logger.debug(`Socket connected: ${socket.id} (transport: ${socket.conn.transport.name})`);
    let subscribeCount = 0;
    let windowStart = Date.now();

    const canSubscribe = (): boolean => {
      const now = Date.now();
      if (now - windowStart > SUBSCRIBE_WINDOW_MS) {
        windowStart = now;
        subscribeCount = 0;
      }
      subscribeCount += 1;
      return subscribeCount <= MAX_SUBSCRIBES_PER_WINDOW;
    };

    socket.on('subscribe:assignment', ({ assignmentId }) => {
      if (!canSubscribe()) {
        logger.warn(`Socket ${socket.id} exceeded subscribe rate limit and was disconnected`);
        socket.disconnect(true);
        return;
      }
      if (!isValidAssignmentId(assignmentId)) {
        logger.warn(`Socket ${socket.id} attempted invalid assignment subscription: ${String(assignmentId)}`);
        return;
      }
      if (socket.rooms.size > MAX_ROOMS_PER_SOCKET) {
        logger.warn(`Socket ${socket.id} exceeded room cap and was disconnected`);
        socket.disconnect(true);
        return;
      }
      const normalized = assignmentId.trim();
      socket.join(`assignment:${normalized}`);
      logger.debug(`Socket ${socket.id} subscribed to assignment:${normalized}`);
    });

    socket.on('unsubscribe:assignment', ({ assignmentId }) => {
      if (!isValidAssignmentId(assignmentId)) return;
      const normalized = assignmentId.trim();
      socket.leave(`assignment:${normalized}`);
      logger.debug(`Socket ${socket.id} unsubscribed from assignment:${normalized}`);
    });

    socket.on('disconnect', (reason) => {
      logger.debug(`Socket disconnected: ${socket.id} (${reason})`);
    });
  });

  return io;
}

export function getSocketServer(): SocketIOServer<ClientToServerEvents, ServerToClientEvents> {
  if (!io) throw new Error('Socket server not initialized');
  return io;
}

export function emitToAssignment(
  assignmentId: string,
  event: keyof ServerToClientEvents,
  payload: any
): void {
  if (!io) return;
  io.to(`assignment:${assignmentId}`).emit(event, payload);
}
