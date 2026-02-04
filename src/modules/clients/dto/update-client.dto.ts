import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateClientDto {
  @ApiPropertyOptional({ example: 'Updated Display Name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'Updated description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'Building B - Conference Room' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ example: 'newpassword123' })
  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sequenceId?: string;
}
