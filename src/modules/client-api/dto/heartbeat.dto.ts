import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class HeartbeatDto {
  @ApiPropertyOptional({ example: 'playing' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ example: 'video-123' })
  @IsOptional()
  @IsString()
  currentVideoId?: string;

  @ApiPropertyOptional({ example: '120' })
  @IsOptional()
  @IsString()
  playbackPosition?: string;
}

export class LogActivityDto {
  @ApiProperty({ example: 'video_started' })
  @IsNotEmpty()
  @IsString()
  action: string;

  @ApiPropertyOptional({ example: '{"videoId":"video-123","timestamp":"2024-01-01T00:00:00Z"}' })
  @IsOptional()
  @IsString()
  details?: string;
}
