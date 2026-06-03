import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID, IsNumber, IsISO8601, IsArray } from 'class-validator';
import { TaskPriority, TaskStatus } from '@prisma/client';

export class CreateTaskDto {
  @IsUUID()
  projectId: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(TaskStatus)
  @IsOptional()
  status?: TaskStatus;

  @IsEnum(TaskPriority)
  @IsOptional()
  priority?: TaskPriority;

  @IsUUID()
  @IsOptional()
  assigneeId?: string;

  @IsISO8601()
  @IsOptional()
  dueDate?: string;

  @IsNumber()
  @IsOptional()
  position?: number;

  @IsArray()
  @IsOptional()
  labelIds?: string[];

  @IsArray()
  @IsOptional()
  assigneeIds?: string[];
}