import { Server as SocketIOServer } from 'socket.io';
import type { Server as HTTPServer } from 'http';
import type { ServerToClientEvents, ClientToServerEvents } from '../types/socket.types';
import { env } from '../config/env';
import { logger } from '../utils/logger';

let io: SocketIOServer<ClientToServerEvents, ServerToClientEvents> | null = null;

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

    socket.on('subscribe:assignment', ({ assignmentId }) => {
      if (assignmentId && typeof assignmentId === 'string') {
        socket.join(`assignment:${assignmentId}`);
        logger.debug(`Socket ${socket.id} subscribed to assignment:${assignmentId}`);
      }
    });

    socket.on('unsubscribe:assignment', ({ assignmentId }) => {
      if (assignmentId && typeof assignmentId === 'string') {
        socket.leave(`assignment:${assignmentId}`);
        logger.debug(`Socket ${socket.id} unsubscribed from assignment:${assignmentId}`);
      }
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
