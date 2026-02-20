export type CommunityPostType = 'idea' | 'reflection' | 'rule_breakdown' | 'chart';
export type CommunityVisibility = 'public' | 'followers' | 'private';
export type CommunityDmVisibility = 'everyone' | 'followers' | 'no_one';

export interface CommunitySettings {
  userId: string;
  publicProfile: boolean;
  rankingOptIn: boolean;
  showMetrics: boolean;
  showAccountSizeBand: boolean;
  postVisibility: CommunityVisibility;
  dmVisibility: CommunityDmVisibility;
  createdAt: string;
  updatedAt: string;
}

export interface CommunityPostUser {
  id: string;
  displayName: string;
  username?: string | null;
}

export interface CommunityPost {
  id: string;
  type: CommunityPostType;
  title?: string;
  content: string;
  tags: string[];
  symbol?: string;
  strategyId?: string;
  tradeId?: string;
  assetType?: string;
  timeframe?: string;
  imageUrl?: string;
  visibility: CommunityVisibility;
  createdAt: string;
  user: CommunityPostUser;
  replyCount?: number;
}

export interface CommunityReply {
  id: string;
  postId: string;
  content: string;
  createdAt: string;
  user: CommunityPostUser;
}

export interface AccountSizeBand {
  key: string;
  label: string;
  min: number;
  max: number;
}

export interface LeaderboardEntry {
  userId: string;
  displayName: string;
  username?: string | null;
  accountSizeBand?: AccountSizeBand;
  accountBalance?: number;
  showMetrics?: boolean;
  tradeCount: number;
  returnPct: number;
  drawdownPct: number;
  profitFactor: number;
  volatility: number;
  score: number;
  confidence: 'low' | 'medium' | 'high';
  rank: number;
  metricsHidden?: boolean;
}

export interface CommunityPerson {
  userId: string;
  displayName: string;
  username?: string | null;
  accountSizeBand?: AccountSizeBand;
  tradeCount: number;
  returnPct: number;
  drawdownPct: number;
  score: number;
  confidence: 'low' | 'medium' | 'high';
  metricsHidden?: boolean;
}
