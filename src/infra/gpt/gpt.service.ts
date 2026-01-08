import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export type TransformEmailInput = {
  originalText: string;
};

@Injectable()
export class GptService {
  private readonly openAiApiKey?: string;
  private readonly openAiModel: string;
  private readonly openAiBaseUrl?: string;

  constructor(private readonly configService: ConfigService) {
    this.openAiApiKey = this.configService.get<string>('OPENAI_API_KEY');
    this.openAiModel =
      this.configService.get<string>('OPENAI_MODEL') ?? 'gpt-4o-mini';
    this.openAiBaseUrl = this.configService.get<string>('OPENAI_BASE_URL');
  }

  async transformEmail(input: TransformEmailInput): Promise<string> {
    const originalText = input?.originalText ?? '';

    // MVP stub: keep deterministic behavior for now.
    // Future: wire OpenAI client using OPENAI_API_KEY / OPENAI_MODEL / OPENAI_BASE_URL.
    return `[TRANSFORMED]\n${originalText}`;
  }
}
