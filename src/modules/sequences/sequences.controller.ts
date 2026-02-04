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
import { SequencesService } from './sequences.service';
import { CreateSequenceDto, AssignSequenceDto } from './dto/create-sequence.dto';
import { UpdateSequenceDto } from './dto/update-sequence.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { PaginationDto } from '../../common/dto/pagination.dto';

@ApiTags('Admin - Sequences')
@ApiBearerAuth()
@Controller('admin/sequences')
@Roles(Role.ADMIN)
export class SequencesController {
  constructor(private readonly sequencesService: SequencesService) {}

  @Get()
  @ApiOperation({ summary: 'List all sequences' })
  @ApiResponse({ status: 200, description: 'List of sequences' })
  findAll(@Query() paginationDto: PaginationDto) {
    return this.sequencesService.findAll(paginationDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get sequence by ID with flow data' })
  @ApiResponse({ status: 200, description: 'Sequence details' })
  @ApiResponse({ status: 404, description: 'Sequence not found' })
  findOne(@Param('id') id: string) {
    return this.sequencesService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create new sequence' })
  @ApiResponse({ status: 201, description: 'Sequence created' })
  create(@Body() createSequenceDto: CreateSequenceDto) {
    return this.sequencesService.create(createSequenceDto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update sequence' })
  @ApiResponse({ status: 200, description: 'Sequence updated' })
  @ApiResponse({ status: 404, description: 'Sequence not found' })
  update(@Param('id') id: string, @Body() updateSequenceDto: UpdateSequenceDto) {
    return this.sequencesService.update(id, updateSequenceDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete sequence' })
  @ApiResponse({ status: 204, description: 'Sequence deleted' })
  @ApiResponse({ status: 404, description: 'Sequence not found' })
  remove(@Param('id') id: string) {
    return this.sequencesService.remove(id);
  }

  @Post(':id/assign')
  @ApiOperation({ summary: 'Assign sequence to clients' })
  @ApiResponse({ status: 200, description: 'Sequence assigned to clients' })
  @ApiResponse({ status: 404, description: 'Sequence not found' })
  assign(@Param('id') id: string, @Body() assignDto: AssignSequenceDto) {
    return this.sequencesService.assignToClients(id, assignDto.clientIds);
  }
}
