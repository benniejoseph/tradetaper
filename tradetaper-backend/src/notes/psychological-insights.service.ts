import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { PsychologicalInsight } from './entities/psychological-insight.entity';
import { Note } from './entities/note.entity';
import { GeminiPsychologyService } from './gemini-psychology.service';

@Injectable()
export class PsychologicalInsightsService {
  private readonly logger = new Logger(PsychologicalInsightsService.name);
  private static readonly DEFAULT_PROFILE_LIMIT = 100;
  private static readonly MAX_PROFILE_LIMIT = 200;

  constructor(
    @InjectRepository(PsychologicalInsight)
    private psychologicalInsightRepository: Repository<PsychologicalInsight>,
    @InjectRepository(Note)
    private noteRepository: Repository<Note>,
    private geminiPsychologyService: GeminiPsychologyService,
  ) {}

  async analyzeAndSavePsychologicalInsights(
    noteId: string,
    userId: string,
  ): Promise<PsychologicalInsight[]> {
    const note = await this.noteRepository.findOne({
      where: { id: noteId, userId: userId },
    });

    if (!note) {
      this.logger.warn(`Note with ID ${noteId} not found for user ${userId}`);
      return [];
    }

    // Combine relevant text content from the note for analysis
    const noteText = note.content
      .filter(
        (block) =>
          block.type === 'text' ||
          block.type === 'heading' ||
          block.type === 'quote',
      )
      .map((block) => block.content?.text)
      .join('\n');

    if (!noteText.trim()) {
      this.logger.log(
        `Note ${noteId} has no text content for psychological analysis.`,
      );
      return [];
    }

    try {
      this.logger.log(`Analyzing psychological insights for note ${noteId}...`);
      const insights =
        await this.geminiPsychologyService.analyzePsychologicalPatterns(
          noteText,
        );

      const savedInsights: PsychologicalInsight[] = [];
      for (const insight of insights) {
        const newInsight = this.psychologicalInsightRepository.create({
          userId: userId,
          noteId: noteId,
          insightType: insight.insightType,
          sentiment: insight.sentiment || null,
          confidenceScore: insight.confidenceScore || null,
          extractedText: insight.extractedText || null,
          rawGeminiResponse: insight.rawGeminiResponse || null,
        });
        savedInsights.push(
          await this.psychologicalInsightRepository.save(newInsight),
        );
      }

      this.logger.log(
        `Saved ${savedInsights.length} psychological insights for note ${noteId}.`,
      );
      return savedInsights;
    } catch (error) {
      this.logger.error(
        `Failed to analyze psychological insights for note ${noteId}: ${error.message}`,
        error.stack,
      );
      throw error; // Re-throw to propagate the error
    }
  }

  async getPsychologicalProfile(
    userId: string,
    startDate?: Date,
    endDate?: Date,
    accountId?: string,
    limit?: number,
    offset?: number,
  ): Promise<PsychologicalInsight[]> {
    const boundedLimit = this.normalizeLimit(limit);
    const boundedOffset = this.normalizeOffset(offset);
    const query = this.buildProfileQuery(userId, startDate, endDate, accountId)
      .orderBy('insight.analysisDate', 'DESC')
      .addOrderBy('insight.id', 'DESC')
      .take(boundedLimit)
      .skip(boundedOffset);

    return query.getMany();
  }

  async getInsightsForNote(
    noteId: string,
    userId: string,
    startDate?: Date,
    endDate?: Date,
    limit?: number,
    offset?: number,
  ): Promise<PsychologicalInsight[]> {
    const noteExists = await this.noteRepository.exist({
      where: { id: noteId, userId },
    });
    if (!noteExists) {
      return [];
    }

    const boundedLimit = this.normalizeLimit(limit);
    const boundedOffset = this.normalizeOffset(offset);

    const query = this.psychologicalInsightRepository
      .createQueryBuilder('insight')
      .where('insight.userId = :userId', { userId })
      .andWhere('insight.noteId = :noteId', { noteId })
      .orderBy('insight.analysisDate', 'DESC')
      .addOrderBy('insight.id', 'DESC')
      .take(boundedLimit)
      .skip(boundedOffset);

    if (startDate) {
      query.andWhere('insight.analysisDate >= :startDate', { startDate });
    }
    if (endDate) {
      query.andWhere('insight.analysisDate <= :endDate', { endDate });
    }

    return query.getMany();
  }

  async getPsychologicalSummary(
    userId: string,
    startDate?: Date,
    endDate?: Date,
    accountId?: string,
  ): Promise<{
    totalInsights: number;
    insightTypeCounts: Record<string, number>;
    sentimentCounts: Record<string, number>;
    averageConfidence: number;
  }> {
    const baseQuery = this.buildProfileQuery(
      userId,
      startDate,
      endDate,
      accountId,
    );

    const [totalRow, confidenceRow, insightTypeRows, sentimentRows] =
      await Promise.all([
        baseQuery.clone().select('COUNT(*)', 'count').getRawOne<{ count: string }>(),
        baseQuery
          .clone()
          .select('COALESCE(AVG(insight.confidenceScore), 0)', 'average')
          .getRawOne<{ average: string }>(),
        baseQuery
          .clone()
          .select('insight.insightType', 'name')
          .addSelect('COUNT(*)', 'count')
          .groupBy('insight.insightType')
          .getRawMany<{ name: string; count: string }>(),
        baseQuery
          .clone()
          .andWhere('insight.sentiment IS NOT NULL')
          .select('insight.sentiment', 'name')
          .addSelect('COUNT(*)', 'count')
          .groupBy('insight.sentiment')
          .getRawMany<{ name: string; count: string }>(),
      ]);

    const insightTypeCounts = insightTypeRows.reduce<Record<string, number>>(
      (acc, row) => {
        if (!row.name) return acc;
        acc[row.name] = Number(row.count) || 0;
        return acc;
      },
      {},
    );

    const sentimentCounts = sentimentRows.reduce<Record<string, number>>(
      (acc, row) => {
        if (!row.name) return acc;
        acc[row.name] = Number(row.count) || 0;
        return acc;
      },
      {},
    );

    return {
      totalInsights: Number(totalRow?.count) || 0,
      insightTypeCounts,
      sentimentCounts,
      averageConfidence: Number(confidenceRow?.average) || 0,
    };
  }

  private buildProfileQuery(
    userId: string,
    startDate?: Date,
    endDate?: Date,
    accountId?: string,
  ): SelectQueryBuilder<PsychologicalInsight> {
    const query = this.psychologicalInsightRepository
      .createQueryBuilder('insight')
      .where('insight.userId = :userId', { userId });

    if (startDate) {
      query.andWhere('insight.analysisDate >= :startDate', { startDate });
    }
    if (endDate) {
      query.andWhere('insight.analysisDate <= :endDate', { endDate });
    }

    const normalizedAccountId = accountId?.trim();
    if (normalizedAccountId) {
      query
        .leftJoin('insight.note', 'note')
        .andWhere(
          '(note.accountId = :accountId OR note.mt5AccountId = :accountId)',
          { accountId: normalizedAccountId },
        );
    }

    return query;
  }

  private normalizeLimit(limit?: number): number {
    if (typeof limit !== 'number' || !Number.isFinite(limit)) {
      return PsychologicalInsightsService.DEFAULT_PROFILE_LIMIT;
    }
    return Math.min(
      Math.max(Math.floor(limit), 1),
      PsychologicalInsightsService.MAX_PROFILE_LIMIT,
    );
  }

  private normalizeOffset(offset?: number): number {
    if (typeof offset !== 'number' || !Number.isFinite(offset)) {
      return 0;
    }
    return Math.max(Math.floor(offset), 0);
  }
}
