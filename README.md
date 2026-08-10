<h1>
  <img src="./frontend/public/logo.png" alt="Zent Logo" width="48" align="center" />
  &nbsp;Zent
</h1>
=======
<table>
  <tr>
    <td>
      <img src="./frontend/public/logo.png" alt="Zent Logo" width="60" />
    </td>
    <td>
      <h1>Zent</h1>
    </td>
  </tr>
</table>

Zent é uma plataforma de organização de projetos inspirada em ferramentas baseada no Kanban da platadorma MIRO, com foco em produtividade, colaboração e gerenciamento visual de tarefas por Kanban.

O projeto permite criar workspaces, gerenciar projetos, organizar tasks por status, prioridade e responsáveis, acompanhar atividades recentes, comentar em tarefas, anexar arquivos e alternar entre tema claro e escuro.

## Visão geral

O Zent foi desenvolvido como uma aplicação full stack moderna, separando frontend e backend em duas aplicações principais:

```text
Zent/
├── frontend/
└── backend/
```

## Tecnologias utilizadas

### Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS
- Lucide React
- DnD Kit
- Recharts
- Vercel

### Backend

- NestJS
- TypeScript
- Prisma ORM
- PostgreSQL
- JWT Authentication
- Render

### Integrações e recursos

- Cloudinary para upload de anexos/imagens
- Stripe para planos/assinaturas
- Sincronização em tempo real para tasks, comentários e presença
- Sistema de permissões por workspace

## Funcionalidades

- Autenticação de usuários
- Criação e gerenciamento de workspaces
- Criação e gerenciamento de projetos
- Board Kanban por projeto
- Colunas de status: A fazer, Em progresso, Em revisão, Concluído e Cancelado
- Criação, edição e exclusão de tasks
- Prioridades: Baixa, Média, Alta e Urgente
- Ordenação por urgência
- Responsáveis por task
- Labels personalizadas
- Comentários em tasks
- Exclusão de comentários com confirmação
- Anexos em tasks
- Atividades recentes do projeto
- Presença de usuários online
- Filtros de tasks
- Busca global
- Tema claro e escuro
- Página de perfil
- Página de planos/preços
- Controle de permissões entre membros
- Modal de edição de projeto
- Projetos finalizados com modo somente leitura

## Deploy

### Frontend

O frontend está preparado para deploy na Vercel.

Exemplo de URL de produção:

```text
https://zent-mu.vercel.app
```

### Backend

O backend está preparado para deploy na Render.

Exemplo de URL de produção:

```text
https://zentapi-htz5.onrender.com
```

## Como rodar o projeto localmente

### Pré-requisitos

Antes de começar, tenha instalado:

- Node.js
- pnpm
- PostgreSQL
- Git

## Rodando o frontend

Entre na pasta do frontend:

```bash
cd frontend
```

Instale as dependências:

```bash
pnpm install
```

Rode o servidor de desenvolvimento:

```bash
pnpm dev
```

O frontend normalmente ficará disponível em:

```text
http://localhost:3001
```

ou na porta configurada pelo Next.js.

## Rodando o backend

Entre na pasta do backend:

```bash
cd backend
```

Instale as dependências:

```bash
pnpm install
```

Rode as migrations do Prisma:

```bash
pnpm prisma migrate dev
```

Gere o client do Prisma:

```bash
pnpm prisma generate
```

Inicie o servidor:

```bash
pnpm start:dev
```

O backend normalmente ficará disponível em:

```text
http://localhost:3000
```

## Variáveis de ambiente

Crie um arquivo `.env` nas pastas necessárias do projeto.

### Frontend

Exemplo de `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
```

### Backend

Exemplo de `.env`:

```env
DATABASE_URL=
JWT_SECRET=

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

FRONTEND_URL=http://localhost:3001
```


## Scripts úteis

### Frontend

```bash
pnpm dev
pnpm build
pnpm start
pnpm lint
```

### Backend

```bash
pnpm start:dev
pnpm build
pnpm start:prod
pnpm prisma migrate dev
pnpm prisma generate
```


## Principais telas

- Landing page
- Login
- Cadastro
- Dashboard
- Projetos
- Board Kanban
- Modal de task
- Perfil do usuário
- Configurações do workspace
- Membros do workspace
- Planos e assinatura


## Autor

Desenvolvido por **Everson Prieto**.

- GitHub: [EversonPrieto](https://github.com/EversonPrieto)
- Linkedin: [Éverson Prieto](https://www.linkedin.com/in/%C3%A9verson-prieto-115052156/)
