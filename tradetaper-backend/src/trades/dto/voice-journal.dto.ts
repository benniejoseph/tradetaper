export class VoiceJournalResponseDto {
  updates: Record<string, any>;
  missingPrompts: string[];
  transcriptSummary: string;
}
