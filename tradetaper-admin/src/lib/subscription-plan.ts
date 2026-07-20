const PLAN_ALIASES: Record<string, string> = {
  free: 'free',
  starter: 'free',
  basic: 'free',
  essential: 'essential',
  pro: 'essential',
  premium: 'premium',
  enterprise: 'enterprise',
};

export function normalizePlanKey(
  plan?: string | null,
  tier?: string | null,
): string {
  const raw = (plan || tier || '').trim().toLowerCase();
  if (!raw) {
    return 'free';
  }
  return PLAN_ALIASES[raw] || raw;
}

export function formatPlanLabel(
  plan?: string | null,
  tier?: string | null,
): string {
  const key = normalizePlanKey(plan, tier);
  if (key === 'free') return 'Free';
  if (key === 'essential') return 'Essential';
  if (key === 'premium') return 'Premium';
  if (key === 'enterprise') return 'Enterprise';
  return key.charAt(0).toUpperCase() + key.slice(1);
}

export function isFreePlan(plan?: string | null, tier?: string | null): boolean {
  return normalizePlanKey(plan, tier) === 'free';
}
