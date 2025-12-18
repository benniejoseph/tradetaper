"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var NotesController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotesController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const notes_service_1 = require("./notes.service");
const psychological_insights_service_1 = require("./psychological-insights.service");
const create_note_dto_1 = require("./dto/create-note.dto");
const update_note_dto_1 = require("./dto/update-note.dto");
const search_notes_dto_1 = require("./dto/search-notes.dto");
let NotesController = NotesController_1 = class NotesController {
    notesService;
    psychologicalInsightsService;
    logger = new common_1.Logger(NotesController_1.name);
    constructor(notesService, psychologicalInsightsService) {
        this.notesService = notesService;
        this.psychologicalInsightsService = psychologicalInsightsService;
    }
    async create(createNoteDto, req) {
        return this.notesService.create(createNoteDto, req.user.id);
    }
    async findAll(searchDto, req) {
        return this.notesService.findAll(searchDto, req.user.id);
    }
    async getStats(req) {
        return this.notesService.getStats(req.user.id);
    }
    async getAllTags(req) {
        return this.notesService.getAllTags(req.user.id);
    }
    async getCalendarNotes(year, month, req) {
        return this.notesService.getCalendarNotes(req.user.id, year, month);
    }
    async findOne(id, req) {
        return this.notesService.findOne(id, req.user.id);
    }
    async update(id, updateNoteDto, req) {
        return this.notesService.update(id, updateNoteDto, req.user.id);
    }
    async togglePin(id, req) {
        return this.notesService.togglePin(id, req.user.id);
    }
    async analyzeNote(id, req) {
        this.logger.log(`Received analyze request for note ${id} from user ${req.user?.id || 'unknown'}`);
        return this.notesService.analyzeNote(id, req.user);
    }
    async analyzePsychology(id, req) {
        this.logger.log(`Received psychological analysis request for note ${id} from user ${req.user?.id || 'unknown'}`);
        return this.psychologicalInsightsService.analyzeAndSavePsychologicalInsights(id, req.user.id);
    }
    async getPsychologicalProfile(req) {
        return this.psychologicalInsightsService.getPsychologicalSummary(req.user.id);
    }
    async remove(id, req) {
        return this.notesService.remove(id, req.user.id);
    }
};
exports.NotesController = NotesController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_note_dto_1.CreateNoteDto, Object]),
    __metadata("design:returntype", Promise)
], NotesController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [search_notes_dto_1.SearchNotesDto, Object]),
    __metadata("design:returntype", Promise)
], NotesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('stats'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], NotesController.prototype, "getStats", null);
__decorate([
    (0, common_1.Get)('tags'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], NotesController.prototype, "getAllTags", null);
__decorate([
    (0, common_1.Get)('calendar/:year/:month'),
    __param(0, (0, common_1.Param)('year', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Param)('month', common_1.ParseIntPipe)),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, Object]),
    __metadata("design:returntype", Promise)
], NotesController.prototype, "getCalendarNotes", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], NotesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_note_dto_1.UpdateNoteDto, Object]),
    __metadata("design:returntype", Promise)
], NotesController.prototype, "update", null);
__decorate([
    (0, common_1.Patch)(':id/toggle-pin'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], NotesController.prototype, "togglePin", null);
__decorate([
    (0, common_1.Post)(':id/analyze'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], NotesController.prototype, "analyzeNote", null);
__decorate([
    (0, common_1.Post)(':id/analyze-psychology'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], NotesController.prototype, "analyzePsychology", null);
__decorate([
    (0, common_1.Get)('psychological-profile'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], NotesController.prototype, "getPsychologicalProfile", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], NotesController.prototype, "remove", null);
exports.NotesController = NotesController = NotesController_1 = __decorate([
    (0, common_1.Controller)('notes'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [notes_service_1.NotesService,
        psychological_insights_service_1.PsychologicalInsightsService])
], NotesController);
//# sourceMappingURL=notes.controller.js.map