import { AIService } from './ai.service';
export declare class AIController {
    private readonly aiService;
    constructor(aiService: AIService);
    speechToText(file: Express.Multer.File): Promise<{
        transcript: string;
        confidence: number;
        language?: string;
    }>;
    enhanceText(body: {
        text: string;
        task: 'grammar' | 'clarity' | 'summarize' | 'expand';
    }): Promise<{
        enhancedText: string;
        suggestions: string[];
    }>;
    generateNoteSuggestions(body: {
        content: string;
    }): Promise<{
        tags: string[];
        title: string;
        relatedTopics: string[];
    }>;
}
