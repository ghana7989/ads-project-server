import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateClientDto {
  @ApiProperty({ example: 'Lobby Display' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'Main lobby display screen' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'Building A - Lobby' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiProperty({ example: 'DISPLAY002' })
  @IsNotEmpty()
  @IsString()
  loginId: string;

  @ApiProperty({ example: 'securepassword123' })
  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  password: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  layoutId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sequenceId?: string;
}
