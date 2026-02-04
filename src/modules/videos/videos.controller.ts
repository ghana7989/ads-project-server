import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { VideosService } from './videos.service';
import { CreateVideoDto } from './dto/create-video.dto';
import { UpdateVideoDto } from './dto/update-video.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { PaginationDto } from '../../common/dto/pagination.dto';

@ApiTags('Admin - Videos')
@ApiBearerAuth()
@Controller('admin/videos')
@Roles(Role.ADMIN)
export class VideosController {
  constructor(private readonly videosService: VideosService) {}

  @Get()
  @ApiOperation({ summary: 'List all videos' })
  @ApiResponse({ status: 200, description: 'List of videos' })
  findAll(@Query() paginationDto: PaginationDto) {
    return this.videosService.findAll(paginationDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get video by ID' })
  @ApiResponse({ status: 200, description: 'Video details' })
  @ApiResponse({ status: 404, description: 'Video not found' })
  findOne(@Param('id') id: string) {
    return this.videosService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Add new video' })
  @ApiResponse({ status: 201, description: 'Video created' })
  create(@Body() createVideoDto: CreateVideoDto) {
    return this.videosService.create(createVideoDto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update video' })
  @ApiResponse({ status: 200, description: 'Video updated' })
  @ApiResponse({ status: 404, description: 'Video not found' })
  update(@Param('id') id: string, @Body() updateVideoDto: UpdateVideoDto) {
    return this.videosService.update(id, updateVideoDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete video' })
  @ApiResponse({ status: 204, description: 'Video deleted' })
  @ApiResponse({ status: 404, description: 'Video not found' })
  remove(@Param('id') id: string) {
    return this.videosService.remove(id);
  }
}
