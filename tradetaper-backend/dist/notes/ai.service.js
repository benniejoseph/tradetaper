"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var AIService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const fs = __importStar(require("fs"));
const os = __importStar(require("os"));
const path = __importStar(require("path"));
const uuid_1 = require("uuid");
let AIService = AIService_1 = class AIService {
    configService;
    logger = new common_1.Logger(AIService_1.name);
    geminiApiKey;
    tempDir;
    constructor(configService) {
        this.configService = configService;
        this.geminiApiKey =
            this.configService.get('GEMINI_API_KEY') ||
                'AIzaSyBe259Ouem6qcI6SYOAzAcFE-A4ollIRqc';
        const isProduction = process.env.NODE_ENV === 'production';
        this.tempDir = isProduction
            ? os.tmpdir()
            : path.join(process.cwd(), 'temp');
        if (!fs.existsSync(this.tempDir)) {
            fs.mkdirSync(this.tempDir, { recursive: true });
        }
    }
    async speechToText(audioBuffer, originalName) {
        try {
            const tempFileName = `${(0, uuid_1.v4)()}_${originalName}`;
            const tempFilePath = path.join(this.tempDir, tempFileName);
            fs.writeFileSync(tempFilePath, audioBuffer);
            try {
                const audioBase64 = audioBuffer.toString('base64');
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
                const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.geminiApiKey}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(requestBody),
                });
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
                const confidence = this.calculateConfidence(transcript, result);
                return {
                    transcript,
                    confidence,
                    language: 'en',
                };
            }
            finally {
                if (fs.existsSync(tempFilePath)) {
                    fs.unlinkSync(tempFilePath);
                }
            }
        }
        catch (error) {
            this.logger.error('Speech-to-text error', error);
            throw new common_1.BadRequestException('Failed to transcribe audio: ' + error.message);
        }
    }
    async enhanceText(text, task) {
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
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.geminiApiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody),
            });
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
        }
        catch (error) {
            this.logger.error('Text enhancement error', error);
            throw new common_1.BadRequestException('Failed to enhance text: ' + error.message);
        }
    }
    async generateNoteSuggestions(content) {
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
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.geminiApiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody),
            });
            if (!response.ok) {
                throw new Error(`Gemini API error: ${response.status}`);
            }
            const result = await response.json();
            if (!result.candidates || result.candidates.length === 0) {
                throw new Error('No suggestions received');
            }
            const suggestionText = result.candidates[0].content.parts[0].text.trim();
            try {
                const jsonMatch = suggestionText.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    const suggestions = JSON.parse(jsonMatch[0]);
                    return suggestions;
                }
            }
            catch (parseError) {
                this.logger.warn('Failed to parse JSON response, using fallback');
            }
            return {
                tags: ['general', 'note', 'important'],
                title: content.substring(0, 50) + (content.length > 50 ? '...' : ''),
                relatedTopics: [
                    'Related Research',
                    'Follow Up Tasks',
                    'Additional Reading',
                ],
            };
        }
        catch (error) {
            this.logger.error('Note suggestions error', error);
            return {
                tags: ['note'],
                title: 'Untitled Note',
                relatedTopics: ['Research', 'Tasks'],
            };
        }
    }
    getMimeType(filename) {
        const ext = path.extname(filename).toLowerCase();
        const mimeTypes = {
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
    calculateConfidence(transcript, geminiResponse) {
        let confidence = 0.8;
        if (transcript.length > 10)
            confidence += 0.1;
        if (transcript.length > 50)
            confidence += 0.05;
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
        const hasCommonWords = commonWords.some((word) => transcript.toLowerCase().includes(word));
        if (hasCommonWords)
            confidence += 0.05;
        return Math.min(confidence, 1.0);
    }
};
exports.AIService = AIService;
exports.AIService = AIService = AIService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], AIService);
//# sourceMappingURL=ai.service.js.map