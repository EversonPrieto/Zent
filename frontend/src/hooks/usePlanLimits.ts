import { useEffect, useState } from 'react';
import { PlanType, PLAN_LIMITS, checkLimit } from '../lib/plans';
import { isPro } from '../lib/subscription';

interface UserSubscription {
  plan: PlanType;
  subscriptionEndsAt: string | null;
}

export function usePlanLimits() {
  const [plan, setPlan] = useState<PlanType>('free');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userData = localStorage.getItem('zent_user');
    if (userData) {
      try {
        const parsed = JSON.parse(userData);
        setPlan(parsed.plan || 'free');
      } catch (err) {
        console.error('Error parsing user data:', err);
        setPlan('free');
      }
    }
    setLoading(false);
  }, []);

  const getLimits = () => PLAN_LIMITS[plan];

  const canAddWorkspace = (currentCount: number = 0) =>
    checkLimit(plan, 'workspaces', currentCount);

  const canAddProject = (currentCount: number = 0) =>
    checkLimit(plan, 'projectsPerWorkspace', currentCount);

  const canAddTask = (currentCount: number = 0) =>
    checkLimit(plan, 'tasksPerProject', currentCount);

  const canAddMember = (currentCount: number = 0) =>
    checkLimit(plan, 'teamMembers', currentCount);

  const getStorageLimit = () => PLAN_LIMITS[plan].storageGB;

  const hasApiAccess = () => PLAN_LIMITS[plan].apiAccess;

  const hasAdvancedReports = () => PLAN_LIMITS[plan].advancedReports;

  const hasCustomBranding = () => PLAN_LIMITS[plan].customBranding;

  const hasPrioritySupport = () => PLAN_LIMITS[plan].prioritySupport;

  return {
    plan,
    loading,
    limits: getLimits(),
    canAddWorkspace,
    canAddProject,
    canAddTask,
    canAddMember,
    getStorageLimit,
    hasApiAccess,
    hasAdvancedReports,
    hasCustomBranding,
    hasPrioritySupport,
  };
}
