import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateSequenceDto {
  @ApiProperty({ example: 'Welcome Sequence' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'Default welcome video sequence' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    example: '["video-id-1","video-id-2","video-id-3"]',
    description: 'JSON array of video IDs in playback order',
  })
  @IsNotEmpty()
  @IsString()
  videoIds: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ example: '2024-01-01T00:00:00Z' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ example: '2024-12-31T23:59:59Z' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ example: '{"start":"09:00","end":"18:00"}' })
  @IsOptional()
  @IsString()
  activeHours?: string;
}

export class AssignSequenceDto {
  @ApiProperty({ example: ['client-id-1', 'client-id-2'] })
  @IsNotEmpty()
  clientIds: string[];
}
