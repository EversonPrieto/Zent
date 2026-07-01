import { Injectable } from '@nestjs/common';
import { BrevoClient } from '@getbrevo/brevo';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmailService {
  private client: BrevoClient;
  private senderEmail: string;

  constructor(private config: ConfigService) {
    this.client = new BrevoClient({
      apiKey: this.config.get<string>('BREVO_API_KEY')!,
    });
    this.senderEmail =
      this.config.get<string>('BREVO_SENDER_EMAIL') || 'appzent@outlook.com';
  }

  async sendInviteEmail({
    to,
    workspaceName,
    invitedByName,
    inviteLink,
  }: {
    to: string;
    workspaceName: string;
    invitedByName: string;
    inviteLink: string;
  }) {
    const payload = {
      sender: {
        name: 'Zent',
        email: this.senderEmail,
      },
      to: [
        {
          email: to,
        },
      ],
      subject: `Convite para ${workspaceName}`,
      htmlContent: `
      <h2>Você foi convidado para o Zent 🚀</h2>
      <p><strong>${invitedByName}</strong> te convidou para a workspace <strong>${workspaceName}</strong></p>
      <p>Clique abaixo para aceitar:</p>
      <a href="${inviteLink}" style="
        display:inline-block;
        padding:10px 20px;
        background:black;
        color:white;
        text-decoration:none;
        border-radius:8px;
      ">
        Aceitar convite
      </a>
    `,
    };

    try {
      console.log('[EmailService] Sending invite email:', {
        to,
        workspaceName,
        invitedByName,
        inviteLink,
      });
      const res =
        await this.client.transactionalEmails.sendTransacEmail(payload);
      console.log('[EmailService] ✅ Brevo sendTransacEmail success:', res);
      return res;
    } catch (err) {
      console.error(
        '[EmailService] ❌ Error sending invite email via Brevo:',
        err,
      );
      throw err;
    }
  }

  async sendTaskMovedDigestEmail({
    to,
    workspaceName,
    actorName,
    taskTitle,
    fromStatus,
    toStatus,
    movedCount,
    projectLink,
  }: {
    to: string;
    workspaceName: string;
    actorName: string | null;
    taskTitle: string | null;
    fromStatus: string;
    toStatus: string;
    movedCount: number;
    projectLink: string;
  }) {
    const payload = {
      sender: {
        name: 'Zent',
        email: this.senderEmail,
      },
      to: [
        {
          email: to,
        },
      ],
      subject: `Atualizações de tarefas no ${workspaceName}`,
      htmlContent: `
        <div style="font-family: Arial, sans-serif; background-color: #09090b; color: #ffffff; padding: 20px;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #18181b; border-radius: 8px; padding: 24px; border: 1px solid #27272a;">
            <h2 style="margin-top: 0; color: #a78bfa;">Você tem atualizações de tarefas</h2>
            <p style="font-size: 14px; color: #d4d4d8;">
              ${actorName ? `<strong>${actorName}</strong> ` : ''}moveu ${movedCount} task(s) recentemente.
            </p>

            <div style="margin-top: 16px; padding: 12px 14px; background: rgba(124, 58, 237, 0.10); border: 1px solid rgba(124, 58, 237, 0.25); border-radius: 8px;">
              <p style="margin: 0; font-size: 14px;">
                <strong>Task:</strong> ${taskTitle ? taskTitle : '—'}
              </p>
              <p style="margin: 8px 0 0; font-size: 14px;">
                <strong>Status:</strong> ${fromStatus} → ${toStatus}
              </p>
            </div>

            <div style="text-align: center; margin: 22px 0;">
              <a href="${projectLink}" style="
                display:inline-block;
                padding:10px 20px;
                background:#000;
                color:#fff;
                text-decoration:none;
                border-radius:8px;
              ">
                Ver no Zent
              </a>
            </div>

            <p style="font-size: 12px; color: #71717a; margin: 0;">
              Você está recebendo este email porque ativou <em>Notificações por Email</em> nas configurações do perfil.
            </p>
          </div>
        </div>
      `,
    };

    try {
      const res = await this.client.transactionalEmails.sendTransacEmail(payload);
      return res;
    } catch (err) {
      console.error('[EmailService] ❌ Error sending task moved digest via Brevo:', err);
      throw err;
    }
  }
}
