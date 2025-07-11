
// src/services/notesApi.ts
import { authApiClient } from './api';

/**
 * Requests AI analysis for a specific note.
 * @param noteId The ID of the note to analyze.
 * @returns A promise that resolves to an array of psychological tags.
 */
export const analyzeNote = async (noteId: string): Promise<string[]> => {
  // This endpoint does not exist yet and will fail until the L3A1 backend work is complete.
  const response = await authApiClient.post<string[]>(`/notes/${noteId}/analyze`);
  return response.data;
};
