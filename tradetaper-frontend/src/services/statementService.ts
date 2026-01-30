// src/services/statementService.ts
import { authApiClient } from './api';

export interface StatementUploadResponse {
  id: string;
  fileName: string;
  fileType: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  tradesImported: number;
  tradesSkipped: number;
  errorMessage?: string;
  createdAt: string;
  processedAt?: string;
}

export const statementService = {
  /**
   * Upload a statement file for parsing
   */
  async uploadStatement(
    file: File,
    accountId?: string
  ): Promise<StatementUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const params = accountId ? `?accountId=${accountId}` : '';
    
    const response = await authApiClient.post<StatementUploadResponse>(
      `/statement-upload${params}`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    
    return response.data;
  },

  /**
   * Get upload history
   */
  async getUploadHistory(): Promise<StatementUploadResponse[]> {
    const response = await authApiClient.get<StatementUploadResponse[]>(
      '/statement-upload/history'
    );
    return response.data;
  },
};
