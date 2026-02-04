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
import { LayoutsService } from './layouts.service';
import { CreateLayoutDto } from './dto/create-layout.dto';
import { UpdateLayoutDto } from './dto/update-layout.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { PaginationDto } from '../../common/dto/pagination.dto';

@ApiTags('Admin - Layouts')
@ApiBearerAuth()
@Controller('admin/layouts')
@Roles(Role.ADMIN)
export class LayoutsController {
  constructor(private readonly layoutsService: LayoutsService) {}

  @Get()
  @ApiOperation({ summary: 'List all layouts' })
  @ApiResponse({ status: 200, description: 'List of layouts' })
  findAll(@Query() paginationDto: PaginationDto) {
    return this.layoutsService.findAll(paginationDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get layout by ID' })
  @ApiResponse({ status: 200, description: 'Layout details' })
  @ApiResponse({ status: 404, description: 'Layout not found' })
  findOne(@Param('id') id: string) {
    return this.layoutsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create new layout' })
  @ApiResponse({ status: 201, description: 'Layout created' })
  create(@Body() createLayoutDto: CreateLayoutDto) {
    return this.layoutsService.create(createLayoutDto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update layout' })
  @ApiResponse({ status: 200, description: 'Layout updated' })
  @ApiResponse({ status: 404, description: 'Layout not found' })
  update(@Param('id') id: string, @Body() updateLayoutDto: UpdateLayoutDto) {
    return this.layoutsService.update(id, updateLayoutDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete layout' })
  @ApiResponse({ status: 204, description: 'Layout deleted' })
  @ApiResponse({ status: 404, description: 'Layout not found' })
  remove(@Param('id') id: string) {
    return this.layoutsService.remove(id);
  }
}
