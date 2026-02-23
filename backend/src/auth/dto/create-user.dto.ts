import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty({ message: 'O nome não pode ser vazio.' })
  name: string;

  @IsEmail({}, { message: 'Por favor, insira um email válido.' })
  email: string;

  @IsString()
  @MinLength(6, { message: 'A senha precisa ter no mínimo 6 caracteres.' })
  password: string;
}