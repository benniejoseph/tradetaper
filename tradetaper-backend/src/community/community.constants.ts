export const COMMUNITY_POST_TYPES = [
  'idea',
  'reflection',
  'rule_breakdown',
  'chart',
] as const;

export const COMMUNITY_VISIBILITIES = [
  'public',
  'followers',
  'private',
] as const;

export const COMMUNITY_DM_VISIBILITIES = [
  'everyone',
  'followers',
  'no_one',
] as const;

export const ACCOUNT_SIZE_BANDS = [
  { key: 'micro', label: '<$5k', min: 0, max: 5000 },
  { key: 'small', label: '$5k-$25k', min: 5000, max: 25000 },
  { key: 'growth', label: '$25k-$50k', min: 25000, max: 50000 },
  { key: 'mid', label: '$50k-$100k', min: 50000, max: 100000 },
  { key: 'large', label: '$100k-$250k', min: 100000, max: 250000 },
  { key: 'pro', label: '$250k-$500k', min: 250000, max: 500000 },
  {
    key: 'institutional',
    label: '$500k+',
    min: 500000,
    max: Number.POSITIVE_INFINITY,
  },
];
