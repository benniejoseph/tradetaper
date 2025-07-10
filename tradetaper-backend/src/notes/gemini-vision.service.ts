
// src/notes/gemini-vision.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';

@Injectable()
export class GeminiVisionService {
  private readonly logger = new Logger(GeminiVisionService.name);
  private readonly genAI: GoogleGenerativeAI;
  private readonly model: any; // GenerativeModel type

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (!apiKey) {
      this.logger.error('GEMINI_API_KEY is not set in environment variables.');
      throw new Error('GEMINI_API_KEY is not configured.');
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: "gemini-pro-vision" });
  }

  async analyzeChartImage(imageBuffer: Buffer): Promise<any> {
    this.logger.log('Analyzing chart image with Gemini Pro Vision...');

    const base64Image = imageBuffer.toString('base64');

    const prompt = `You are an expert trading chart analyst. Analyze this image to identify the asset symbol, trade direction (Long/Short), entry price, exit price, stop loss, and take profit levels. The entry is usually marked by a solid line or arrow, the exit by another, stop loss by "SL", and take profit by "TP". Provide the output in a clean JSON format with the keys: "symbol", "direction", "entryPrice", "exitPrice", "stopLoss", "takeProfit". If a value is not found, omit the key.`;

    const parts = [
      { text: prompt },
      { inlineData: { mimeType: "image/jpeg", data: base64Image } },
    ];

    try {
      const result = await this.model.generateContent({ contents: [{ parts }] });
      const response = result.response;
      const text = response.text();
      this.logger.log(`Gemini Vision Raw Response: ${text}`);

      // Attempt to parse JSON, handle cases where AI might not return perfect JSON
      try {
        const parsed = JSON.parse(text);
        return parsed;
      } catch (jsonError) {
        this.logger.error(`Failed to parse Gemini Vision response as JSON: ${jsonError.message}. Raw text: ${text}`);
        // Fallback: try to extract key-value pairs if not perfect JSON
        const extractedData: any = {};
        const regex = /"(symbol|direction|entryPrice|exitPrice|stopLoss|takeProfit)":\s*"?([^",]+)"?/g;
        let match;
        while ((match = regex.exec(text)) !== null) {
          extractedData[match[1]] = match[2];
        }
        return extractedData;
      }
    } catch (error) {
      this.logger.error(`Error calling Gemini Vision API: ${error.message}`, error.stack);
      throw new Error(`Failed to analyze chart: ${error.message}`);
    }
  }
}
