export interface UserSubscription {
  plan: 'free' | 'pro';
  subscriptionEndsAt: string | null;
}

export function isPro(subscription: UserSubscription | null): boolean {
  if (!subscription || subscription.plan !== 'pro') {
    return false;
  }

  if (!subscription.subscriptionEndsAt) {
    return false;
  }

  const expirationDate = new Date(subscription.subscriptionEndsAt);
  const now = new Date();

  return expirationDate > now;
}

export function getSubscriptionStatus(subscription: UserSubscription | null): {
  isPro: boolean;
  daysRemaining: number | null;
  expiresAt: Date | null;
} {
  if (!subscription || subscription.plan !== 'pro' || !subscription.subscriptionEndsAt) {
    return {
      isPro: false,
      daysRemaining: null,
      expiresAt: null,
    };
  }

  const expiresAt = new Date(subscription.subscriptionEndsAt);
  const now = new Date();
  const timeDiff = expiresAt.getTime() - now.getTime();
  const daysRemaining = Math.ceil(timeDiff / (1000 * 3600 * 24));

  return {
    isPro: daysRemaining > 0,
    daysRemaining: daysRemaining > 0 ? daysRemaining : null,
    expiresAt: daysRemaining > 0 ? expiresAt : null,
  };
}
