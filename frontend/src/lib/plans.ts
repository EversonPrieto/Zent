export type PlanType = 'free' | 'pro';

export interface PlanLimits {
  workspaces: number;
  projectsPerWorkspace: number;
  tasksPerProject: number;
  teamMembers: number;
  storageGB: number;
  activityLogsRetentionDays: number;
  customBranding: boolean;
  advancedReports: boolean;
  apiAccess: boolean;
  prioritySupport: boolean;
}

export const PLAN_LIMITS: Record<PlanType, PlanLimits> = {
  free: {
    workspaces: 1,
    projectsPerWorkspace: 3,
    tasksPerProject: 50,
    teamMembers: 5,
    storageGB: 1,
    activityLogsRetentionDays: 30,
    customBranding: false,
    advancedReports: false,
    apiAccess: false,
    prioritySupport: false,
  },
  pro: {
    workspaces: 10,
    projectsPerWorkspace: 100,
    tasksPerProject: 10000,
    teamMembers: 50,
    storageGB: 100,
    activityLogsRetentionDays: 365,
    customBranding: true,
    advancedReports: true,
    apiAccess: true,
    prioritySupport: true,
  },
};

export const PLAN_FEATURES = {
  free: [
    {
      name: 'Workspaces',
      value: '1 workspace',
      icon: '📁',
    },
    {
      name: 'Projetos',
      value: 'Até 3 por workspace',
      icon: '📊',
    },
    {
      name: 'Tarefas',
      value: 'Até 50 por projeto',
      icon: '✓',
    },
    {
      name: 'Equipe',
      value: 'Até 5 membros',
      icon: '👥',
    },
    {
      name: 'Armazenamento',
      value: '1 GB',
      icon: '💾',
    },
    {
      name: 'Histórico',
      value: '30 dias de atividades',
      icon: '📝',
    },
    {
      name: 'Suporte',
      value: 'Comunidade',
      icon: '💬',
    },
  ],
  pro: [
    {
      name: 'Workspaces',
      value: 'Até 10 workspaces',
      icon: '📁',
      highlight: true,
    },
    {
      name: 'Projetos',
      value: 'Até 100 por workspace',
      icon: '📊',
      highlight: true,
    },
    {
      name: 'Tarefas',
      value: 'Até 10.000 por projeto',
      icon: '✓',
      highlight: true,
    },
    {
      name: 'Equipe',
      value: 'Até 50 membros',
      icon: '👥',
      highlight: true,
    },
    {
      name: 'Armazenamento',
      value: '100 GB',
      icon: '💾',
      highlight: true,
    },
    {
      name: 'Histórico',
      value: '1 ano de atividades',
      icon: '📝',
      highlight: true,
    },
    {
      name: 'Relatórios',
      value: 'Avançados',
      icon: '📈',
      highlight: true,
    },
    {
      name: 'API',
      value: 'Acesso incluído',
      icon: '⚙️',
      highlight: true,
    },
    {
      name: 'Suporte',
      value: 'Prioritário 24/7',
      icon: '⭐',
      highlight: true,
    },
  ],
};

export function getPlanLimits(plan: PlanType): PlanLimits {
  return PLAN_LIMITS[plan];
}

export function checkLimit(
  plan: PlanType,
  limitKey:
    | 'workspaces'
    | 'projectsPerWorkspace'
    | 'tasksPerProject'
    | 'teamMembers'
    | 'storageGB'
    | 'activityLogsRetentionDays',
  currentCount: number,
): { allowed: boolean; limit: number; remaining: number } {
  const limit = PLAN_LIMITS[plan][limitKey] as number;

  return {
    allowed: currentCount < limit,
    limit,
    remaining: Math.max(0, limit - currentCount),
  };
}