// src/notes/gemini-text-analysis.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';

@Injectable()
export class GeminiTextAnalysisService {
  private readonly logger = new Logger(GeminiTextAnalysisService.name);
  private readonly genAI: GoogleGenerativeAI;
  private readonly model: any; // GenerativeModel type

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (!apiKey) {
      this.logger.error('GEMINI_API_KEY is not set in environment variables.');
      throw new Error('GEMINI_API_KEY is not configured.');
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  }

  async analyzePsychologicalPatterns(noteText: string): Promise<string[]> {
    this.logger.log('Analyzing psychological patterns with Gemini Pro...');

    const prompt = `You are an expert trading psychologist. I will provide you with a trader's journal entry. Your task is to analyze the text and identify any of the following psychological patterns: "FOMO" (fear of missing out), "Revenge Trading", "Hesitation", "Overconfidence", "Lack of Discipline", "Anxiety", "Greed".\n\nDo not explain the patterns. Only return a JSON array of strings containing the patterns you identified. For example: ["FOMO", "Greed"]. If no specific patterns are found, return an empty array.\n\nHere is the journal entry:\n---\n${noteText}\n---`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = result.response;
      const text = response.text();
      this.logger.log(`Gemini Text Raw Response: ${text}`);

      // Attempt to parse JSON, handle cases where AI might not return perfect JSON
      try {
        const parsed = JSON.parse(text);
        if (
          Array.isArray(parsed) &&
          parsed.every((item) => typeof item === 'string')
        ) {
          return parsed;
        } else {
          this.logger.warn(
            `Gemini Text response was JSON but not a string array. Raw text: ${text}`,
          );
          return [];
        }
      } catch (jsonError) {
        this.logger.error(
          `Failed to parse Gemini Text response as JSON: ${jsonError.message}. Raw text: ${text}`,
        );
        // Fallback: if not perfect JSON, return empty array
        return [];
      }
    } catch (error) {
      this.logger.error(
        `Error calling Gemini Text API: ${error.message}`,
        error.stack,
      );
      throw new Error(`Failed to analyze note: ${error.message}`);
    }
  }
}
