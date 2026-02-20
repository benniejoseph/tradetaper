import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { CommunitySettings } from './entities/community-settings.entity';
import { CommunityPost } from './entities/community-post.entity';
import { CommunityFollow } from './entities/community-follow.entity';
import { CommunityPostReply } from './entities/community-post-reply.entity';
import { User } from '../users/entities/user.entity';
import { Trade } from '../trades/entities/trade.entity';
import { Account } from '../users/entities/account.entity';
import { CreateCommunityPostDto } from './dto/create-community-post.dto';
import { CreateCommunityReplyDto } from './dto/create-community-reply.dto';
import { UpdateCommunitySettingsDto } from './dto/update-community-settings.dto';
import {
  ACCOUNT_SIZE_BANDS,
  COMMUNITY_VISIBILITIES,
} from './community.constants';
import { TradeStatus } from '../types/enums';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType, NotificationPriority } from '../notifications/entities/notification.entity';
import { ConfigService } from '@nestjs/config';

interface FeedQuery {
  limit?: number;
  offset?: number;
  assetType?: string;
  timeframe?: string;
  strategyId?: string;
  type?: string;
  symbol?: string;
}

interface LeaderboardQuery {
  period?: string;
  accountSize?: string;
  assetType?: string;
  timeframe?: string;
  strategyId?: string;
  limit?: number;
}

const MIN_TRADES_FOR_LEADERBOARD = 30;

@Injectable()
export class CommunityService {
  constructor(
    @InjectRepository(CommunitySettings)
    private readonly settingsRepo: Repository<CommunitySettings>,
    @InjectRepository(CommunityPost)
    private readonly postRepo: Repository<CommunityPost>,
    @InjectRepository(CommunityFollow)
    private readonly followRepo: Repository<CommunityFollow>,
    @InjectRepository(CommunityPostReply)
    private readonly replyRepo: Repository<CommunityPostReply>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Trade)
    private readonly tradeRepo: Repository<Trade>,
    @InjectRepository(Account)
    private readonly accountRepo: Repository<Account>,
    private readonly notificationsService: NotificationsService,
    private readonly configService: ConfigService,
  ) {}

  private async ensureSettings(userId: string): Promise<CommunitySettings> {
    let settings = await this.settingsRepo.findOne({ where: { userId } });
    if (!settings) {
      settings = this.settingsRepo.create({
        userId,
        publicProfile: false,
        rankingOptIn: true,
        showMetrics: true,
        showAccountSizeBand: true,
        postVisibility: 'public',
        dmVisibility: 'followers',
      });
      settings = await this.settingsRepo.save(settings);
    }
    return settings;
  }

  async getSettings(userId: string) {
    return this.ensureSettings(userId);
  }

  async updateSettings(userId: string, dto: UpdateCommunitySettingsDto) {
    const settings = await this.ensureSettings(userId);
    Object.assign(settings, dto);
    return this.settingsRepo.save(settings);
  }

  async createPost(userId: string, dto: CreateCommunityPostDto) {
    const settings = await this.ensureSettings(userId);
    if (!settings.publicProfile) {
      throw new BadRequestException(
        'Enable your public profile to publish community posts.',
      );
    }

    const post = this.postRepo.create({
      ...dto,
      userId,
      visibility: dto.visibility || settings.postVisibility || 'public',
    });
    const saved = await this.postRepo.save(post);
    await this.notifyPostActivity(saved, userId);
    return saved;
  }

  async getFeed(query: FeedQuery) {
    const limit = Math.min(Number(query.limit) || 20, 100);
    const offset = Number(query.offset) || 0;

    const qb = this.postRepo
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.user', 'user')
      .leftJoin(
        CommunitySettings,
        'settings',
        'settings.userId = post.userId',
      )
      .where('settings.publicProfile = true')
      .andWhere('post.visibility = :visibility', {
        visibility: COMMUNITY_VISIBILITIES[0],
      });

    if (query.assetType) {
      qb.andWhere('post.assetType = :assetType', { assetType: query.assetType });
    }
    if (query.timeframe) {
      qb.andWhere('post.timeframe = :timeframe', { timeframe: query.timeframe });
    }
    if (query.strategyId) {
      qb.andWhere('post.strategyId = :strategyId', {
        strategyId: query.strategyId,
      });
    }
    if (query.type) {
      qb.andWhere('post.type = :type', { type: query.type });
    }
    if (query.symbol) {
      qb.andWhere('post.symbol = :symbol', { symbol: query.symbol });
    }

    const [posts, total] = await qb
      .orderBy('post.createdAt', 'DESC')
      .take(limit)
      .skip(offset)
      .getManyAndCount();

    const postIds = posts.map((post) => post.id);
    const replyCountMap = new Map<string, number>();
    if (postIds.length) {
      const replyCounts = await this.replyRepo
        .createQueryBuilder('reply')
        .select('reply.postId', 'postId')
        .addSelect('COUNT(reply.id)', 'count')
        .where('reply.postId IN (:...postIds)', { postIds })
        .groupBy('reply.postId')
        .getRawMany<{ postId: string; count: string }>();
      replyCounts.forEach((row) => {
        replyCountMap.set(row.postId, Number(row.count) || 0);
      });
    }

    const items = posts.map((post) => ({
      id: post.id,
      type: post.type,
      title: post.title,
      content: post.content,
      tags: post.tags || [],
      symbol: post.symbol,
      strategyId: post.strategyId,
      tradeId: post.tradeId,
      assetType: post.assetType,
      timeframe: post.timeframe,
      imageUrl: post.imageUrl,
      visibility: post.visibility,
      createdAt: post.createdAt,
      user: this.getPublicUser(post.user),
      replyCount: replyCountMap.get(post.id) || 0,
    }));

    return { items, total, limit, offset };
  }

  async searchUsers(query: string) {
    const term = (query || '').trim().toLowerCase();
    if (!term) {
      return { items: [] };
    }

    const users = await this.userRepo
      .createQueryBuilder('user')
      .innerJoin(
        CommunitySettings,
        'settings',
        'settings.userId = user.id AND settings.publicProfile = true',
      )
      .where('LOWER(user.username) LIKE :term', { term: `${term}%` })
      .andWhere('user.username IS NOT NULL')
      .limit(10)
      .getMany();

    return {
      items: users.map((user) => ({
        id: user.id,
        username: user.username,
        displayName: this.getDisplayName(user),
      })),
    };
  }

  async getReplies(postId: string, query: { limit?: number; offset?: number }) {
    const limit = Math.min(Number(query.limit) || 20, 100);
    const offset = Number(query.offset) || 0;

    const post = await this.postRepo.findOne({ where: { id: postId } });
    if (!post) {
      throw new NotFoundException('Post not found.');
    }

    const [replies, total] = await this.replyRepo.findAndCount({
      where: { postId },
      relations: ['user'],
      order: { createdAt: 'ASC' },
      take: limit,
      skip: offset,
    });

    return {
      items: replies.map((reply) => ({
        id: reply.id,
        postId: reply.postId,
        content: reply.content,
        createdAt: reply.createdAt,
        user: this.getPublicUser(reply.user),
      })),
      total,
      limit,
      offset,
    };
  }

  async createReply(
    userId: string,
    postId: string,
    dto: CreateCommunityReplyDto,
  ) {
    const settings = await this.ensureSettings(userId);
    if (!settings.publicProfile) {
      throw new BadRequestException(
        'Enable your public profile to reply in Community.',
      );
    }

    const post = await this.postRepo.findOne({ where: { id: postId } });
    if (!post) {
      throw new NotFoundException('Post not found.');
    }
    if (post.visibility !== COMMUNITY_VISIBILITIES[0]) {
      throw new BadRequestException('Replies are only allowed on public posts.');
    }

    const reply = this.replyRepo.create({
      postId,
      userId,
      content: dto.content,
    });
    const saved = await this.replyRepo.save(reply);

    await this.notifyReplyActivity(saved, post, userId);

    const hydrated = await this.replyRepo.findOne({
      where: { id: saved.id },
      relations: ['user'],
    });

    return {
      id: saved.id,
      postId: saved.postId,
      content: saved.content,
      createdAt: saved.createdAt,
      user: this.getPublicUser(hydrated?.user),
    };
  }

  async followUser(followerId: string, followeeId: string) {
    if (followerId === followeeId) {
      throw new BadRequestException('You cannot follow yourself.');
    }
    const followee = await this.userRepo.findOne({ where: { id: followeeId } });
    if (!followee) {
      throw new NotFoundException('User not found.');
    }
    const existing = await this.followRepo.findOne({
      where: { followerId, followeeId },
    });
    if (existing) {
      return existing;
    }
    const follow = this.followRepo.create({ followerId, followeeId });
    return this.followRepo.save(follow);
  }

  async unfollowUser(followerId: string, followeeId: string) {
    await this.followRepo.delete({ followerId, followeeId });
    return { success: true };
  }

  async getFollowing(followerId: string) {
    const follows = await this.followRepo.find({ where: { followerId } });
    return { items: follows.map((follow) => follow.followeeId) };
  }

  async getLeaderboard(query: LeaderboardQuery) {
    const limit = Math.min(Number(query.limit) || 50, 200);
    const period = (query.period || '3m').toLowerCase();
    const startDate = this.resolveStartDate(period);

    const settings = await this.settingsRepo.find({
      where: { publicProfile: true, rankingOptIn: true, showMetrics: true },
    });
    if (!settings.length) {
      return { items: [], total: 0 };
    }

    const userIds = settings.map((s) => s.userId);
    const settingsMap = new Map(settings.map((s) => [s.userId, s]));
    const users = await this.userRepo.find({ where: { id: In(userIds) } });
    const userMap = new Map(users.map((u) => [u.id, u]));

    const accounts = await this.accountRepo.find({
      where: { userId: In(userIds), isActive: true },
    });
    const accountMap = new Map<string, number>();
    accounts.forEach((account) => {
      const balance = Number(account.balance || 0);
      const existing = accountMap.get(account.userId) || 0;
      accountMap.set(account.userId, Math.max(existing, balance));
    });

    const tradesQb = this.tradeRepo
      .createQueryBuilder('trade')
      .where('trade.userId IN (:...userIds)', { userIds })
      .andWhere('trade.status = :status', { status: TradeStatus.CLOSED })
      .andWhere('trade.profitOrLoss IS NOT NULL');

    if (startDate) {
      tradesQb.andWhere('trade.closeTime >= :startDate', { startDate });
    }
    if (query.assetType) {
      tradesQb.andWhere('trade.assetType = :assetType', {
        assetType: query.assetType,
      });
    }
    if (query.timeframe) {
      tradesQb.andWhere('trade.timeframe = :timeframe', {
        timeframe: query.timeframe,
      });
    }
    if (query.strategyId) {
      tradesQb.andWhere('trade.strategyId = :strategyId', {
        strategyId: query.strategyId,
      });
    }

    const trades = await tradesQb.getMany();
    const tradesByUser = new Map<string, Trade[]>();
    trades.forEach((trade) => {
      const list = tradesByUser.get(trade.userId) || [];
      list.push(trade);
      tradesByUser.set(trade.userId, list);
    });

    const entries = Array.from(tradesByUser.entries()).map(
      ([userId, userTrades]) => {
        const accountBalance = accountMap.get(userId) || 0;
        const metrics = this.calculateMetrics(userTrades, accountBalance);
        const setting = settingsMap.get(userId);
        const accountSizeBand = setting?.showAccountSizeBand
          ? this.getAccountSizeBand(accountBalance)
          : null;
        const user = userMap.get(userId);

        return {
          userId,
          displayName: this.getDisplayName(user),
          username: user?.username || null,
          accountSizeBand,
          accountBalance,
          showMetrics: setting?.showMetrics ?? true,
          ...metrics,
        };
      },
    );

    const filteredEntries = query.accountSize
      ? entries.filter((entry) => entry.accountSizeBand?.key === query.accountSize)
      : entries;

    const sorted = filteredEntries
      .filter((entry) => entry.tradeCount >= MIN_TRADES_FOR_LEADERBOARD)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((entry, index) => ({ ...entry, rank: index + 1, metricsHidden: false }));

    return { items: sorted, total: sorted.length };
  }

  async getPeople(query: LeaderboardQuery) {
    const settings = await this.settingsRepo.find({
      where: { publicProfile: true },
    });
    if (!settings.length) {
      return { items: [] };
    }

    const userIds = settings.map((s) => s.userId);
    const settingsMap = new Map(settings.map((s) => [s.userId, s]));
    const users = await this.userRepo.find({ where: { id: In(userIds) } });
    const userMap = new Map(users.map((u) => [u.id, u]));

    const accounts = await this.accountRepo.find({
      where: { userId: In(userIds), isActive: true },
    });
    const accountMap = new Map<string, number>();
    accounts.forEach((account) => {
      const balance = Number(account.balance || 0);
      const existing = accountMap.get(account.userId) || 0;
      accountMap.set(account.userId, Math.max(existing, balance));
    });

    const tradesQb = this.tradeRepo
      .createQueryBuilder('trade')
      .where('trade.userId IN (:...userIds)', { userIds })
      .andWhere('trade.status = :status', { status: TradeStatus.CLOSED })
      .andWhere('trade.profitOrLoss IS NOT NULL');

    if (query.assetType) {
      tradesQb.andWhere('trade.assetType = :assetType', {
        assetType: query.assetType,
      });
    }
    if (query.timeframe) {
      tradesQb.andWhere('trade.timeframe = :timeframe', {
        timeframe: query.timeframe,
      });
    }
    if (query.strategyId) {
      tradesQb.andWhere('trade.strategyId = :strategyId', {
        strategyId: query.strategyId,
      });
    }

    const trades = await tradesQb.getMany();
    const tradesByUser = new Map<string, Trade[]>();
    trades.forEach((trade) => {
      const list = tradesByUser.get(trade.userId) || [];
      list.push(trade);
      tradesByUser.set(trade.userId, list);
    });

    const entries = userIds.map((userId) => {
      const userTrades = tradesByUser.get(userId) || [];
      const accountBalance = accountMap.get(userId) || 0;
      const metrics = this.calculateMetrics(userTrades, accountBalance);
      const setting = settingsMap.get(userId);
      const accountSizeBand = setting?.showAccountSizeBand
        ? this.getAccountSizeBand(accountBalance)
        : null;
      const user = userMap.get(userId);
      const metricsHidden = setting?.showMetrics === false;

      return {
        userId,
        displayName: this.getDisplayName(user),
        username: user?.username || null,
        accountSizeBand,
        tradeCount: metrics.tradeCount,
        returnPct: metricsHidden ? 0 : metrics.returnPct,
        drawdownPct: metricsHidden ? 0 : metrics.drawdownPct,
        score: metricsHidden ? 0 : metrics.score,
        confidence: metrics.confidence,
        metricsHidden,
      };
    });

    const filteredEntries = query.accountSize
      ? entries.filter((entry) => entry.accountSizeBand?.key === query.accountSize)
      : entries;

    const sorted = filteredEntries.sort((a, b) => b.score - a.score);

    return { items: sorted };
  }

  private getPublicUser(user?: User | null) {
    if (!user) {
      return { id: null, displayName: 'Trader' };
    }
    return {
      id: user.id,
      displayName: this.getDisplayName(user),
      username: user.username || null,
    };
  }

  private extractMentions(content: string): string[] {
    if (!content) return [];
    const regex = /(^|\s)@([a-z0-9_]{3,20})/gi;
    const usernames: string[] = [];
    for (const match of content.matchAll(regex)) {
      if (match[2]) {
        usernames.push(match[2].toLowerCase());
      }
    }
    return Array.from(new Set(usernames));
  }

  private async resolveMentionUsers(usernames: string[]): Promise<User[]> {
    if (!usernames.length) return [];
    const users = await this.userRepo
      .createQueryBuilder('user')
      .innerJoin(
        CommunitySettings,
        'settings',
        'settings.userId = user.id AND settings.publicProfile = true',
      )
      .where('LOWER(user.username) IN (:...usernames)', { usernames })
      .andWhere('user.username IS NOT NULL')
      .getMany();
    return users;
  }

  private getFrontendCommunityUrl(postId?: string, replyId?: string) {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || '';
    if (!frontendUrl) return undefined;
    const params = new URLSearchParams();
    if (postId) params.append('postId', postId);
    if (replyId) params.append('replyId', replyId);
    const suffix = params.toString();
    return `${frontendUrl}/community${suffix ? `?${suffix}` : ''}`;
  }

  private async notifyPostActivity(post: CommunityPost, authorId: string) {
    try {
      const author = await this.userRepo.findOne({ where: { id: authorId } });
      if (!author) return;

      const mentionUsernames = this.extractMentions(post.content);
      const mentionedUsers = await this.resolveMentionUsers(mentionUsernames);
      const mentionedIds = new Set(
        mentionedUsers.map((user) => user.id).filter((id) => id !== authorId),
      );

      const follows = await this.followRepo.find({
        where: { followeeId: authorId },
      });
      const followerIds = Array.from(
        new Set(
          follows
            .map((follow) => follow.followerId)
            .filter((id) => id !== authorId && !mentionedIds.has(id)),
        ),
      );

      const actionUrl = this.getFrontendCommunityUrl(post.id);
      const displayName = this.getDisplayName(author);
      const postLabel = post.type?.replace('_', ' ') || 'post';

      await Promise.allSettled([
        ...mentionedUsers
          .filter((user) => user.id !== authorId)
          .map((user) =>
            this.notificationsService.send({
              userId: user.id,
              type: NotificationType.COMMUNITY_MENTION,
              title: `${displayName} mentioned you`,
              message: `${displayName} mentioned you in a community ${postLabel}.`,
              priority: NotificationPriority.NORMAL,
              data: { postId: post.id },
              resourceType: 'community_post',
              resourceId: post.id,
              actionUrl,
              icon: 'community',
            }),
          ),
        ...followerIds.map((userId) =>
          this.notificationsService.send({
            userId,
            type: NotificationType.COMMUNITY_POST,
            title: `${displayName} shared a new post`,
            message: `${displayName} shared a new community ${postLabel}.`,
            priority: NotificationPriority.LOW,
            data: { postId: post.id },
            resourceType: 'community_post',
            resourceId: post.id,
            actionUrl,
            icon: 'community',
          }),
        ),
      ]);
    } catch (error) {
      // Ignore notification failures
    }
  }

  private async notifyReplyActivity(
    reply: CommunityPostReply,
    post: CommunityPost,
    authorId: string,
  ) {
    try {
      const author = await this.userRepo.findOne({ where: { id: authorId } });
      if (!author) return;

      const mentionUsernames = this.extractMentions(reply.content);
      const mentionedUsers = await this.resolveMentionUsers(mentionUsernames);
      const mentionedIds = new Set(
        mentionedUsers.map((user) => user.id).filter((id) => id !== authorId),
      );

      const actionUrl = this.getFrontendCommunityUrl(post.id, reply.id);
      const displayName = this.getDisplayName(author);

      const tasks: Promise<any>[] = [];

      mentionedUsers
        .filter((user) => user.id !== authorId)
        .forEach((user) => {
          tasks.push(
            this.notificationsService.send({
              userId: user.id,
              type: NotificationType.COMMUNITY_MENTION,
              title: `${displayName} mentioned you`,
              message: `${displayName} mentioned you in a community reply.`,
              priority: NotificationPriority.NORMAL,
              data: { postId: post.id, replyId: reply.id },
              resourceType: 'community_reply',
              resourceId: reply.id,
              actionUrl,
              icon: 'community',
            }),
          );
        });

      if (post.userId !== authorId && !mentionedIds.has(post.userId)) {
        tasks.push(
          this.notificationsService.send({
            userId: post.userId,
            type: NotificationType.COMMUNITY_REPLY,
            title: `${displayName} replied to your post`,
            message: `${displayName} replied to your community post.`,
            priority: NotificationPriority.NORMAL,
            data: { postId: post.id, replyId: reply.id },
            resourceType: 'community_reply',
            resourceId: reply.id,
            actionUrl,
            icon: 'community',
          }),
        );
      }

      await Promise.allSettled(tasks);
    } catch (error) {
      // Ignore notification failures
    }
  }

  private getDisplayName(user?: User | null) {
    if (!user) return 'Trader';
    const first = user.firstName || '';
    const last = user.lastName || '';
    const full = `${first} ${last}`.trim();
    if (full) return full;
    if (user.email) return user.email.split('@')[0];
    return 'Trader';
  }

  private resolveStartDate(period: string): Date | null {
    const now = new Date();
    if (period === 'all') return null;
    if (period === '7d') {
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }
    if (period === '1m') {
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
    if (period === '3m') {
      return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    }
    if (period === '1y') {
      return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
    }
    return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
  }

  private getAccountSizeBand(balance: number) {
    return (
      ACCOUNT_SIZE_BANDS.find(
        (band) => balance >= band.min && balance < band.max,
      ) || ACCOUNT_SIZE_BANDS[0]
    );
  }

  private calculateMetrics(trades: Trade[], accountBalance: number) {
    const tradeCount = trades.length;
    if (!tradeCount || accountBalance <= 0) {
      return {
        tradeCount,
        returnPct: 0,
        drawdownPct: 0,
        profitFactor: 0,
        volatility: 0,
        score: 0,
        confidence: 'low',
      };
    }

    const pnlValues = trades.map((t) => Number(t.profitOrLoss || 0));
    const totalPnl = pnlValues.reduce((sum, pnl) => sum + pnl, 0);
    const returnPct = (totalPnl / accountBalance) * 100;

    let running = 0;
    let peak = 0;
    let maxDrawdown = 0;
    trades
      .slice()
      .sort((a, b) => {
        const aTime = a.closeTime ? new Date(a.closeTime).getTime() : 0;
        const bTime = b.closeTime ? new Date(b.closeTime).getTime() : 0;
        return aTime - bTime;
      })
      .forEach((trade) => {
        running += Number(trade.profitOrLoss || 0);
        if (running > peak) peak = running;
        const dd = peak - running;
        if (dd > maxDrawdown) maxDrawdown = dd;
      });
    const drawdownPct = (maxDrawdown / accountBalance) * 100;

    const wins = pnlValues.filter((pnl) => pnl > 0);
    const losses = pnlValues.filter((pnl) => pnl < 0);
    const grossProfit = wins.reduce((sum, pnl) => sum + pnl, 0);
    const grossLoss = Math.abs(losses.reduce((sum, pnl) => sum + pnl, 0));
    const profitFactor =
      grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? 5 : 0;

    const returns = pnlValues.map((pnl) => (pnl / accountBalance) * 100);
    const mean =
      returns.reduce((sum, value) => sum + value, 0) / (returns.length || 1);
    const variance =
      returns.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) /
      (returns.length || 1);
    const volatility = Math.sqrt(variance);

    const returnScore = this.clamp((returnPct + 50) * 0.5, 0, 100);
    const drawdownScore = this.clamp(100 - drawdownPct, 0, 100);
    const consistencyScore = this.clamp(100 - volatility * 10, 0, 100);
    const profitFactorScore = this.clamp((profitFactor / 3) * 100, 0, 100);

    const score =
      returnScore * 0.3 +
      drawdownScore * 0.3 +
      consistencyScore * 0.25 +
      profitFactorScore * 0.15;

    const confidence =
      tradeCount >= 100 ? 'high' : tradeCount >= 30 ? 'medium' : 'low';

    return {
      tradeCount,
      returnPct: Number(returnPct.toFixed(2)),
      drawdownPct: Number(drawdownPct.toFixed(2)),
      profitFactor: Number(profitFactor.toFixed(2)),
      volatility: Number(volatility.toFixed(2)),
      score: Number(score.toFixed(2)),
      confidence,
    };
  }

  private clamp(value: number, min: number, max: number) {
    return Math.min(Math.max(value, min), max);
  }
}
