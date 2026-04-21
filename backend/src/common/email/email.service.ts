import { Injectable } from '@nestjs/common'
import { BrevoClient } from '@getbrevo/brevo'
import { ConfigService } from '@nestjs/config'

@Injectable()
export class EmailService {
  private client: BrevoClient
  private senderEmail: string

  constructor(private config: ConfigService) {
    this.client = new BrevoClient({
      apiKey: this.config.get<string>('BREVO_API_KEY')!,
    })
    this.senderEmail = this.config.get<string>('BREVO_SENDER_EMAIL') || 'appzent@outlook.com'
  }

  async sendInviteEmail({
    to,
    workspaceName,
    invitedByName,
    inviteLink,
  }: {
    to: string
    workspaceName: string
    invitedByName: string
    inviteLink: string
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
    }

    try {
      console.log('[EmailService] Sending invite email:', { to, workspaceName, invitedByName, inviteLink })
      const res = await this.client.transactionalEmails.sendTransacEmail(payload)
      console.log('[EmailService] ✅ Brevo sendTransacEmail success:', res)
      return res
    } catch (err) {
      console.error('[EmailService] ❌ Error sending invite email via Brevo:', err)
      throw err
    }
  }
}