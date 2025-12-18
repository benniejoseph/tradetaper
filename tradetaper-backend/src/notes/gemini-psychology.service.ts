import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';

@Injectable()
export class GeminiPsychologyService {
  private readonly logger = new Logger(GeminiPsychologyService.name);
  private geminiPro: any; // Using 'any' for now due to potential type complexities with the SDK

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (!apiKey) {
      this.logger.error('GEMINI_API_KEY is not configured.');
      throw new Error('GEMINI_API_KEY is not configured.');
    }
    const genAI = new GoogleGenerativeAI(apiKey);
    this.geminiPro = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  }

  async analyzePsychologicalPatterns(text: string): Promise<any[]> {
    const prompt = `Analyze the following trade journal entry for psychological patterns and emotional states. Identify instances of revenge trading, fear of missing out (FOMO), overtrading, or hesitation. For each identified pattern, provide a brief explanation, the exact text snippet that indicates the pattern, and a confidence score (0-1). Also, assess the overall sentiment of the entry. Return the output as a JSON array of objects, where each object represents an insight.

Example Output Format:
[
  {
    "insightType": "Revenge Trading",
    "sentiment": "anger",
    "confidenceScore": 0.95,
    "extractedText": "I immediately jumped back in with double the size, feeling angry and determined to get my money back."
  },
  {
    "insightType": "Overall Sentiment",
    "sentiment": "negative",
    "confidenceScore": 0.80,
    "extractedText": "After losing big on EURUSD, I immediately jumped back in with double the size, feeling angry and determined to get my money back. It was a clear revenge trade."
  }
]

Trade Journal Entry: ${text}
`;

    try {
      const result = await this.geminiPro.generateContent(prompt);
      const response = await result.response;
      const geminiText = response.text();

      // Attempt to parse the response as JSON
      try {
        const parsed = JSON.parse(geminiText);
        if (
          Array.isArray(parsed) &&
          parsed.every((item) => typeof item === 'object' && item !== null)
        ) {
          return parsed;
        } else {
          this.logger.warn(
            `Gemini response was JSON but not an array of objects. Raw text: ${geminiText}`,
          );
          return [
            {
              insightType: 'Parsing Error',
              sentiment: 'neutral',
              confidenceScore: 0.1,
              extractedText: geminiText,
              rawGeminiResponse: geminiText,
            },
          ];
        }
      } catch (jsonError) {
        this.logger.error(
          `Failed to parse Gemini response as JSON: ${jsonError.message}. Raw text: ${geminiText}`,
        );
        return [
          {
            insightType: 'Parsing Error',
            sentiment: 'neutral',
            confidenceScore: 0.1,
            extractedText: geminiText,
            rawGeminiResponse: geminiText,
          },
        ];
      }
    } catch (error) {
      this.logger.error(
        `Error calling Gemini Psychology API: ${error.message}`,
        error.stack,
      );
      throw new Error(`Failed to get psychological insights: ${error.message}`);
    }
  }
}
