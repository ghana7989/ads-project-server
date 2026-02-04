import { Injectable, NotFoundException } from '@nestjs/common';
import { Video, VideoSource } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateVideoDto } from './dto/create-video.dto';
import { UpdateVideoDto } from './dto/update-video.dto';
import {
  PaginationDto,
  PaginatedResult,
} from '../../common/dto/pagination.dto';

@Injectable()
export class VideosService {
  constructor(private prisma: PrismaService) {}

  async findAll(paginationDto: PaginationDto): Promise<PaginatedResult<Video>> {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const [videos, total] = await Promise.all([
      this.prisma.video.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.video.count(),
    ]);

    return {
      data: videos,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string): Promise<Video> {
    const video = await this.prisma.video.findUnique({
      where: { id },
    });

    if (!video) {
      throw new NotFoundException(`Video with ID ${id} not found`);
    }

    return video;
  }

  async create(createVideoDto: CreateVideoDto): Promise<Video> {
    const { url, title, duration, thumbnail, source } = createVideoDto;

    // Auto-detect source if not provided
    const detectedSource = source || this.detectVideoSource(url);

    return this.prisma.video.create({
      data: {
        url,
        title,
        duration,
        thumbnail: thumbnail || this.getThumbnailUrl(url, detectedSource),
        source: detectedSource,
      },
    });
  }

  async update(id: string, updateVideoDto: UpdateVideoDto): Promise<Video> {
    await this.findOne(id);

    const { url, source } = updateVideoDto;
    let finalSource = source;
    let thumbnail = updateVideoDto.thumbnail;

    if (url && !source) {
      finalSource = this.detectVideoSource(url);
    }

    if (url && !thumbnail && finalSource) {
      thumbnail = this.getThumbnailUrl(url, finalSource) || undefined;
    }

    return this.prisma.video.update({
      where: { id },
      data: {
        ...updateVideoDto,
        source: finalSource,
        thumbnail,
      },
    });
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.prisma.video.delete({ where: { id } });
  }

  private detectVideoSource(url: string): VideoSource {
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      return VideoSource.YOUTUBE;
    }
    if (url.includes('vimeo.com')) {
      return VideoSource.VIMEO;
    }
    if (url.includes('facebook.com')) {
      return VideoSource.FACEBOOK;
    }
    if (url.includes('soundcloud.com')) {
      return VideoSource.SOUNDCLOUD;
    }
    if (url.includes('streamable.com')) {
      return VideoSource.STREAMABLE;
    }
    if (url.includes('wistia.com')) {
      return VideoSource.WISTIA;
    }
    if (url.includes('twitch.tv')) {
      return VideoSource.TWITCH;
    }
    if (url.includes('dailymotion.com')) {
      return VideoSource.DAILYMOTION;
    }
    if (url.includes('mixcloud.com')) {
      return VideoSource.MIXCLOUD;
    }
    if (url.includes('vidyard.com')) {
      return VideoSource.VIDYARD;
    }
    if (url.includes('kaltura.com')) {
      return VideoSource.KALTURA;
    }
    return VideoSource.FILE;
  }

  private getThumbnailUrl(url: string, source: VideoSource): string | null {
    if (source === VideoSource.YOUTUBE) {
      const videoId = this.extractYouTubeVideoId(url);
      if (videoId) {
        return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
      }
    }
    return null;
  }

  private extractYouTubeVideoId(url: string): string | null {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }

    return null;
  }
}
