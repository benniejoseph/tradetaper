import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MarketLog } from '../entities/market-log.entity';

/**
 * TagService handles tag normalization, alias resolution, and autocomplete.
 * 
 * Features:
 * - Normalize tags to lowercase with underscores
 * - Map common aliases (e.g., "OB" → "order_block")
 * - Suggest tags from user history and common ICT concepts
 */
@Injectable()
export class TagService {
  // Common ICT/trading tag aliases
  private readonly aliases: Record<string, string> = {
    // Order Blocks
    'ob': 'order_block',
    'orderblock': 'order_block',
    'order block': 'order_block',
    
    // Fair Value Gaps
    'fvg': 'fair_value_gap',
    'fair value gap': 'fair_value_gap',
    'imbalance': 'fair_value_gap',
    
    // Market Structure
    'choch': 'change_of_character',
    'cho ch': 'change_of_character',
    'bos': 'break_of_structure',
    'break of structure': 'break_of_structure',
    'mss': 'market_structure_shift',
    
    // Liquidity
    'sweep': 'liquidity_sweep',
    'liquidity sweep': 'liquidity_sweep',
    'stop hunt': 'liquidity_sweep',
    'raid': 'liquidity_raid',
    'grab': 'liquidity_grab',
    
    // ICT Concepts
    'amd': 'accumulation_manipulation_distribution',
    'po3': 'power_of_three',
    'pot': 'power_of_three',
    'silver bullet': 'silver_bullet',
    'silverbullet': 'silver_bullet',
    'judas swing': 'judas_swing',
    'judas': 'judas_swing',
    
    // Sessions
    'asia': 'asia_session',
    'asian session': 'asia_session',
    'london': 'london_session',
    'london session': 'london_session',
    'ny': 'new_york_session',
    'new york': 'new_york_session',
    'nyam': 'new_york_am',
    'nypm': 'new_york_pm',
    
    // Key Levels
    'asia high': 'asia_high',
    'asia low': 'asia_low',
    'pdh': 'previous_day_high',
    'pdl': 'previous_day_low',
    'pwh': 'previous_week_high',
    'pwl': 'previous_week_low',
    'eqh': 'equal_highs',
    'eql': 'equal_lows',
    
    // Patterns
    'breaker': 'breaker_block',
    'breaker block': 'breaker_block',
    'mitigation': 'mitigation_block',
    'rejection block': 'rejection_block',
    'propulsion block': 'propulsion_block',
  };

  // Common ICT tags for suggestions
  private readonly commonTags: string[] = [
    'order_block', 'fair_value_gap', 'liquidity_sweep', 'break_of_structure',
    'change_of_character', 'market_structure_shift', 'power_of_three',
    'accumulation_manipulation_distribution', 'silver_bullet', 'judas_swing',
    'asia_high', 'asia_low', 'london_session', 'new_york_session',
    'previous_day_high', 'previous_day_low', 'equal_highs', 'equal_lows',
    'breaker_block', 'mitigation_block', 'displacement', 'expansion',
    'retracement', 'reversal', 'consolidation', 'news_event', 'high_impact',
  ];

  constructor(
    @InjectRepository(MarketLog)
    private marketLogRepository: Repository<MarketLog>,
  ) {}

  /**
   * Normalize a single tag: lowercase, replace spaces with underscores, resolve aliases
   */
  normalize(tag: string): string {
    const cleaned = tag.toLowerCase().trim().replace(/\s+/g, '_');
    return this.aliases[cleaned] || this.aliases[tag.toLowerCase().trim()] || cleaned;
  }

  /**
   * Normalize an array of tags
   */
  normalizeAll(tags: string[]): string[] {
    if (!tags || !Array.isArray(tags)) return [];
    const normalized = tags.map(t => this.normalize(t));
    return [...new Set(normalized)]; // Remove duplicates
  }

  /**
   * Get tag suggestions based on prefix and user history
   */
  async getSuggestions(userId: string, prefix: string): Promise<string[]> {
    const normalizedPrefix = prefix.toLowerCase().trim();
    
    // Get user's existing tags
    const userLogs = await this.marketLogRepository.find({
      where: { userId },
      select: ['tags'],
    });
    
    const userTags = new Set<string>();
    userLogs.forEach(log => {
      if (log.tags && Array.isArray(log.tags)) {
        log.tags.forEach(tag => userTags.add(tag.toLowerCase()));
      }
    });

    // Combine user tags with common tags
    const allTags = [...userTags, ...this.commonTags];
    
    // Filter by prefix and remove duplicates
    const suggestions = [...new Set(allTags)]
      .filter(tag => tag.startsWith(normalizedPrefix))
      .slice(0, 10); // Limit to 10 suggestions

    return suggestions;
  }

  /**
   * Check if a similar log exists (same symbol, date, overlapping tags)
   */
  async checkDuplicate(
    userId: string,
    symbol: string,
    tradeDate: string,
    tags: string[],
  ): Promise<{ isDuplicate: boolean; similarLogs: MarketLog[] }> {
    const normalizedTags = this.normalizeAll(tags);
    
    const existingLogs = await this.marketLogRepository.find({
      where: {
        userId,
        symbol,
        tradeDate: new Date(tradeDate),
      },
    });

    const similarLogs = existingLogs.filter(log => {
      if (!log.tags || log.tags.length === 0) return false;
      const logTags = new Set(log.tags.map(t => t.toLowerCase()));
      const overlap = normalizedTags.filter(t => logTags.has(t));
      return overlap.length >= 2; // At least 2 tags in common
    });

    return {
      isDuplicate: similarLogs.length > 0,
      similarLogs,
    };
  }
}
