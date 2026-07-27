// src/services/taperAiService.ts
import axios from 'axios';
import { store } from '@/store/store';
import { getStoredAccessToken } from '@/store/features/authSlice';
import { DeskRun, DeskPersona } from '@/types/taperai';

/**
 * TaperAI Desk API client.
 *
 * The Desk runs as its own Cloud Run service (taperai-desk), separate from
 * the main TradeTaper backend, so this client has its own base URL. Auth is
 * Bearer-token only (same JWT the main backend issues); no CSRF cookie flow.
 */
const TAPERAI_API_URL = (
  process.env.NEXT_PUBLIC_TAPERAI_API_URL ||
  'https://taperai-desk-326520250422.us-central1.run.app/api/v1'
).trim();

const client = axios.create({
  baseURL: TAPERAI_API_URL,
  headers: { 'Content-Type': 'application/json' },
});

client.interceptors.request.use((config) => {
  // Redux holds the token after login; sessionStorage covers reloads, where the
  // cookie restores the session but not the bearer token this service needs.
  const token = store.getState().auth.token || getStoredAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

client.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      error.message =
        'Your session expired for the Desk. Please sign in again to run analysis.';
    }
    return Promise.reject(error);
  },
);

export const taperAiService = {
  async createRun(symbol: string, personas: DeskPersona[]): Promise<DeskRun> {
    const { data } = await client.post<DeskRun>('/taper-ai/desk/runs', {
      symbol,
      personas,
    });
    return data;
  },

  async listRuns(symbol?: string): Promise<DeskRun[]> {
    const { data } = await client.get<DeskRun[]>('/taper-ai/desk/runs', {
      params: symbol ? { symbol } : undefined,
    });
    return data;
  },

  async getRun(id: string): Promise<DeskRun> {
    const { data } = await client.get<DeskRun>(`/taper-ai/desk/runs/${id}`);
    return data;
  },
};
