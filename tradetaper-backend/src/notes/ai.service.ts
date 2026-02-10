import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AIService {
  private readonly logger = new Logger(AIService.name);

  private geminiApiKey: string;
  private tempDir: string;

  constructor(private configService: ConfigService) {
    this.geminiApiKey =
      this.configService.get<string>('GEMINI_API_KEY') ||
      'AIzaSyBe259Ouem6qcI6SYOAzAcFE-A4ollIRqc';

    // Use the OS-provided temp directory in production (serverless environment)
    // and a local 'temp' directory for development.
    const isProduction = process.env.NODE_ENV === 'production';
    this.tempDir = isProduction
      ? os.tmpdir()
      : path.join(process.cwd(), 'temp');

    // Ensure temp directory exists
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }

  async speechToText(
    audioBuffer: Buffer,
    originalName: string,
  ): Promise<{
    transcript: string;
    confidence: number;
    language?: string;
  }> {
    try {
      // Save audio to temp file
      const tempFileName = `${uuidv4()}_${originalName}`;
      const tempFilePath = path.join(this.tempDir, tempFileName);
      fs.writeFileSync(tempFilePath, audioBuffer);

      try {
        // Convert audio to base64
        const audioBase64 = audioBuffer.toString('base64');

        // Prepare the request to Gemini API
        const requestBody = {
          contents: [
            {
              parts: [
                {
                  text: 'Please transcribe the following audio to text. Provide only the transcribed text without any additional formatting or explanations.',
                },
                {
                  inline_data: {
                    mime_type: this.getMimeType(originalName),
                    data: audioBase64,
                  },
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.1,
            topK: 32,
            topP: 1,
            maxOutputTokens: 4096,
          },
          safetySettings: [
            {
              category: 'HARM_CATEGORY_HARASSMENT',
              threshold: 'BLOCK_MEDIUM_AND_ABOVE',
            },
            {
              category: 'HARM_CATEGORY_HATE_SPEECH',
              threshold: 'BLOCK_MEDIUM_AND_ABOVE',
            },
            {
              category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
              threshold: 'BLOCK_MEDIUM_AND_ABOVE',
            },
            {
              category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
              threshold: 'BLOCK_MEDIUM_AND_ABOVE',
            },
          ],
        };

        // Make request to Gemini API
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.geminiApiKey}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
          },
        );

        if (!response.ok) {
          const errorData = await response.text();
          this.logger.error(`Gemini API error: ${errorData}`);
          throw new Error(`Gemini API error: ${response.status}`);
        }

        const result = await response.json();

        if (!result.candidates || result.candidates.length === 0) {
          throw new Error('No transcription candidates received');
        }

        const transcript = result.candidates[0].content.parts[0].text.trim();

        // Calculate confidence based on response quality
        const confidence = this.calculateConfidence(transcript, result);

        return {
          transcript,
          confidence,
          language: 'en', // Gemini doesn't return language detection yet
        };
      } finally {
        // Clean up temp file
        if (fs.existsSync(tempFilePath)) {
          fs.unlinkSync(tempFilePath);
        }
      }
    } catch (error) {
      this.logger.error('Speech-to-text error', error);
      throw new BadRequestException(
        'Failed to transcribe audio: ' + error.message,
      );
    }
  }

  async enhanceText(
    text: string,
    task: 'grammar' | 'clarity' | 'summarize' | 'expand',
  ): Promise<{
    enhancedText: string;
    suggestions: string[];
  }> {
    try {
      let prompt = '';

      switch (task) {
        case 'grammar':
          prompt = `Please correct any grammar, spelling, and punctuation errors in the following text. Return only the corrected text:\n\n${text}`;
          break;
        case 'clarity':
          prompt = `Please improve the clarity and readability of the following text while maintaining its original meaning. Return only the improved text:\n\n${text}`;
          break;
        case 'summarize':
          prompt = `Please create a concise summary of the following text. Return only the summary:\n\n${text}`;
          break;
        case 'expand':
          prompt = `Please expand on the following text with additional relevant details and context. Return only the expanded text:\n\n${text}`;
          break;
      }

      const requestBody = {
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.3,
          topK: 32,
          topP: 1,
          maxOutputTokens: 4096,
        },
      };

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.geminiApiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        },
      );

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const result = await response.json();

      if (!result.candidates || result.candidates.length === 0) {
        throw new Error('No enhancement candidates received');
      }

      const enhancedText = result.candidates[0].content.parts[0].text.trim();

      return {
        enhancedText,
        suggestions: [
          `Enhanced using ${task} optimization`,
          'AI-powered text improvement',
        ],
      };
    } catch (error) {
      this.logger.error('Text enhancement error', error);
      throw new BadRequestException('Failed to enhance text: ' + error.message);
    }
  }

  async generateNoteSuggestions(content: string): Promise<{
    tags: string[];
    title: string;
    relatedTopics: string[];
  }> {
    try {
      const prompt = `Analyze the following note content and provide:
1. 3-5 relevant tags (single words or short phrases)
2. A concise title (max 60 characters)
3. 3 related topics for further exploration

Content: ${content}

Please respond in JSON format:
{
  "tags": ["tag1", "tag2", "tag3"],
  "title": "Suggested Title",
  "relatedTopics": ["topic1", "topic2", "topic3"]
}`;

      const requestBody = {
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.4,
          topK: 32,
          topP: 1,
          maxOutputTokens: 1024,
        },
      };

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.geminiApiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        },
      );

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const result = await response.json();

      if (!result.candidates || result.candidates.length === 0) {
        throw new Error('No suggestions received');
      }

      const suggestionText = result.candidates[0].content.parts[0].text.trim();

      try {
        // Try to parse as JSON
        const jsonMatch = suggestionText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const suggestions = JSON.parse(jsonMatch[0]);
          return suggestions;
        }
      } catch (parseError) {
        this.logger.warn('Failed to parse JSON response, using fallback');
      }

      // Fallback parsing
      return {
        tags: ['general', 'note', 'important'],
        title: content.substring(0, 50) + (content.length > 50 ? '...' : ''),
        relatedTopics: [
          'Related Research',
          'Follow Up Tasks',
          'Additional Reading',
        ],
      };
    } catch (error) {
      this.logger.error('Note suggestions error', error);
      // Return default suggestions on error
      return {
        tags: ['note'],
        title: 'Untitled Note',
        relatedTopics: ['Research', 'Tasks'],
      };
    }
  }

  private getMimeType(filename: string): string {
    const ext = path.extname(filename).toLowerCase();
    const mimeTypes: { [key: string]: string } = {
      '.mp3': 'audio/mpeg',
      '.wav': 'audio/wav',
      '.m4a': 'audio/mp4',
      '.ogg': 'audio/ogg',
      '.webm': 'audio/webm',
      '.flac': 'audio/flac',
      '.aac': 'audio/aac',
    };

    return mimeTypes[ext] || 'audio/mpeg';
  }

  private calculateConfidence(transcript: string, geminiResponse: Record<string, unknown>): number {
    // Basic confidence calculation based on response characteristics
    let confidence = 0.8; // Base confidence

    // Adjust based on transcript length
    if (transcript.length > 10) confidence += 0.1;
    if (transcript.length > 50) confidence += 0.05;

    // Adjust based on presence of common words
    const commonWords = [
      'the',
      'and',
      'or',
      'but',
      'in',
      'on',
      'at',
      'to',
      'for',
      'of',
      'with',
      'by',
    ];
    const hasCommonWords = commonWords.some((word) =>
      transcript.toLowerCase().includes(word),
    );
    if (hasCommonWords) confidence += 0.05;

    // Cap at 1.0
    return Math.min(confidence, 1.0);
  }
}
