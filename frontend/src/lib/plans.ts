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
    { name: 'Workspaces', value: '1', icon: '📁' },
    { name: 'Projetos por workspace', value: 'até 3', icon: '📊' },
    { name: 'Tarefas por projeto', value: 'até 50', icon: '✓' },
    { name: 'Membros da equipe', value: 'até 5', icon: '👥' },
    { name: 'Armazenamento', value: '1 GB', icon: '💾' },
    { name: 'Retenção de atividades', value: '30 dias', icon: '📝' },
    { name: 'Suporte', value: 'Comunidade', icon: '💬' },
  ],
  pro: [
    { name: 'Workspaces', value: 'até 10', icon: '📁', highlight: true },
    { name: 'Projetos por workspace', value: 'até 100', icon: '📊', highlight: true },
    { name: 'Tarefas por projeto', value: 'até 10.000', icon: '✓', highlight: true },
    { name: 'Membros da equipe', value: 'até 50', icon: '👥', highlight: true },
    { name: 'Armazenamento', value: '100 GB', icon: '💾', highlight: true },
    { name: 'Retenção de atividades', value: '1 ano', icon: '📝', highlight: true },
    { name: 'Relatórios avançados', value: 'Incluído', icon: '📈', highlight: true },
    { name: 'Acesso à API', value: 'Incluído', icon: '⚙️', highlight: true },
    { name: 'Suporte prioritário', value: '24/7', icon: '⭐', highlight: true },
  ],
};

export function getPlanLimits(plan: PlanType): PlanLimits {
  return PLAN_LIMITS[plan];
}

export function checkLimit(
  plan: PlanType,
  limitKey: 'workspaces' | 'projectsPerWorkspace' | 'tasksPerProject' | 'teamMembers' | 'storageGB' | 'activityLogsRetentionDays',
  currentCount: number
): { allowed: boolean; limit: number; remaining: number } {
  const limit = PLAN_LIMITS[plan][limitKey] as number;
  return {
    allowed: currentCount < limit,
    limit,
    remaining: Math.max(0, limit - currentCount),
  };
}
