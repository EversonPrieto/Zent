import { IsOptional, IsString, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateProjectDto {
  @ApiPropertyOptional({
    example: 'Zent Core',
    description: 'Nome do projeto',
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({
    example: 'Descrição do projeto',
    description: 'Descrição do projeto',
  })
  @IsString()
  @IsOptional()
  @Transform(({ value }) => (value === '' ? null : value))
  description?: string | null;

  @ApiPropertyOptional({
    example: false,
    description: 'Se o projeto está finalizado',
  })
  @IsBoolean()
  @IsOptional()
  completed?: boolean;
}
