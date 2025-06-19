import { authApiClient } from './api';
import { 
  Note, 
  CreateNoteRequest, 
  UpdateNoteRequest, 
  NotesResponse, 
  SearchNotesParams, 
  NotesStats, 
  CalendarNote,
  SpeechToTextResponse 
} from '@/types/note';

export class NotesService {
  /**
   * Create a new note
   */
  static async createNote(noteData: CreateNoteRequest): Promise<Note> {
    const response = await authApiClient.post('/notes', noteData);
    return response.data;
  }

  /**
   * Get all notes with optional search and filtering
   */
  static async getNotes(params: SearchNotesParams = {}): Promise<NotesResponse> {
    const searchParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          value.forEach(item => searchParams.append(key, item.toString()));
        } else {
          searchParams.append(key, value.toString());
        }
      }
    });

    const response = await authApiClient.get(`/notes?${searchParams.toString()}`);
    return response.data;
  }

  /**
   * Get a single note by ID
   */
  static async getNote(id: string): Promise<Note> {
    const response = await authApiClient.get(`/notes/${id}`);
    return response.data;
  }

  /**
   * Update a note
   */
  static async updateNote(id: string, noteData: UpdateNoteRequest): Promise<Note> {
    const response = await authApiClient.patch(`/notes/${id}`, noteData);
    return response.data;
  }

  /**
   * Delete a note
   */
  static async deleteNote(id: string): Promise<void> {
    await authApiClient.delete(`/notes/${id}`);
  }

  /**
   * Toggle pin status of a note
   */
  static async togglePin(id: string): Promise<Note> {
    const response = await authApiClient.patch(`/notes/${id}/toggle-pin`);
    return response.data;
  }

  /**
   * Get notes statistics
   */
  static async getStats(): Promise<NotesStats> {
    const response = await authApiClient.get('/notes/stats');
    return response.data;
  }

  /**
   * Get all available tags
   */
  static async getTags(): Promise<string[]> {
    const response = await authApiClient.get('/notes/tags');
    return response.data;
  }

  /**
   * Get notes for a specific calendar month
   */
  static async getCalendarNotes(year: number, month: number): Promise<CalendarNote[]> {
    const response = await authApiClient.get(`/notes/calendar/${year}/${month}`);
    return response.data;
  }

  /**
   * Upload file/media for a note
   */
  static async uploadMedia(file: File, noteId?: string): Promise<{ url: string; filename: string }> {
    const formData = new FormData();
    formData.append('file', file);
    if (noteId) {
      formData.append('noteId', noteId);
    }

    const response = await authApiClient.post('/notes/media/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  /**
   * Convert speech to text using Gemini API
   */
  static async speechToText(audioBlob: Blob): Promise<SpeechToTextResponse> {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.webm');

    const response = await authApiClient.post('/notes/speech-to-text', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  /**
   * Search notes with full-text search
   */
  static async searchNotes(query: string, options: Omit<SearchNotesParams, 'search'> = {}): Promise<NotesResponse> {
    return this.getNotes({
      ...options,
      search: query,
    });
  }

  /**
   * Get recent notes
   */
  static async getRecentNotes(limit: number = 10): Promise<Note[]> {
    const response = await this.getNotes({
      sortBy: 'updatedAt',
      sortOrder: 'DESC',
      limit,
    });
    return response.notes;
  }

  /**
   * Get pinned notes
   */
  static async getPinnedNotes(): Promise<Note[]> {
    const response = await this.getNotes({
      pinnedOnly: true,
      sortBy: 'updatedAt',
      sortOrder: 'DESC',
    });
    return response.notes;
  }

  /**
   * Get notes with media
   */
  static async getNotesWithMedia(limit: number = 20): Promise<NotesResponse> {
    return this.getNotes({
      hasMedia: true,
      sortBy: 'updatedAt',
      sortOrder: 'DESC',
      limit,
    });
  }

  /**
   * Get notes by tag
   */
  static async getNotesByTag(tag: string, limit: number = 20): Promise<NotesResponse> {
    return this.getNotes({
      tags: [tag],
      sortBy: 'updatedAt',
      sortOrder: 'DESC',
      limit,
    });
  }

  /**
   * Get notes for a specific account
   */
  static async getNotesByAccount(accountId: string): Promise<NotesResponse> {
    return this.getNotes({
      accountId,
      sortBy: 'updatedAt',
      sortOrder: 'DESC',
    });
  }

  /**
   * Get notes for a specific trade
   */
  static async getNotesByTrade(tradeId: string): Promise<NotesResponse> {
    return this.getNotes({
      tradeId,
      sortBy: 'createdAt',
      sortOrder: 'ASC',
    });
  }

  /**
   * Export notes to various formats
   */
  static async exportNotes(format: 'json' | 'csv' | 'markdown', params: SearchNotesParams = {}): Promise<Blob> {
    const searchParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          value.forEach(item => searchParams.append(key, item.toString()));
        } else {
          searchParams.append(key, value.toString());
        }
      }
    });

    searchParams.append('format', format);

    const response = await authApiClient.get(`/notes/export?${searchParams.toString()}`, {
      responseType: 'blob',
    });
    
    return response.data;
  }

  /**
   * Duplicate a note
   */
  static async duplicateNote(id: string): Promise<Note> {
    const response = await authApiClient.post(`/notes/${id}/duplicate`);
    return response.data;
  }

  /**
   * Get note templates
   */
  static async getTemplates(): Promise<Note[]> {
    const response = await authApiClient.get('/notes/templates');
    return response.data;
  }

  /**
   * Create note from template
   */
  static async createFromTemplate(templateId: string, title: string): Promise<Note> {
    const response = await authApiClient.post(`/notes/templates/${templateId}/create`, {
      title,
    });
    return response.data;
  }

  // Calendar methods
  static async getNotesForDate(date: string): Promise<Note[]> {
    const response = await authApiClient.get(`/notes/calendar/date/${date}`);
    return response.data;
  }

  static async getCalendarStats(year: number, month: number): Promise<any> {
    const response = await authApiClient.get(`/notes/calendar/${year}/${month}/stats`);
    return response.data;
  }

  // Media methods
  static async getMediaUrl(mediaId: string): Promise<string> {
    const response = await authApiClient.get(`/notes/media/${mediaId}/url`);
    return response.data.url;
  }

  static async deleteMedia(mediaId: string): Promise<void> {
    await authApiClient.delete(`/notes/media/${mediaId}`);
  }

  static async generateEmbedData(url: string): Promise<any> {
    const response = await authApiClient.post('/notes/media/embed', { url });
    return response.data;
  }

  // AI methods
  static async enhanceText(text: string, task: 'grammar' | 'clarity' | 'summarize' | 'expand'): Promise<{
    enhancedText: string;
    suggestions: string[];
  }> {
    const response = await authApiClient.post('/notes/ai/enhance-text', { text, task });
    return response.data;
  }

  static async generateNoteSuggestions(content: string): Promise<{
    tags: string[];
    title: string;
    relatedTopics: string[];
  }> {
    const response = await authApiClient.post('/notes/ai/generate-suggestions', { content });
    return response.data;
  }

  // Additional utility methods
  static async exportNote(noteId: string, format: 'pdf' | 'markdown' | 'json'): Promise<Blob> {
    const response = await authApiClient.get(`/notes/${noteId}/export/${format}`, {
      responseType: 'blob',
    });
    return response.data;
  }

  // Bulk operations
  static async bulkDelete(noteIds: string[]): Promise<void> {
    await authApiClient.post('/notes/bulk/delete', { noteIds });
  }

  static async bulkUpdateTags(noteIds: string[], tags: string[]): Promise<void> {
    await authApiClient.post('/notes/bulk/tags', { noteIds, tags });
  }

  static async bulkUpdateVisibility(noteIds: string[], visibility: 'private' | 'shared'): Promise<void> {
    await authApiClient.post('/notes/bulk/visibility', { noteIds, visibility });
  }
}

export const notesService = NotesService; 