import { Injectable, NotFoundException } from '@nestjs/common';
import { Layout, LayoutType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateLayoutDto } from './dto/create-layout.dto';
import { UpdateLayoutDto } from './dto/update-layout.dto';
import {
  PaginationDto,
  PaginatedResult,
} from '../../common/dto/pagination.dto';

@Injectable()
export class LayoutsService {
  constructor(private prisma: PrismaService) {}

  async findAll(paginationDto: PaginationDto): Promise<PaginatedResult<Layout>> {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const [layouts, total] = await Promise.all([
      this.prisma.layout.findMany({
        skip,
        take: limit,
        include: {
          _count: { select: { clients: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.layout.count(),
    ]);

    return {
      data: layouts,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string): Promise<Layout> {
    const layout = await this.prisma.layout.findUnique({
      where: { id },
      include: {
        clients: { select: { id: true, name: true } },
      },
    });

    if (!layout) {
      throw new NotFoundException(`Layout with ID ${id} not found`);
    }

    return layout;
  }

  async create(createLayoutDto: CreateLayoutDto): Promise<Layout> {
    const { name, type, config } = createLayoutDto;

    return this.prisma.layout.create({
      data: {
        name,
        type: type || LayoutType.FULLSCREEN,
        config: config || JSON.stringify({ backgroundColor: '#000000' }),
      },
    });
  }

  async update(id: string, updateLayoutDto: UpdateLayoutDto): Promise<Layout> {
    await this.findOne(id);

    return this.prisma.layout.update({
      where: { id },
      data: updateLayoutDto,
    });
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.prisma.layout.delete({ where: { id } });
  }
}
