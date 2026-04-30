import { IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @IsString()
  @MinLength(6, { message: 'A senha atual é obrigatória' })
  currentPassword: string;

  @IsString()
  @MinLength(8, { message: 'A nova senha deve ter no mínimo 8 caracteres' })
  newPassword: string;

  @IsString()
  @MinLength(8, { message: 'A confirmação deve ter no mínimo 8 caracteres' })
  confirmPassword: string;
}
