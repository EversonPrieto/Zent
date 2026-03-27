import { Injectable } from '@nestjs/common'
import { BrevoClient } from '@getbrevo/brevo'
import { ConfigService } from '@nestjs/config'

@Injectable()
export class EmailService {
  private client: BrevoClient
  private senderEmail: string

  constructor(private config: ConfigService) {
    // Initialize the Brevo client with the API key (v4+/v5 usage)
    this.client = new BrevoClient({
      apiKey: this.config.get<string>('BREVO_API_KEY')!,
    })
    // Use the verified sender email from env or fallback to a default
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
    // Build the request payload compatible with BrevoClient
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
      // Log detailed error to help debugging why emails are not delivered
      console.error('[EmailService] ❌ Error sending invite email via Brevo:', err)
      throw err
    }
  }
}