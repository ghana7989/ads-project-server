import { Injectable, NotFoundException } from '@nestjs/common';
import { Client, Sequence } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ClientsService } from '../clients/clients.service';
import { HeartbeatDto, LogActivityDto } from './dto/heartbeat.dto';

interface RequestUser {
  id: string;
  email: string | null;
  loginId: string | null;
  password: string;
  role: string;
  name: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ClientConfig {
  client: Client;
  sequence: Sequence | null;
}

@Injectable()
export class ClientApiService {
  constructor(
    private prisma: PrismaService,
    private clientsService: ClientsService,
  ) {}

  async getConfig(user: RequestUser): Promise<ClientConfig> {
    const client = await this.prisma.client.findUnique({
      where: { userId: user.id },
      include: {
        sequence: true,
      },
    });

    if (!client) {
      throw new NotFoundException('Client configuration not found');
    }

    return {
      client,
      sequence: client.sequence,
    };
  }

  async getSequence(user: RequestUser): Promise<any> {
    const client = await this.prisma.client.findUnique({
      where: { userId: user.id },
      include: {
        sequence: true,
      },
    });

    if (!client) {
      throw new NotFoundException('Client not found');
    }

    if (!client.sequence) {
      return null;
    }

    // Populate videos from videoIds array
    const videoIds = JSON.parse(client.sequence.videoIds);
    const videos = await this.prisma.video.findMany({
      where: { id: { in: videoIds } },
    });

    // Return sequence with ordered videos
    const sequenceWithVideos = {
      ...client.sequence,
      videos: videoIds.map(id => videos.find(v => v.id === id)).filter(Boolean),
    };

    // Log for debugging
    console.log(`Sequence for client ${client.id}:`, {
      id: sequenceWithVideos.id,
      name: sequenceWithVideos.name,
      videoCount: sequenceWithVideos.videos?.length || 0,
    });

    return sequenceWithVideos;
  }

  async heartbeat(user: RequestUser, heartbeatDto: HeartbeatDto): Promise<{ received: boolean }> {
    const client = await this.prisma.client.findUnique({
      where: { userId: user.id },
    });

    if (!client) {
      throw new NotFoundException('Client not found');
    }

    // Update client online status
    await this.clientsService.updateOnlineStatus(client.id, true);

    // Optionally log the heartbeat details
    if (heartbeatDto.status || heartbeatDto.currentVideoId) {
      await this.logActivity(user, {
        action: 'heartbeat',
        details: JSON.stringify(heartbeatDto),
      });
    }

    return { received: true };
  }

  async logActivity(user: RequestUser, logDto: LogActivityDto): Promise<{ logged: boolean }> {
    const client = await this.prisma.client.findUnique({
      where: { userId: user.id },
    });

    if (!client) {
      throw new NotFoundException('Client not found');
    }

    await this.prisma.activityLog.create({
      data: {
        clientId: client.id,
        action: logDto.action,
        details: logDto.details,
      },
    });

    return { logged: true };
  }
}
