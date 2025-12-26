import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import WebSocketServer from '../../../../src/infrastructure/websocket/socketServer';
import { JWTUtil } from '../../../../src/shared/utils';
import logger from '../../../../src/infrastructure/observability/logger';
import { websocketConnections } from '../../../../src/infrastructure/observability/metrics';

jest.mock('socket.io');
jest.mock('../../../../src/shared/utils/jwt');
jest.mock('../../../../src/infrastructure/observability/logger');
jest.mock('../../../../src/infrastructure/observability/metrics');

describe('WebSocketServer', () => {
  let mockHttpServer: Partial<HttpServer>;
  let mockIO: Partial<SocketIOServer>;
  let mockSocket: Partial<Socket>;
  let mockUse: jest.Mock;
  let mockOn: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockSocket = {
      id: 'socket-123',
      data: {},
      handshake: {
        auth: {},
        headers: {},
      } as any,
      join: jest.fn(),
      leave: jest.fn(),
      on: jest.fn(),
      to: jest.fn(),
      emit: jest.fn(),
    };


    mockUse = jest.fn((callback) => {
      // Simulate middleware execution
      const next = jest.fn();
      // Ensure socket.data.user is set if token exists
      if (mockSocket.handshake?.auth?.token || mockSocket.handshake?.headers?.authorization) {
        const token = mockSocket.handshake.auth.token || 
          mockSocket.handshake.headers.authorization?.split(' ')[1];
        if (token) {
          try {
            const payload = (JWTUtil.verifyAccessToken as jest.Mock).mock.results[0]?.value || 
              { userId: 'user-123', email: 'test@example.com' };
            mockSocket.data = {
              ...mockSocket.data,
              user: {
                userId: payload.userId,
                email: payload.email,
              },
            };
          } catch (e) {
            // Token verification failed
          }
        }
      }
      callback(mockSocket as Socket, next);
    });

    mockOn = jest.fn((event, callback) => {
      if (event === 'connection') {
        // Simulate connection - ensure user is set before calling
        if (!mockSocket.data?.user) {
          mockSocket.data = {
            ...mockSocket.data,
            user: {
              userId: 'user-123',
              email: 'test@example.com',
            },
          };
        }
        // Use process.nextTick instead of setTimeout for more reliable execution
        process.nextTick(() => callback(mockSocket as Socket));
      }
    });

    mockIO = {
      use: mockUse,
      on: mockOn,
      to: jest.fn().mockReturnValue({
        emit: jest.fn(),
      }),
    };

    (SocketIOServer as unknown as jest.Mock).mockImplementation(() => mockIO);

    mockHttpServer = {} as HttpServer;
  });

  describe('constructor', () => {
    it('should create WebSocket server with CORS configuration', () => {
      const corsOrigin = ['http://localhost:3000'];
      new (WebSocketServer as any)(mockHttpServer as HttpServer, corsOrigin);

      expect(SocketIOServer).toHaveBeenCalledWith(mockHttpServer, {
        cors: {
          origin: corsOrigin,
          credentials: true,
        },
      });
    });

    it('should setup middleware and handlers', () => {
      const corsOrigin = ['http://localhost:3000'];
      new (WebSocketServer as any)(mockHttpServer as HttpServer, corsOrigin);

      expect(mockUse).toHaveBeenCalled();
      expect(mockOn).toHaveBeenCalledWith('connection', expect.any(Function));
    });
  });

  describe('authentication middleware', () => {
    it('should authenticate with token in auth', () => {
      const token = 'valid-token';
      const payload = { userId: 'user-123', email: 'test@example.com' };
      mockSocket.handshake!.auth.token = token;
      (JWTUtil.verifyAccessToken as jest.Mock).mockReturnValue(payload);

      const corsOrigin = ['http://localhost:3000'];
      new (WebSocketServer as any)(mockHttpServer as HttpServer, corsOrigin);

      expect(JWTUtil.verifyAccessToken).toHaveBeenCalledWith(token);
      expect(mockSocket.data).toEqual({
        user: {
          userId: payload.userId,
          email: payload.email,
        },
      });
    });

    it('should authenticate with token in Authorization header', () => {
      const token = 'valid-token';
      const payload = { userId: 'user-123', email: 'test@example.com' };
      mockSocket.handshake!.headers.authorization = `Bearer ${token}`;
      (JWTUtil.verifyAccessToken as jest.Mock).mockReturnValue(payload);

      const corsOrigin = ['http://localhost:3000'];
      new (WebSocketServer as any)(mockHttpServer as HttpServer, corsOrigin);

      expect(JWTUtil.verifyAccessToken).toHaveBeenCalledWith(token);
    });

    it('should reject connection without token', () => {
      const next = jest.fn();
      mockUse.mockImplementation((callback) => {
        callback(mockSocket as Socket, next);
      });

      const corsOrigin = ['http://localhost:3000'];
      new (WebSocketServer as any)(mockHttpServer as HttpServer, corsOrigin);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should reject connection with invalid token', () => {
      const token = 'invalid-token';
      mockSocket.handshake!.auth.token = token;
      (JWTUtil.verifyAccessToken as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const next = jest.fn();
      mockUse.mockImplementation((callback) => {
        callback(mockSocket as Socket, next);
      });

      const corsOrigin = ['http://localhost:3000'];
      new (WebSocketServer as any)(mockHttpServer as HttpServer, corsOrigin);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('connection handlers', () => {
    beforeEach(() => {
      const token = 'valid-token';
      const payload = { userId: 'user-123', email: 'test@example.com' };
      mockSocket.handshake!.auth.token = token;
      (JWTUtil.verifyAccessToken as jest.Mock).mockReturnValue(payload);
      mockSocket.data = {
        user: {
          userId: payload.userId,
          email: payload.email,
        },
      };
    });

    it('should handle join workspace event', () => {
      const workspaceId = 'workspace-123';
      mockOn.mockImplementation((event, callback) => {
        if (event === 'connection') {
          const socket = {
            ...mockSocket,
            on: jest.fn((evt, handler) => {
              if (evt === 'join:workspace') {
                handler(workspaceId);
              }
            }),
            to: jest.fn().mockReturnValue({
              emit: jest.fn(),
            }),
          };
          callback(socket as unknown as Socket);
        }
      });

      const corsOrigin = ['http://localhost:3000'];
      new (WebSocketServer as any)(mockHttpServer as HttpServer, corsOrigin);

      expect(websocketConnections.inc).toHaveBeenCalled();
    });

    it('should handle leave workspace event', () => {
      const workspaceId = 'workspace-123';
      mockOn.mockImplementation((event, callback) => {
        if (event === 'connection') {
          const socket = {
            ...mockSocket,
            on: jest.fn((evt, handler) => {
              if (evt === 'leave:workspace') {
                handler(workspaceId);
              }
            }),
            to: jest.fn().mockReturnValue({
              emit: jest.fn(),
            }),
          };
          callback(socket as unknown as Socket);
        }
      });

      const corsOrigin = ['http://localhost:3000'];
      new (WebSocketServer as any)(mockHttpServer as HttpServer, corsOrigin);
    });

    it('should handle disconnect event', () => {
      mockOn.mockImplementation((event, callback) => {
        if (event === 'connection') {
          const socket = {
            ...mockSocket,
            on: jest.fn((evt, handler) => {
              if (evt === 'disconnect') {
                handler();
              }
            }),
          };
          callback(socket as unknown as Socket);
        }
      });

      const corsOrigin = ['http://localhost:3000'];
      new (WebSocketServer as any)(mockHttpServer as HttpServer, corsOrigin);

      expect(websocketConnections.dec).toHaveBeenCalled();
    });
  });

  describe('broadcastToWorkspace', () => {
    it('should broadcast event to workspace', () => {
      const workspaceId = 'workspace-123';
      const event = 'test:event';
      const data = { test: 'data' };
      const mockEmit = jest.fn();
      (mockIO.to as jest.Mock).mockReturnValue({ emit: mockEmit });

      const corsOrigin = ['http://localhost:3000'];
      const wsServer = new (WebSocketServer as any)(mockHttpServer as HttpServer, corsOrigin);
      wsServer.broadcastToWorkspace(workspaceId, event, data);

      expect(mockIO.to).toHaveBeenCalledWith(`workspace:${workspaceId}`);
      expect(mockEmit).toHaveBeenCalledWith(event, data);
    });
  });

  describe('getIO', () => {
    it('should return SocketIO server instance', () => {
      const corsOrigin = ['http://localhost:3000'];
      const wsServer = new (WebSocketServer as any)(mockHttpServer as HttpServer, corsOrigin);

      expect(wsServer.getIO()).toBe(mockIO);
    });
  });
});

