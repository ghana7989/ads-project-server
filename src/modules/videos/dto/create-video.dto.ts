import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUrl, IsInt, Min } from 'class-validator';
import { VideoSource } from '@prisma/client';

export class CreateVideoDto {
  @ApiProperty({ example: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' })
  @IsNotEmpty()
  @IsUrl()
  url: string;

  @ApiProperty({ example: 'Welcome Video' })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiPropertyOptional({ example: 212 })
  @IsOptional()
  @IsInt()
  @Min(0)
  duration?: number;

  @ApiPropertyOptional({ example: 'https://img.youtube.com/vi/dQw4w9WgXcQ/0.jpg' })
  @IsOptional()
  @IsString()
  thumbnail?: string;

  @ApiPropertyOptional({ enum: VideoSource, default: VideoSource.YOUTUBE })
  @IsOptional()
  @IsEnum(VideoSource)
  source?: VideoSource;
}
