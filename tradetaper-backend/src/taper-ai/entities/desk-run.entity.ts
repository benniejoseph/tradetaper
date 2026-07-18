// src/taper-ai/entities/desk-run.entity.ts
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export type DeskRunStatus = 'pending' | 'running' | 'completed' | 'failed';

export type DeskDirection = 'long' | 'short' | 'neutral';

/**
 * A single "Desk run": one full multi-agent research pipeline execution
 * for one symbol. Stores every intermediate stage (analyst reports,
 * bull/bear debate, persona opinions) so the UI can render the full
 * debate transcript — explainability is the product.
 */
@Entity('taper_ai_desk_runs')
export class DeskRun {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column('uuid')
  userId: string;

  @Index()
  @Column({ length: 32 })
  symbol: string;

  @Column({ length: 16, default: 'pending' })
  status: DeskRunStatus;

  /** Persona agents requested for this run (e.g. buffett, burry, wood) */
  @Column('simple-array', { default: '' })
  personas: string[];

  /**
   * Full pipeline output, keyed by stage:
   * { analysts: {...}, debate: [...], personaOpinions: {...},
   *   trader: {...}, risk: {...}, portfolioManager: {...} }
   */
  @Column('jsonb', { nullable: true })
  stages?: Record<string, any>;

  /** Final structured verdict (Thesis Card payload) */
  @Column('jsonb', { nullable: true })
  verdict?: {
    direction: DeskDirection;
    conviction: number; // 0-100
    horizon: string;
    thesis: string;
    entry?: string;
    exit?: string;
    invalidation: string;
    dissent?: string;
  };

  @Column({ length: 8, nullable: true })
  direction?: DeskDirection;

  @Column('int', { nullable: true })
  conviction?: number;

  @Column('text', { nullable: true })
  error?: string;

  @Column('int', { default: 0 })
  totalTokens: number;

  @Column('numeric', { precision: 10, scale: 6, default: 0 })
  totalCostUsd: number;

  @Column('int', { nullable: true })
  durationMs?: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  completedAt?: Date;
}
