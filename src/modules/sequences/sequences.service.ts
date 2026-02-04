import { Injectable, NotFoundException } from '@nestjs/common';
import { Sequence } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSequenceDto } from './dto/create-sequence.dto';
import { UpdateSequenceDto } from './dto/update-sequence.dto';
import {
  PaginationDto,
  PaginatedResult,
} from '../../common/dto/pagination.dto';
import { ClientGateway } from '../gateway/client.gateway';

@Injectable()
export class SequencesService {
  constructor(
    private prisma: PrismaService,
    private clientGateway: ClientGateway,
  ) {}

  async findAll(
    paginationDto: PaginationDto,
  ): Promise<PaginatedResult<Sequence>> {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const [sequences, total] = await Promise.all([
      this.prisma.sequence.findMany({
        skip,
        take: limit,
        include: {
          _count: { select: { clients: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.sequence.count(),
    ]);

    return {
      data: sequences,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string): Promise<Sequence & { clients: { id: string; name: string }[]; videos?: any[] }> {
    const sequence = await this.prisma.sequence.findUnique({
      where: { id },
      include: {
        clients: { select: { id: true, name: true } },
      },
    });

    if (!sequence) {
      throw new NotFoundException(`Sequence with ID ${id} not found`);
    }

    // Populate videos from videoIds array
    const videoIds = JSON.parse(sequence.videoIds);
    const videos = await this.prisma.video.findMany({
      where: { id: { in: videoIds } },
    });

    // Return with ordered videos
    return {
      ...sequence,
      videos: videoIds.map(id => videos.find(v => v.id === id)).filter(Boolean),
    };
  }

  async create(createSequenceDto: CreateSequenceDto): Promise<Sequence> {
    const {
      name,
      description,
      videoIds,
      isActive,
      startDate,
      endDate,
      activeHours,
    } = createSequenceDto;

    // Validate that all video IDs exist
    const ids = JSON.parse(videoIds);
    const videos = await this.prisma.video.findMany({
      where: { id: { in: ids } },
    });

    if (videos.length !== ids.length) {
      throw new NotFoundException('One or more video IDs not found');
    }

    return this.prisma.sequence.create({
      data: {
        name,
        description,
        videoIds,
        isActive: isActive ?? true,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        activeHours,
      },
    });
  }

  async update(id: string, updateSequenceDto: UpdateSequenceDto): Promise<Sequence> {
    const existingSequence = await this.findOne(id);

    const { startDate, endDate, videoIds, ...rest } = updateSequenceDto;

    // Validate video IDs if provided
    if (videoIds) {
      const ids = JSON.parse(videoIds);
      const videos = await this.prisma.video.findMany({
        where: { id: { in: ids } },
      });

      if (videos.length !== ids.length) {
        throw new NotFoundException('One or more video IDs not found');
      }
    }

    const updatedSequence = await this.prisma.sequence.update({
      where: { id },
      data: {
        ...rest,
        videoIds,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
      },
    });

    // Notify all clients using this sequence
    const affectedClientIds = existingSequence.clients.map(c => c.id);
    affectedClientIds.forEach(clientId => {
      this.clientGateway.sendSequenceUpdate(clientId, updatedSequence);
    });

    return updatedSequence;
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.prisma.sequence.delete({ where: { id } });
  }

  async assignToClients(id: string, clientIds: string[]): Promise<Sequence> {
    const sequence = await this.findOne(id);

    // Update all specified clients to use this sequence
    await this.prisma.client.updateMany({
      where: { id: { in: clientIds } },
      data: { sequenceId: id },
    });

    // Notify all affected clients about the sequence update
    clientIds.forEach(clientId => {
      this.clientGateway.sendSequenceUpdate(clientId, sequence);
    });

    return this.prisma.sequence.findUnique({
      where: { id },
      include: {
        clients: { select: { id: true, name: true } },
      },
    }) as Promise<Sequence>;
  }

  async unassignFromClients(id: string, clientIds: string[]): Promise<void> {
    await this.prisma.client.updateMany({
      where: {
        id: { in: clientIds },
        sequenceId: id,
      },
      data: { sequenceId: null },
    });
  }
}
