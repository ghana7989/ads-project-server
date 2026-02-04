import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AppService } from './app.service';
import { Public } from './common/decorators/public.decorator';

@ApiTags('Health')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('ping')
  @Public()
  @ApiOperation({ summary: 'Ping endpoint to check service and database status' })
  @ApiResponse({ 
    status: 200, 
    description: 'Service status',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'ok' },
        timestamp: { type: 'string', example: '2026-02-04T12:00:00.000Z' },
        database: { type: 'string', example: 'connected' },
      },
    },
  })
  async ping(): Promise<{ status: string; timestamp: string; database: string }> {
    return this.appService.ping();
  }
}
