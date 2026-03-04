import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCommentDto {

  @ApiProperty({
    example: 'Essa task precisa ser revisada'
  })
  @IsString()
  @IsNotEmpty()
  content: string;
}