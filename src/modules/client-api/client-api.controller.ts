import { Controller, Get, Post, Body } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { ClientApiService, ClientConfig } from './client-api.service';
import { HeartbeatDto, LogActivityDto } from './dto/heartbeat.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';

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

@ApiTags('Client API')
@ApiBearerAuth()
@Controller('client')
@Roles(Role.CLIENT)
export class ClientApiController {
  constructor(private readonly clientApiService: ClientApiService) {}

  @Get('config')
  @ApiOperation({ summary: 'Get current client configuration' })
  @ApiResponse({ status: 200, description: 'Client configuration' })
  @ApiResponse({ status: 404, description: 'Client not found' })
  getConfig(@CurrentUser() user: RequestUser): Promise<ClientConfig> {
    return this.clientApiService.getConfig(user);
  }

  @Get('sequence')
  @ApiOperation({ summary: 'Get assigned sequence' })
  @ApiResponse({ status: 200, description: 'Assigned sequence with flow data' })
  @ApiResponse({ status: 404, description: 'Client not found' })
  getSequence(@CurrentUser() user: RequestUser) {
    return this.clientApiService.getSequence(user);
  }

  @Post('heartbeat')
  @ApiOperation({ summary: 'Send heartbeat/status update' })
  @ApiResponse({ status: 200, description: 'Heartbeat received' })
  heartbeat(@CurrentUser() user: RequestUser, @Body() heartbeatDto: HeartbeatDto) {
    return this.clientApiService.heartbeat(user, heartbeatDto);
  }

  @Post('log')
  @ApiOperation({ summary: 'Log playback activity' })
  @ApiResponse({ status: 200, description: 'Activity logged' })
  logActivity(@CurrentUser() user: RequestUser, @Body() logDto: LogActivityDto) {
    return this.clientApiService.logActivity(user, logDto);
  }
}
