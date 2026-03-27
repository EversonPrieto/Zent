'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { api } from '../../../lib/api'

type Invite = {
  workspace: {
    name: string
  }
  invitedBy: {
    name: string
    email: string
  }
}

export default function InvitePage() {
  const params = useParams()
  const router = useRouter()

  const token = params?.token as string

  const [invite, setInvite] = useState<Invite | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) return

    const fetchInvite = async () => {
      try {
        const data = await api(`/invites/${token}`) // ✅ SEM .get
        setInvite(data)
      } catch {
        alert('Convite inválido ou expirado')
        router.push('/dashboard/projects')
      } finally {
        setLoading(false)
      }
    }

    fetchInvite()
  }, [token, router])

  const handleAccept = async () => {
    const user = localStorage.getItem('zent_user')

    if (!user) {
      router.push(`/login?inviteToken=${token}`)
      return
    }

    try {
      await api(`/invites/${token}/accept`, {
        method: 'POST', // ✅ aqui define método
      })

      router.push('/dashboard/projects')
    } catch {
      alert('Erro ao aceitar convite')
    }
  }

  if (loading) return <p>Carregando convite...</p>
  if (!invite) return <p>Convite inválido</p>

  return (
    <div style={{ padding: 20 }}>
      <h1>Você foi convidado 🎉</h1>

      <p>
        Workspace: <strong>{invite.workspace.name}</strong>
      </p>

      <p>
        Convidado por: <strong>{invite.invitedBy.name}</strong>
      </p>

      <button onClick={handleAccept}>
        Aceitar convite
      </button>
    </div>
  )
}