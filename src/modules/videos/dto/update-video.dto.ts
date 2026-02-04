import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsUrl, IsInt, Min } from 'class-validator';
import { VideoSource } from '@prisma/client';

export class UpdateVideoDto {
  @ApiPropertyOptional({ example: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' })
  @IsOptional()
  @IsUrl()
  url?: string;

  @ApiPropertyOptional({ example: 'Updated Video Title' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ example: 300 })
  @IsOptional()
  @IsInt()
  @Min(0)
  duration?: number;

  @ApiPropertyOptional({ example: 'https://img.youtube.com/vi/dQw4w9WgXcQ/0.jpg' })
  @IsOptional()
  @IsString()
  thumbnail?: string;

  @ApiPropertyOptional({ enum: VideoSource })
  @IsOptional()
  @IsEnum(VideoSource)
  source?: VideoSource;
}
