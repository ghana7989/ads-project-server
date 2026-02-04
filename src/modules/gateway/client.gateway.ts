import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  clientId?: string;
}

interface JwtPayload {
  sub: string;
  role: string;
}

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/',
})
export class ClientGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logger = new Logger('ClientGateway');
  private connectedClients = new Map<string, string>(); // clientId -> socketId

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {}

  async handleConnection(socket: AuthenticatedSocket): Promise<void> {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        this.logger.warn('Connection attempt without token');
        socket.disconnect();
        return;
      }

      const payload = this.jwtService.verify<JwtPayload>(token, {
        secret: this.configService.get<string>('jwt.secret'),
      });

      socket.userId = payload.sub;

      // If client role, get client ID and update status
      if (payload.role === 'CLIENT') {
        const client = await this.prisma.client.findUnique({
          where: { userId: payload.sub },
        });
        if (client) {
          socket.clientId = client.id;
          this.connectedClients.set(client.id, socket.id);
          await this.prisma.client.update({
            where: { id: client.id },
            data: { isOnline: true, lastSeen: new Date() },
          });
          socket.join(`client:${client.id}`);
          this.logger.log(`Client ${client.id} connected`);
        }
      }

      socket.join(`user:${payload.sub}`);
      this.logger.log(`Socket ${socket.id} authenticated for user ${payload.sub}`);
    } catch (error) {
      this.logger.error('Authentication failed', error);
      socket.disconnect();
    }
  }

  async handleDisconnect(socket: AuthenticatedSocket): Promise<void> {
    if (socket.clientId) {
      this.connectedClients.delete(socket.clientId);
      await this.prisma.client.update({
        where: { id: socket.clientId },
        data: { isOnline: false, lastSeen: new Date() },
      });
      this.logger.log(`Client ${socket.clientId} disconnected`);
    }
    this.logger.log(`Socket ${socket.id} disconnected`);
  }

  @SubscribeMessage('client:status')
  handleStatus(
    @ConnectedSocket() socket: AuthenticatedSocket,
    @MessageBody() data: { status: string; currentVideoId?: string },
  ): void {
    this.logger.debug(`Client ${socket.clientId} status: ${data.status}`);
    // Broadcast to admin dashboard
    this.server.emit('admin:client-status', {
      clientId: socket.clientId,
      ...data,
    });
  }

  @SubscribeMessage('client:playback-status')
  handlePlaybackStatus(
    @ConnectedSocket() socket: AuthenticatedSocket,
    @MessageBody() data: { videoId: string; position: number; duration: number },
  ): void {
    this.server.emit('admin:playback-status', {
      clientId: socket.clientId,
      ...data,
    });
  }

  @SubscribeMessage('client:error')
  handleError(
    @ConnectedSocket() socket: AuthenticatedSocket,
    @MessageBody() data: { error: string; details?: unknown },
  ): void {
    this.logger.error(`Client ${socket.clientId} error: ${data.error}`);
    this.server.emit('admin:client-error', {
      clientId: socket.clientId,
      ...data,
    });
  }

  // Methods for sending commands to clients
  sendConfigUpdate(clientId: string, config: unknown): void {
    const socketId = this.connectedClients.get(clientId);
    if (socketId) {
      this.server.to(socketId).emit('client:config-update', config);
    }
  }

  sendSequenceUpdate(clientId: string, sequence: unknown): void {
    const socketId = this.connectedClients.get(clientId);
    if (socketId) {
      this.server.to(socketId).emit('client:sequence-update', sequence);
    }
  }

  sendForceRefresh(clientId: string): void {
    const socketId = this.connectedClients.get(clientId);
    if (socketId) {
      this.server.to(socketId).emit('client:force-refresh');
    }
  }

  sendCommand(clientId: string, command: string, data?: unknown): void {
    const socketId = this.connectedClients.get(clientId);
    if (socketId) {
      this.server.to(socketId).emit('client:command', { command, data });
    }
  }

  broadcastToAllClients(event: string, data: unknown): void {
    this.connectedClients.forEach((socketId) => {
      this.server.to(socketId).emit(event, data);
    });
  }

  isClientOnline(clientId: string): boolean {
    return this.connectedClients.has(clientId);
  }

  getOnlineClients(): string[] {
    return Array.from(this.connectedClients.keys());
  }
}
