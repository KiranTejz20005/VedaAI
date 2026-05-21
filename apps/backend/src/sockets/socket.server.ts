import { Server as SocketIOServer } from 'socket.io';
import type { Server as HTTPServer } from 'http';
import type { ServerToClientEvents, ClientToServerEvents } from '../types/socket.types';
import { env } from '../config/env';
import { logger } from '../utils/logger';

let io: SocketIOServer<ClientToServerEvents, ServerToClientEvents> | null = null;

export function initializeSocketServer(
  httpServer: HTTPServer
): SocketIOServer<ClientToServerEvents, ServerToClientEvents> {
  if (io) {
    logger.warn('Socket.IO already initialized — returning existing instance');
    return io;
  }

  io = new SocketIOServer<ClientToServerEvents, ServerToClientEvents>(httpServer, {
    cors: {
      origin: env.FRONTEND_URL,
      methods: ['GET', 'POST'],
    },
    pingTimeout: 60000,
    pingInterval: 25000,
    transports: ['polling', 'websocket'],
    maxHttpBufferSize: 1e6,
  });

  io.on('connection', (socket) => {
    logger.debug(`Socket connected: ${socket.id}`);

    socket.on('subscribe:assignment', ({ assignmentId }) => {
      if (assignmentId && typeof assignmentId === 'string') {
        socket.join(`assignment:${assignmentId}`);
      }
    });

    socket.on('unsubscribe:assignment', ({ assignmentId }) => {
      if (assignmentId && typeof assignmentId === 'string') {
        socket.leave(`assignment:${assignmentId}`);
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload: any
): void {
  if (!io) return;
  io.to(`assignment:${assignmentId}`).emit(event, payload);
}
