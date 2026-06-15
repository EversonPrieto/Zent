import { IsIn, IsNotEmpty } from 'class-validator';

export class UpdateMemberRoleDto {
  @IsNotEmpty()
  @IsIn(['ADMIN', 'MEMBER', 'VIEWER'], {
    message: 'Role inválida.',
  })
  role: 'ADMIN' | 'MEMBER' | 'VIEWER';
}
