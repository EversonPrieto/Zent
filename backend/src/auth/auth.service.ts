import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { randomBytes } from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private cloudinary: CloudinaryService,
  ) {}

  async signUp(dto: CreateUserDto) {
    const salt = 10;
    const hashedPassword = await bcrypt.hash(dto.password, salt);

    try {
      const user = await this.prisma.user.create({
        data: {
          name: dto.name,
          email: dto.email,
          password: hashedPassword,
        },
      });

      const { password, ...result } = user;
      return result;
    } catch (error: any) {
      if (error?.code === 'P2002') {
        throw new ConflictException('Este email já está em uso.');
      }
      throw new InternalServerErrorException();
    }
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) throw new UnauthorizedException('Credenciais inválidas.');

    const ok = await bcrypt.compare(dto.password, user.password);
    if (!ok) throw new UnauthorizedException('Credenciais inválidas.');

    const accessToken = await this.jwt.signAsync({
      sub: user.id,
      email: user.email,
    });

    return {
      accessToken,
      user: { id: user.id, name: user.name, email: user.email, avatarUrl: user.avatarUrl },
    };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    try {
      const user = await this.prisma.user.update({
        where: { id: userId },
        data: {
          ...(dto.name && { name: dto.name }),
          ...(dto.email && { email: dto.email }),
          ...(dto.avatarUrl && { avatarUrl: dto.avatarUrl }),
        },
      });

      const { password, ...result } = user;
      return result;
    } catch (error: any) {
      if (error?.code === 'P2002') {
        throw new ConflictException('Este email já está em uso.');
      }
      throw new InternalServerErrorException('Erro ao atualizar perfil');
    }
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      return { message: 'Se o email existe, você receberá um link de recuperação.' };
    }

    const resetToken = randomBytes(32).toString('hex');
    const resetTokenHash = await bcrypt.hash(resetToken, 10);

    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    try {
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          resetPasswordToken: resetTokenHash,
          resetPasswordExpires: expiresAt,
        },
      });
    } catch (error) {
      console.error('Error saving reset token:', error);
      throw new InternalServerErrorException('Erro ao processar requisição de recuperação de senha');
    }

    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    try {
      const headers = new Headers();
      headers.append('api-key', process.env.BREVO_API_KEY || '');
      headers.append('Content-Type', 'application/json');

      const emailResponse = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          sender: {
            email: process.env.BREVO_SENDER_EMAIL || 'appzent@outlook.com',
            name: 'Zent',
          },
          to: [
            {
              email: user.email,
              name: user.name || 'Usuário',
            },
          ],
          subject: 'Recuperar sua senha - Zent',
          htmlContent: `
            <html>
              <body style="font-family: Arial, sans-serif; background-color: #09090b; color: #ffffff; padding: 20px;">
                <div style="max-width: 600px; margin: 0 auto; background-color: #18181b; border-radius: 8px; padding: 40px; border: 1px solid #27272a;">
                  <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="margin: 0; color: #a78bfa;">Recuperar Senha</h1>
                  </div>
                  
                  <p style="font-size: 16px; margin: 20px 0;">Olá ${user.name || 'Usuário'},</p>
                  
                  <p style="font-size: 14px; margin: 20px 0; color: #d4d4d8;">
                    Recebemos uma solicitação para recuperar a senha da sua conta. 
                    Clique no botão abaixo para criar uma nova senha.
                  </p>
                  
                  <div style="text-align: center; margin: 40px 0;">
                    <a href="${resetLink}" style="background: linear-gradient(135deg, #a78bfa 0%, #6366f1 100%); color: white; padding: 12px 32px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                      Recuperar Senha
                    </a>
                  </div>
                  
                  <p style="font-size: 12px; color: #71717a; margin: 20px 0;">
                    Este link expira em 1 hora por razões de segurança.
                  </p>
                  
                  <p style="font-size: 12px; color: #71717a; margin: 20px 0;">
                    Se você não solicitou a recuperação de senha, ignore este email.
                  </p>
                  
                  <hr style="border: none; border-top: 1px solid #27272a; margin: 30px 0;">
                  
                  <p style="font-size: 12px; color: #71717a; text-align: center;">
                    © 2024 Zent. Todos os direitos reservados.
                  </p>
                </div>
              </body>
            </html>
          `,
        }),
      });

      if (!emailResponse.ok) {
        const errorData = await emailResponse.json();
        console.error('Brevo API error:', errorData);
        throw new Error('Falha ao enviar email');
      }
    } catch (error) {
      console.error('Email sending error:', error);
    }

    return { message: 'Se o email existe, você receberá um link de recuperação.' };
  }

  async resetPassword(dto: ResetPasswordDto) {
    try {

      const users = await this.prisma.user.findMany({
        select: {
          id: true,
          resetPasswordToken: true,
          resetPasswordExpires: true,
        },
      });

      let matchedUser: { id: string; resetPasswordToken: string | null; resetPasswordExpires: Date | null } | null = null;
      for (const user of users) {
        if (user.resetPasswordToken && user.resetPasswordExpires) {
          if (new Date() > user.resetPasswordExpires) {
            await this.prisma.user.update({
              where: { id: user.id },
              data: {
                resetPasswordToken: null,
                resetPasswordExpires: null,
              },
            });
            continue;
          }

          const isTokenValid = await bcrypt.compare(dto.token, user.resetPasswordToken);
          if (isTokenValid) {
            matchedUser = user;
            break;
          }
        }
      }

      if (!matchedUser) {
        throw new BadRequestException('Link de recuperação inválido ou expirado.');
      }

      const hashedPassword = await bcrypt.hash(dto.newPassword, 10);

      await this.prisma.user.update({
        where: { id: matchedUser.id },
        data: {
          password: hashedPassword,
          resetPasswordToken: null,
          resetPasswordExpires: null,
        },
      });

      return { message: 'Senha redefinida com sucesso.' };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      console.error('Reset password error:', error);
      throw new InternalServerErrorException('Erro ao redefinir senha');
    }
  }

  async uploadAvatar(userId: string, file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Nenhum arquivo foi enviado');
    }

    // Validar tipo de arquivo
    if (!file.mimetype.startsWith('image/')) {
      throw new BadRequestException('O arquivo deve ser uma imagem');
    }

    try {
      console.log('Iniciando upload do avatar:', { userId, fileName: file.filename, mimetype: file.mimetype });
      
      // Upload para Cloudinary
      const uploadResult = await this.cloudinary.uploadImage(file, {
        folder: 'zent/avatars',
      });

      console.log('Upload Cloudinary bem-sucedido:', uploadResult.public_id);

      // Atualizar avatar no banco
      const user = await this.prisma.user.update({
        where: { id: userId },
        data: { avatarUrl: uploadResult.secure_url },
      });

      const { password, ...result } = user;
      return result;
    } catch (error) {
      console.error('Avatar upload error:', error);
      throw new InternalServerErrorException('Erro ao fazer upload do avatar');
    }
  }

  async changePassword(userId: string, dto: any) {
    const { currentPassword, newPassword, confirmPassword } = dto;

    // Validar que as senhas conferem
    if (newPassword !== confirmPassword) {
      throw new BadRequestException('As senhas não conferem');
    }

    // Validar que a senha atual e a nova são diferentes
    if (currentPassword === newPassword) {
      throw new BadRequestException('A nova senha deve ser diferente da senha atual');
    }

    try {
      // Buscar usuário
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new BadRequestException('Usuário não encontrado');
      }

      // Validar senha atual
      const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isPasswordValid) {
        throw new BadRequestException('Senha atual incorreta');
      }

      // Hash da nova senha
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Atualizar senha
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          password: hashedPassword,
        },
      });

      return { message: 'Senha alterada com sucesso!' };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      console.error('Change password error:', error);
      throw new InternalServerErrorException('Erro ao alterar a senha');
    }
  }

  async updateEmailPreferences(userId: string, dto: any) {
    try {
      const updatedUser = await this.prisma.user.update({
        where: { id: userId },
        data: {
          emailNotificationsEnabled: dto.emailNotificationsEnabled,
        },
        select: {
          id: true,
          name: true,
          email: true,
          emailNotificationsEnabled: true,
        },
      });

      return {
        message: 'Preferências atualizadas com sucesso!',
        emailNotificationsEnabled: updatedUser.emailNotificationsEnabled,
      };
    } catch (error) {
      console.error('Update email preferences error:', error);
      throw new InternalServerErrorException('Erro ao atualizar preferências de email');
    }
  }
}