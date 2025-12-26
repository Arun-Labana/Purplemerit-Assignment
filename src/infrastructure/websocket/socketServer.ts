import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { JWTUtil } from '../../../shared/utils';
import logger from '../../observability/logger';
import { websocketConnections } from '../../observability/metrics';

export class WebSocketServer {
  private io: SocketIOServer;

  constructor(httpServer: HttpServer, corsOrigin: string[]) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: corsOrigin,
        credentials: true,
      },
    });

    this.setupMiddleware();
    this.setupHandlers();
  }

  private setupMiddleware(): void {
    // Authentication middleware
    this.io.use((socket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];

        if (!token) {
          return next(new Error('Authentication token missing'));
        }

        const payload = JWTUtil.verifyAccessToken(token);
        socket.data.user = {
          userId: payload.userId,
          email: payload.email,
        };

        next();
      } catch (error) {
        logger.error('WebSocket authentication error', error);
        next(new Error('Authentication failed'));
      }
    });
  }

  private setupHandlers(): void {
    this.io.on('connection', (socket: Socket) => {
      logger.info('WebSocket client connected', {
        socketId: socket.id,
        userId: socket.data.user.userId,
      });

      websocketConnections.inc();

      // Handle join workspace
      socket.on('join:workspace', (workspaceId: string) => {
        socket.join(`workspace:${workspaceId}`);
        
        // Broadcast user joined to others in the workspace
        socket.to(`workspace:${workspaceId}`).emit('user:joined', {
          userId: socket.data.user.userId,
          userName: socket.data.user.email,
          workspaceId,
        });

        logger.info('User joined workspace', {
          userId: socket.data.user.userId,
          workspaceId,
        });
      });

      // Handle leave workspace
      socket.on('leave:workspace', (workspaceId: string) => {
        socket.leave(`workspace:${workspaceId}`);
        
        // Broadcast user left
        socket.to(`workspace:${workspaceId}`).emit('user:left', {
          userId: socket.data.user.userId,
          workspaceId,
        });

        logger.info('User left workspace', {
          userId: socket.data.user.userId,
          workspaceId,
        });
      });

      // Handle file changes
      socket.on('file:change', (data: any) => {
        const { workspaceId, fileId, fileName, changes } = data;

        socket.to(`workspace:${workspaceId}`).emit('file:changed', {
          fileId,
          fileName,
          changes,
          userId: socket.data.user.userId,
        });

        logger.debug('File change event broadcasted', {
          workspaceId,
          fileId,
          userId: socket.data.user.userId,
        });
      });

      // Handle cursor movements
      socket.on('cursor:move', (data: any) => {
        const { workspaceId, fileId, position } = data;

        socket.to(`workspace:${workspaceId}`).emit('cursor:moved', {
          userId: socket.data.user.userId,
          fileId,
          position,
        });
      });

      // Handle activity events
      socket.on('activity:create', (data: any) => {
        const { workspaceId, action, details } = data;

        socket.to(`workspace:${workspaceId}`).emit('activity:update', {
          userId: socket.data.user.userId,
          action,
          details,
          timestamp: new Date(),
        });
      });

      // Handle disconnect
      socket.on('disconnect', () => {
        websocketConnections.dec();

        logger.info('WebSocket client disconnected', {
          socketId: socket.id,
          userId: socket.data.user.userId,
        });
      });

      // Handle errors
      socket.on('error', (error) => {
        logger.error('WebSocket error', {
          socketId: socket.id,
          userId: socket.data.user.userId,
          error,
        });
      });
    });
  }

  public broadcastToWorkspace(workspaceId: string, event: string, data: any): void {
    this.io.to(`workspace:${workspaceId}`).emit(event, data);
  }

  public getIO(): SocketIOServer {
    return this.io;
  }
}

export default WebSocketServer;

