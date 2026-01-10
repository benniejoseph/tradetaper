// src/trades/services/trade-journal-sync.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Note, NoteContentBlock } from '../../notes/entities/note.entity';
import { Trade } from '../entities/trade.entity';
import { TradeDirection, TradeStatus, TradingSession } from '../../types/enums';

@Injectable()
export class TradeJournalSyncService {
  private readonly logger = new Logger(TradeJournalSyncService.name);

  constructor(
    @InjectRepository(Note)
    private readonly noteRepository: Repository<Note>,
    @InjectRepository(Trade)
    private readonly tradeRepository: Repository<Trade>,
  ) {}

  /**
   * Create a journal note for a trade
   * Called automatically when trades are imported from MT5
   */
  async createJournalForTrade(trade: Trade): Promise<Note> {
    this.logger.log(`Creating journal entry for trade ${trade.id} (${trade.symbol})`);

    // Generate title
    const sideLabel = trade.side === TradeDirection.LONG ? 'Long' : 'Short';
    const dateStr = trade.openTime.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    const title = `${trade.symbol} ${sideLabel} - ${dateStr}`;

    // Generate content blocks
    const content = this.generateJournalContent(trade);

    // Generate tags from trade properties
    const tags = this.generateTags(trade);

    // Create note
    const note = this.noteRepository.create({
      userId: trade.userId,
      accountId: trade.accountId,
      tradeId: trade.id,
      title,
      content,
      tags,
      chartImageUrl: trade.chartImageUrl,
      isPinned: false,
      visibility: 'private',
      wordCount: 0,
      readingTime: 0,
    });

    const savedNote = await this.noteRepository.save(note);
    this.logger.log(`Created journal note ${savedNote.id} for trade ${trade.id}`);

    return savedNote;
  }

  /**
   * Generate journal content blocks from trade data
   */
  private generateJournalContent(trade: Trade): NoteContentBlock[] {
    const blocks: NoteContentBlock[] = [];
    let position = 0;

    // Trade Summary Section
    blocks.push({
      id: `block-${position}`,
      type: 'heading',
      content: { text: '📊 Trade Summary', level: 2 },
      position: position++,
    });

    // Trade details - format numbers properly
    const pnlEmoji = (trade.profitOrLoss ?? 0) >= 0 ? '🟢' : '🔴';
    const pnlText = trade.profitOrLoss !== undefined 
      ? `${pnlEmoji} P&L: $${this.formatPrice(trade.profitOrLoss)}`
      : '⏳ Trade still open';

    const quantityFormatted = Number(trade.quantity).toFixed(2);
    const entryPriceFormatted = this.formatPrice(trade.openPrice);
    const exitPriceFormatted = trade.closePrice ? this.formatPrice(trade.closePrice) : null;

    blocks.push({
      id: `block-${position}`,
      type: 'callout',
      content: {
        type: trade.status === TradeStatus.CLOSED ? 'info' : 'warning',
        text: `**${trade.symbol}** | ${trade.side === TradeDirection.LONG ? 'Long 📈' : 'Short 📉'} | ${quantityFormatted} lots\n\n` +
          `Entry: ${entryPriceFormatted} at ${this.formatTime(trade.openTime)}\n` +
          (exitPriceFormatted ? `Exit: ${exitPriceFormatted} at ${this.formatTime(trade.closeTime)}\n` : '') +
          `\n${pnlText}`,
      },
      position: position++,
    });

    // Risk Management Section
    if (trade.stopLoss || trade.takeProfit) {
      blocks.push({
        id: `block-${position}`,
        type: 'heading',
        content: { text: '🛡️ Risk Management', level: 2 },
        position: position++,
      });

      let riskText = '';
      if (trade.stopLoss) riskText += `Stop Loss: ${trade.stopLoss}\n`;
      if (trade.takeProfit) riskText += `Take Profit: ${trade.takeProfit}\n`;
      if (trade.rMultiple) riskText += `R:R Achieved: ${trade.rMultiple}R`;

      blocks.push({
        id: `block-${position}`,
        type: 'text',
        content: { text: riskText.trim() },
        position: position++,
      });
    }

    // Setup Analysis Section (empty for user to fill)
    blocks.push({
      id: `block-${position}`,
      type: 'heading',
      content: { text: '📝 Setup Analysis', level: 2 },
      position: position++,
    });

    blocks.push({
      id: `block-${position}`,
      type: 'text',
      content: { 
        text: trade.setupDetails || 'Describe your trade setup here...\n\n- What signals did you see?\n- What was your entry trigger?\n- What timeframe confluence did you have?',
      },
      position: position++,
    });

    // ICT Concept Section (if applicable)
    if (trade.ictConcept) {
      blocks.push({
        id: `block-${position}`,
        type: 'heading',
        content: { text: '🎯 ICT Concepts Used', level: 2 },
        position: position++,
      });

      blocks.push({
        id: `block-${position}`,
        type: 'text',
        content: { text: `**Primary Concept:** ${trade.ictConcept}` },
        position: position++,
      });
    }

    // Session Analysis
    if (trade.session) {
      blocks.push({
        id: `block-${position}`,
        type: 'heading',
        content: { text: '🕐 Session Analysis', level: 2 },
        position: position++,
      });

      blocks.push({
        id: `block-${position}`,
        type: 'text',
        content: { text: `Traded during: **${trade.session}**` },
        position: position++,
      });
    }

    // Mistakes & Lessons Section
    blocks.push({
      id: `block-${position}`,
      type: 'heading',
      content: { text: '⚠️ Mistakes Made', level: 2 },
      position: position++,
    });

    blocks.push({
      id: `block-${position}`,
      type: 'text',
      content: { 
        text: trade.mistakesMade || 'List any mistakes you made...\n\n- Did you follow your rules?\n- Was your position size correct?\n- Did you manage the trade properly?',
      },
      position: position++,
    });

    blocks.push({
      id: `block-${position}`,
      type: 'heading',
      content: { text: '💡 Lessons Learned', level: 2 },
      position: position++,
    });

    blocks.push({
      id: `block-${position}`,
      type: 'text',
      content: { 
        text: trade.lessonsLearned || 'What did you learn from this trade?\n\n- What would you do differently?\n- What patterns should you remember?',
      },
      position: position++,
    });

    // Divider
    blocks.push({
      id: `block-${position}`,
      type: 'divider',
      content: {},
      position: position++,
    });

    // Footer note
    blocks.push({
      id: `block-${position}`,
      type: 'text',
      content: { 
        text: '_This journal was auto-created from your MT5 trade import. Edit it to add your analysis!_',
      },
      position: position++,
    });

    return blocks;
  }

  /**
   * Generate tags from trade properties
   */
  private generateTags(trade: Trade): string[] {
    const tags: string[] = [];

    // Symbol as tag
    tags.push(trade.symbol);

    // Direction
    tags.push(trade.side === TradeDirection.LONG ? 'long' : 'short');

    // Asset type
    tags.push(trade.assetType.toLowerCase());

    // Status
    if (trade.status === TradeStatus.CLOSED) {
      tags.push('closed');
      // Win/Loss tag
      if (trade.profitOrLoss !== undefined) {
        tags.push(trade.profitOrLoss >= 0 ? 'win' : 'loss');
      }
    } else {
      tags.push('open');
    }

    // ICT Concept
    if (trade.ictConcept) {
      tags.push(trade.ictConcept.toLowerCase().replace(/_/g, '-'));
    }

    // Session
    if (trade.session) {
      tags.push(trade.session.toLowerCase().replace(/_/g, '-'));
    }

    return tags;
  }

  /**
   * Format time for display
   */
  private formatTime(date?: Date): string {
    if (!date) return 'N/A';
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  /**
   * Format price for display with appropriate decimal places
   */
  private formatPrice(price: number | undefined | null): string {
    if (price === undefined || price === null) return 'N/A';
    const numPrice = Number(price);
    if (isNaN(numPrice)) return 'N/A';
    
    // Use 2 decimals for most prices, 5 for small values (forex pips)
    const decimals = Math.abs(numPrice) < 100 ? 5 : 2;
    return numPrice.toFixed(decimals);
  }

  /**
   * Create journals for multiple trades (batch)
   */
  async createJournalsForTrades(trades: Trade[]): Promise<Note[]> {
    this.logger.log(`Creating journal entries for ${trades.length} trades`);
    
    const notes: Note[] = [];
    for (const trade of trades) {
      try {
        const note = await this.createJournalForTrade(trade);
        notes.push(note);
      } catch (error) {
        this.logger.error(`Failed to create journal for trade ${trade.id}: ${error.message}`);
      }
    }

    this.logger.log(`Successfully created ${notes.length} journal entries`);
    return notes;
  }

  /**
   * Find trades without linked journal notes
   */
  async findTradesWithoutJournals(userId: string): Promise<Trade[]> {
    const tradesWithoutNotes = await this.tradeRepository
      .createQueryBuilder('trade')
      .leftJoin('notes', 'note', 'note.trade_id = trade.id')
      .where('trade.userId = :userId', { userId })
      .andWhere('note.id IS NULL')
      .getMany();

    return tradesWithoutNotes;
  }

  /**
   * Sync all trades - create journals for trades that don't have them
   */
  async syncTradesWithJournals(userId: string): Promise<{ created: number; total: number }> {
    const tradesWithoutNotes = await this.findTradesWithoutJournals(userId);
    
    if (tradesWithoutNotes.length === 0) {
      return { created: 0, total: 0 };
    }

    const notes = await this.createJournalsForTrades(tradesWithoutNotes);
    
    return { 
      created: notes.length, 
      total: tradesWithoutNotes.length,
    };
  }
}
