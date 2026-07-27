// src/services/taperAiService.ts
import axios from 'axios';
import { DeskRun, DeskPersona } from '@/types/taperai';

/**
 * TaperAI Desk API client.
 *
 * Calls go to a same-origin Next.js route (/api/desk/*) which attaches the
 * bearer token server-side from the httpOnly auth_token cookie and forwards to
 * the standalone Desk service. The browser never handles the JWT, and the Desk
 * keeps working across reloads and tabs — unlike a token held only in Redux,
 * which is empty after every page load.
 */
const client = axios.create({
  baseURL: '/api/desk',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

client.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      error.message = 'Your session has expired. Please sign in again.';
    }
    return Promise.reject(error);
  },
);

export const taperAiService = {
  async createRun(symbol: string, personas: DeskPersona[]): Promise<DeskRun> {
    const { data } = await client.post<DeskRun>('/runs', {
      symbol,
      personas,
    });
    return data;
  },

  async listRuns(symbol?: string): Promise<DeskRun[]> {
    const { data } = await client.get<DeskRun[]>('/runs', {
      params: symbol ? { symbol } : undefined,
    });
    return data;
  },

  async getRun(id: string): Promise<DeskRun> {
    const { data } = await client.get<DeskRun>(`/runs/${id}`);
    return data;
  },
};
