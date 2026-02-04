import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { Client, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import {
  PaginationDto,
  PaginatedResult,
} from '../../common/dto/pagination.dto';
import { ClientGateway } from '../gateway/client.gateway';

type ClientWithUser = Client & {
  user: { loginId: string | null; name: string | null };
};

@Injectable()
export class ClientsService {
  constructor(
    private prisma: PrismaService,
    private clientGateway: ClientGateway,
  ) {}

  async findAll(
    paginationDto: PaginationDto,
  ): Promise<PaginatedResult<ClientWithUser>> {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const [clients, total] = await Promise.all([
      this.prisma.client.findMany({
        skip,
        take: limit,
        include: {
          user: { select: { loginId: true, name: true } },
          layout: true,
          sequence: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.client.count(),
    ]);

    return {
      data: clients,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string): Promise<ClientWithUser> {
    const client = await this.prisma.client.findUnique({
      where: { id },
      include: {
        user: { select: { loginId: true, name: true } },
        layout: true,
        sequence: true,
      },
    });

    if (!client) {
      throw new NotFoundException(`Client with ID ${id} not found`);
    }

    return client;
  }

  async findByUserId(userId: string): Promise<Client | null> {
    return this.prisma.client.findUnique({
      where: { userId },
      include: {
        layout: true,
        sequence: true,
      },
    });
  }

  async create(createClientDto: CreateClientDto): Promise<ClientWithUser> {
    const { loginId, password, name, description, location, layoutId, sequenceId } =
      createClientDto;

    // Check if loginId already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { loginId },
    });

    if (existingUser) {
      throw new ConflictException(`Login ID ${loginId} already exists`);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user and client in a transaction
    const client = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          loginId,
          password: hashedPassword,
          role: Role.CLIENT,
          name,
        },
      });

      return tx.client.create({
        data: {
          name,
          description,
          location,
          userId: user.id,
          layoutId,
          sequenceId,
        },
        include: {
          user: { select: { loginId: true, name: true } },
          layout: true,
          sequence: true,
        },
      });
    });

    return client;
  }

  async update(
    id: string,
    updateClientDto: UpdateClientDto,
  ): Promise<ClientWithUser> {
    const client = await this.findOne(id);
    const { password, name, description, location, layoutId, sequenceId } =
      updateClientDto;

    // Update user password if provided
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      await this.prisma.user.update({
        where: { id: client.userId },
        data: { password: hashedPassword, name },
      });
    } else if (name) {
      await this.prisma.user.update({
        where: { id: client.userId },
        data: { name },
      });
    }

    const updatedClient = await this.prisma.client.update({
      where: { id },
      data: {
        name,
        description,
        location,
        layoutId,
        sequenceId,
      },
      include: {
        user: { select: { loginId: true, name: true } },
        layout: true,
        sequence: true,
      },
    });

    // Notify client if sequence or layout changed
    if (sequenceId !== undefined && sequenceId !== client.sequenceId) {
      this.clientGateway.sendSequenceUpdate(id, updatedClient.sequence);
    }
    if (layoutId !== undefined && layoutId !== client.layoutId) {
      this.clientGateway.sendConfigUpdate(id, updatedClient);
    }

    return updatedClient;
  }

  async remove(id: string): Promise<void> {
    const client = await this.findOne(id);

    await this.prisma.$transaction(async (tx) => {
      await tx.client.delete({ where: { id } });
      await tx.user.delete({ where: { id: client.userId } });
    });
  }

  async updateOnlineStatus(
    id: string,
    isOnline: boolean,
  ): Promise<Client> {
    return this.prisma.client.update({
      where: { id },
      data: {
        isOnline,
        lastSeen: isOnline ? new Date() : undefined,
      },
    });
  }

  async forceRefresh(id: string): Promise<void> {
    await this.findOne(id); // Verify client exists
    this.clientGateway.sendForceRefresh(id);
  }

  async sendConfigUpdate(id: string): Promise<void> {
    const client = await this.findOne(id);
    this.clientGateway.sendConfigUpdate(id, client);
  }
}
