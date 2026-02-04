import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { LayoutType } from '@prisma/client';

export class CreateLayoutDto {
  @ApiProperty({ example: 'Full Screen Layout' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiPropertyOptional({ enum: LayoutType, default: LayoutType.FULLSCREEN })
  @IsOptional()
  @IsEnum(LayoutType)
  type?: LayoutType;

  @ApiPropertyOptional({
    example: '{"backgroundColor":"#000000"}',
    description: 'Layout configuration JSON',
  })
  @IsOptional()
  @IsString()
  config?: string;
}
