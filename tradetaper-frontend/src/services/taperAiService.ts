// src/services/taperAiService.ts
import { store } from '@/store/store';
import { DeskRun, DeskPersona } from '@/types/taperai';

const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'https://api.tradetaper.com/api/v1').trim();

const getAuthHeaders = () => {
  const token = store.getState().auth.token;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

const handle = async <T>(res: Response): Promise<T> => {
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      message = body.message || message;
    } catch {
      /* keep default */
    }
    throw new Error(message);
  }
  return res.json() as Promise<T>;
};

export const taperAiService = {
  async createRun(symbol: string, personas: DeskPersona[]): Promise<DeskRun> {
    const res = await fetch(`${API_URL}/taper-ai/desk/runs`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify({ symbol, personas }),
    });
    return handle<DeskRun>(res);
  },

  async listRuns(symbol?: string): Promise<DeskRun[]> {
    const qs = symbol ? `?symbol=${encodeURIComponent(symbol)}` : '';
    const res = await fetch(`${API_URL}/taper-ai/desk/runs${qs}`, {
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    return handle<DeskRun[]>(res);
  },

  async getRun(id: string): Promise<DeskRun> {
    const res = await fetch(`${API_URL}/taper-ai/desk/runs/${id}`, {
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    return handle<DeskRun>(res);
  },
};
