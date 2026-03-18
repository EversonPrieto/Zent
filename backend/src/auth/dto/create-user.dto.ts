import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ example: 'Nome Sobrenome' })
  @IsString()
  @IsNotEmpty({ message: 'O nome não pode ser vazio.' })
  name: string;

  @ApiProperty({ example: 'email@email.com' })
  @IsEmail({}, { message: 'Por favor, insira um email válido.' })
  email: string;

  @ApiProperty({
    example: 'Senha@123',
    description:
      'Senha com no mínimo 8 caracteres, incluindo maiúscula, minúscula, número e símbolo.',
  })
  @IsString()
  @MinLength(8, {
    message: 'A senha precisa ter no mínimo 8 caracteres.',
  })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).+$/, {
    message:
      'A senha deve conter pelo menos uma letra minúscula, uma maiúscula, um número e um símbolo.',
  })
  password: string;
}