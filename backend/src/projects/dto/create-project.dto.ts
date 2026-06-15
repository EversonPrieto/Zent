import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProjectDto {
  @ApiProperty({
    example: 'Zent Core',
    description: 'Nome do projeto',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({
    example: 'Projeto principal do sistema',
    description: 'Descrição opcional do projeto',
  })
  @IsString()
  @IsOptional()
  description?: string;
}
