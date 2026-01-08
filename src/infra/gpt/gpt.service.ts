import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

export type TransformEmailInput = {
  originalText: string;
  systemPrompt?: string;
  toneType?: string;
  villagerName?: string;
  receiverEmail?: string;
  senderEmail?: string;
};

@Injectable()
export class GptService {
  private readonly openAiApiKey?: string;
  private readonly openAiModel: string;
  private readonly openAiBaseUrl?: string;
  private client?: OpenAI;

  constructor(private readonly configService: ConfigService) {
    this.openAiApiKey = this.configService.get<string>('OPENAI_API_KEY');
    this.openAiModel =
      this.configService.get<string>('OPENAI_MODEL') ?? 'gpt-4o-mini';
    this.openAiBaseUrl = this.configService.get<string>('OPENAI_BASE_URL');
  }

  private getClient(): OpenAI {
    if (this.client) return this.client;

    if (!this.openAiApiKey) {
      throw new BadRequestException(
        'OPENAI_API_KEY가 설정되지 않았습니다. 서버 환경변수를 설정해주세요.',
      );
    }

    this.client = new OpenAI({
      apiKey: this.openAiApiKey,
      baseURL: this.openAiBaseUrl,
    });

    return this.client;
  }

  async transformEmail(input: TransformEmailInput): Promise<string> {
    const originalText = input?.originalText ?? '';
    if (!originalText.trim())
      throw new BadRequestException('originalText가 비어있습니다.');

    const systemPrompt =
      input?.systemPrompt?.trim() ??
      [
        '너는 이메일 문장을 자연스럽고 읽기 좋게 다듬는 도우미야.',
        '의미는 유지하되, 어색한 표현을 교정하고 문장 흐름을 개선해.',
        '결과는 이메일 본문 텍스트만 출력해(따옴표/코드블록 금지).',
      ].join('\n');

    const client = this.getClient();

    const completion = await client.chat.completions.create({
      model: this.openAiModel,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: originalText },
      ],
    });

    const content = completion.choices?.[0]?.message?.content;
    if (!content || !content.trim()) {
      throw new BadRequestException('OpenAI 응답이 비어있습니다.');
    }

    return content.trim();
  }
}
