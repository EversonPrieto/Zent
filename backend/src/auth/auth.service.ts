import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { createHash, randomBytes } from 'crypto';
import * as bcrypt from 'bcrypt';

import { PrismaService } from 'src/prisma/prisma.service';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';

import { CreateUserDto } from './dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateEmailPreferencesDto } from './dto/update-email-preferences.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private cloudinary: CloudinaryService,
  ) {}

  private normalizeEmail(email: string) {
    const cleanEmail = email?.trim().toLowerCase();

    if (!cleanEmail) {
      throw new BadRequestException('Email é obrigatório.');
    }

    return cleanEmail;
  }

  private normalizeName(name: string) {
    const cleanName = name?.trim();

    if (!cleanName) {
      throw new BadRequestException('Nome é obrigatório.');
    }

    return cleanName;
  }

  private hashResetToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }

  private getFrontendUrl() {
    const frontendUrl = process.env.FRONTEND_URL?.split(',')[0]?.trim();

    if (!frontendUrl) {
      throw new InternalServerErrorException('FRONTEND_URL não configurada.');
    }

    return frontendUrl;
  }

  async signUp(dto: CreateUserDto) {
    const name = this.normalizeName(dto.name);
    const email = this.normalizeEmail(dto.email);

    if (!dto.password || dto.password.length < 6) {
      throw new BadRequestException('A senha deve ter pelo menos 6 caracteres.');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    try {
      const user = await this.prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
        },
      });

      const { password, resetPasswordToken, resetPasswordExpires, ...result } =
        user;

      return result;
    } catch (error: any) {
      if (error?.code === 'P2002') {
        throw new ConflictException('Este email já está em uso.');
      }

      throw new InternalServerErrorException('Erro ao criar usuário.');
    }
  }

  async login(dto: LoginDto) {
    const email = this.normalizeEmail(dto.email);

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas.');
    }

    const ok = await bcrypt.compare(dto.password, user.password);

    if (!ok) {
      throw new UnauthorizedException('Credenciais inválidas.');
    }

    const accessToken = await this.jwt.signAsync({
      sub: user.id,
      email: user.email,
    });

    return {
      accessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl,
        emailNotificationsEnabled: user.emailNotificationsEnabled,
      },
    };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const data: {
      name?: string;
      email?: string;
      avatarUrl?: string | null;
    } = {};

    if (dto.name !== undefined) {
      data.name = this.normalizeName(dto.name);
    }

    if (dto.email !== undefined) {
      data.email = this.normalizeEmail(dto.email);
    }

    if (dto.avatarUrl !== undefined) {
      data.avatarUrl = dto.avatarUrl?.trim() || null;
    }

    try {
      const user = await this.prisma.user.update({
        where: { id: userId },
        data,
      });

      const { password, resetPasswordToken, resetPasswordExpires, ...result } =
        user;

      return result;
    } catch (error: any) {
      if (error?.code === 'P2002') {
        throw new ConflictException('Este email já está em uso.');
      }

      throw new InternalServerErrorException('Erro ao atualizar perfil.');
    }
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const email = this.normalizeEmail(dto.email);

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    const defaultMessage = {
      message: 'Se o email existe, você receberá um link de recuperação.',
    };

    if (!user) {
      return defaultMessage;
    }

    const resetToken = randomBytes(32).toString('hex');
    const resetTokenHash = this.hashResetToken(resetToken);
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

      throw new InternalServerErrorException(
        'Erro ao processar requisição de recuperação de senha.',
      );
    }

    const resetLink = `${this.getFrontendUrl()}/reset-password?token=${resetToken}`;

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
        const errorData = await emailResponse.json().catch(() => null);
        console.error('Brevo API error:', errorData);
      }
    } catch (error) {
      console.error('Email sending error:', error);
    }

    return defaultMessage;
  }

  async resetPassword(dto: ResetPasswordDto) {
    const token = dto.token?.trim();

    if (!token) {
      throw new BadRequestException('Token é obrigatório.');
    }

    if (!dto.newPassword || dto.newPassword.length < 6) {
      throw new BadRequestException('A senha deve ter pelo menos 6 caracteres.');
    }

    const resetTokenHash = this.hashResetToken(token);

    const user = await this.prisma.user.findFirst({
      where: {
        resetPasswordToken: resetTokenHash,
        resetPasswordExpires: {
          gt: new Date(),
        },
      },
      select: {
        id: true,
      },
    });

    if (!user) {
      throw new BadRequestException('Link de recuperação inválido ou expirado.');
    }

    const hashedPassword = await bcrypt.hash(dto.newPassword, 10);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpires: null,
      },
    });

    return { message: 'Senha redefinida com sucesso.' };
  }

  async uploadAvatar(userId: string, file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Nenhum arquivo foi enviado.');
    }

    if (!file.mimetype?.startsWith('image/')) {
      throw new BadRequestException('O arquivo deve ser uma imagem.');
    }

    const maxSizeInBytes = 5 * 1024 * 1024;

    if (file.size && file.size > maxSizeInBytes) {
      throw new BadRequestException('A imagem deve ter no máximo 5MB.');
    }

    try {
      const uploadResult = await this.cloudinary.uploadImage(file, {
        folder: 'zent/avatars',
      });

      const user = await this.prisma.user.update({
        where: { id: userId },
        data: { avatarUrl: uploadResult.secure_url },
      });

      const { password, resetPasswordToken, resetPasswordExpires, ...result } =
        user;

      return result;
    } catch (error) {
      console.error('Avatar upload error:', error);

      throw new InternalServerErrorException('Erro ao fazer upload do avatar.');
    }
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const { currentPassword, newPassword, confirmPassword } = dto;

    if (!currentPassword || !newPassword || !confirmPassword) {
      throw new BadRequestException('Preencha todos os campos de senha.');
    }

    if (newPassword.length < 6) {
      throw new BadRequestException('A senha deve ter pelo menos 6 caracteres.');
    }

    if (newPassword !== confirmPassword) {
      throw new BadRequestException('As senhas não conferem.');
    }

    if (currentPassword === newPassword) {
      throw new BadRequestException(
        'A nova senha deve ser diferente da senha atual.',
      );
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        password: true,
      },
    });

    if (!user) {
      throw new BadRequestException('Usuário não encontrado.');
    }

    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password,
    );

    if (!isPasswordValid) {
      throw new BadRequestException('Senha atual incorreta.');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpires: null,
      },
    });

    return { message: 'Senha alterada com sucesso!' };
  }

  async updateEmailPreferences(
    userId: string,
    dto: UpdateEmailPreferencesDto,
  ) {
    if (typeof dto.emailNotificationsEnabled !== 'boolean') {
      throw new BadRequestException('Preferência de email inválida.');
    }

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

      throw new InternalServerErrorException(
        'Erro ao atualizar preferências de email.',
      );
    }
  }
}