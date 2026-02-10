import { ConfigService } from '@nestjs/config';
export declare class AIService {
    private configService;
    private readonly logger;
    private geminiApiKey;
    private tempDir;
    constructor(configService: ConfigService);
    speechToText(audioBuffer: Buffer, originalName: string): Promise<{
        transcript: string;
        confidence: number;
        language?: string;
    }>;
    enhanceText(text: string, task: 'grammar' | 'clarity' | 'summarize' | 'expand'): Promise<{
        enhancedText: string;
        suggestions: string[];
    }>;
    generateNoteSuggestions(content: string): Promise<{
        tags: string[];
        title: string;
        relatedTopics: string[];
    }>;
    private getMimeType;
    private calculateConfidence;
}
