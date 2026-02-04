import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { LayoutType } from '@prisma/client';

export class UpdateLayoutDto {
  @ApiPropertyOptional({ example: 'Updated Layout Name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ enum: LayoutType })
  @IsOptional()
  @IsEnum(LayoutType)
  type?: LayoutType;

  @ApiPropertyOptional({
    example: '{"backgroundColor":"#ffffff"}',
    description: 'Layout configuration JSON',
  })
  @IsOptional()
  @IsString()
  config?: string;
}
