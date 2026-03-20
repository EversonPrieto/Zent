import { IsEmail, IsIn, IsNotEmpty } from 'class-validator';

export class InviteMemberDto {
  @IsEmail({}, { message: 'Informe um email válido.' })
  email: string;

  @IsNotEmpty()
  @IsIn(['ADMIN', 'MEMBER', 'VIEWER'], {
    message: 'Role inválida.',
  })
  role: 'ADMIN' | 'MEMBER' | 'VIEWER';
}