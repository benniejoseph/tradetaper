"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotesModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const platform_express_1 = require("@nestjs/platform-express");
const config_1 = require("@nestjs/config");
const note_entity_1 = require("./entities/note.entity");
const note_block_entity_1 = require("./entities/note-block.entity");
const note_media_entity_1 = require("./entities/note-media.entity");
const psychological_insight_entity_1 = require("./entities/psychological-insight.entity");
const notes_service_1 = require("./notes.service");
const media_service_1 = require("./media.service");
const ai_service_1 = require("./ai.service");
const calendar_service_1 = require("./calendar.service");
const psychological_insights_service_1 = require("./psychological-insights.service");
const gemini_psychology_service_1 = require("./gemini-psychology.service");
const gemini_vision_service_1 = require("./gemini-vision.service");
const gemini_text_analysis_service_1 = require("./gemini-text-analysis.service");
const chart_analysis_service_1 = require("./chart-analysis.service");
const notes_controller_1 = require("./notes.controller");
const media_controller_1 = require("./media.controller");
const ai_controller_1 = require("./ai.controller");
const calendar_controller_1 = require("./calendar.controller");
const chart_analysis_controller_1 = require("./chart-analysis.controller");
const psychological_insights_controller_1 = require("./psychological-insights.controller");
let NotesModule = class NotesModule {
};
exports.NotesModule = NotesModule;
exports.NotesModule = NotesModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                note_entity_1.Note,
                note_block_entity_1.NoteBlock,
                note_media_entity_1.NoteMedia,
                psychological_insight_entity_1.PsychologicalInsight,
            ]),
            platform_express_1.MulterModule.register({
                dest: './temp',
                limits: {
                    fileSize: 50 * 1024 * 1024,
                },
            }),
            config_1.ConfigModule,
        ],
        controllers: [
            notes_controller_1.NotesController,
            media_controller_1.MediaController,
            ai_controller_1.AIController,
            calendar_controller_1.CalendarController,
            chart_analysis_controller_1.ChartAnalysisController,
            psychological_insights_controller_1.PsychologicalInsightsController,
            psychological_insights_controller_1.PsychologicalProfileController,
        ],
        providers: [
            notes_service_1.NotesService,
            media_service_1.MediaService,
            ai_service_1.AIService,
            calendar_service_1.CalendarService,
            psychological_insights_service_1.PsychologicalInsightsService,
            gemini_psychology_service_1.GeminiPsychologyService,
            gemini_vision_service_1.GeminiVisionService,
            gemini_text_analysis_service_1.GeminiTextAnalysisService,
            chart_analysis_service_1.ChartAnalysisService,
            typeorm_1.TypeOrmModule,
        ],
        exports: [
            notes_service_1.NotesService,
            media_service_1.MediaService,
            ai_service_1.AIService,
            calendar_service_1.CalendarService,
            psychological_insights_service_1.PsychologicalInsightsService,
            gemini_psychology_service_1.GeminiPsychologyService,
            gemini_vision_service_1.GeminiVisionService,
            gemini_text_analysis_service_1.GeminiTextAnalysisService,
            chart_analysis_service_1.ChartAnalysisService,
            typeorm_1.TypeOrmModule,
        ],
    })
], NotesModule);
//# sourceMappingURL=notes.module.js.map