// src/services/taperAiService.ts
import authApiClient from './api';
import { DeskRun, DeskPersona } from '@/types/taperai';

/**
 * TaperAI Desk API client. Uses the shared authenticated axios instance so
 * Bearer token and CSRF token handling are applied automatically.
 */
export const taperAiService = {
  async createRun(symbol: string, personas: DeskPersona[]): Promise<DeskRun> {
    const { data } = await authApiClient.post<DeskRun>('/taper-ai/desk/runs', {
      symbol,
      personas,
    });
    return data;
  },

  async listRuns(symbol?: string): Promise<DeskRun[]> {
    const { data } = await authApiClient.get<DeskRun[]>('/taper-ai/desk/runs', {
      params: symbol ? { symbol } : undefined,
    });
    return data;
  },

  async getRun(id: string): Promise<DeskRun> {
    const { data } = await authApiClient.get<DeskRun>(
      `/taper-ai/desk/runs/${id}`,
    );
    return data;
  },
};
