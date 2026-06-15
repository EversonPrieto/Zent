import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TaskStatus } from '@prisma/client';

export class MoveTaskDto {
  @ApiProperty({
    enum: TaskStatus,
    example: TaskStatus.IN_PROGRESS,
    description: 'Status/coluna de destino (Kanban)',
  })
  @IsEnum(TaskStatus)
  status: TaskStatus;

  @ApiPropertyOptional({
    example: '11111111-1111-1111-1111-111111111111',
    description: 'ID da task que ficará ANTES (na coluna de destino)',
  })
  @IsUUID()
  @IsOptional()
  beforeId?: string;

  @ApiPropertyOptional({
    example: '22222222-2222-2222-2222-222222222222',
    description: 'ID da task que ficará DEPOIS (na coluna de destino)',
  })
  @IsUUID()
  @IsOptional()
  afterId?: string;
}
