import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  HttpException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';

export type ToneType = 'RULE' | 'GPT' | 'HYBRID';

export type TransformEmailInput = {
  systemPrompt: string;
  originalText: string;
  toneType: ToneType;
  maxLength?: number | null;
  forbidEmotion?: boolean | null;
};

@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name);
  private readonly geminiApiKey?: string;
  private readonly geminiModel: string;
  private readonly geminiTimeoutMs: number;
  private geminiClient?: GoogleGenerativeAI;

  constructor(private readonly configService: ConfigService) {
    this.geminiApiKey = this.configService.get<string>('GEMINI_API_KEY');
    this.geminiModel =
      this.configService.get<string>('GEMINI_MODEL') ?? 'gemini-1.5-flash';

    const timeoutRaw = this.configService.get<string | number>(
      'GEMINI_TIMEOUT_MS',
    );
    const timeoutMs =
      typeof timeoutRaw === 'number' ? timeoutRaw : Number(timeoutRaw);
    this.geminiTimeoutMs =
      Number.isFinite(timeoutMs) && timeoutMs > 0 ? timeoutMs : 15000;
  }

  private getGeminiClient(): GoogleGenerativeAI {
    if (this.geminiClient) return this.geminiClient;

    if (!this.geminiApiKey) {
      throw new BadRequestException(
        'GEMINI_API_KEY가 설정되지 않았습니다. 서버 환경변수를 설정해주세요.',
      );
    }

    this.geminiClient = new GoogleGenerativeAI(this.geminiApiKey);
    return this.geminiClient;
  }

  private buildPrompt(input: TransformEmailInput): string {
    const rules: string[] = [];

    rules.push('1) 본문은 자연스럽고 읽기 좋게 다듬어서 출력한다.');
    rules.push('2) 원문의 의미와 핵심 정보는 유지한다.');

    if (input.forbidEmotion) {
      rules.push(
        '3) 감정 표현과 과장된 어투(예: 너무, 진짜, 완전, 아주)를 지양하고, 이모지/방탄부호/감탄문은 사용하지 않는다.',
      );
    }

    if (input.maxLength != null) {
      rules.push(
        `4) 결과 본문은 공백포함 최대 ${input.maxLength}자를 넘지 않는다.`,
      );
    }

    rules.push(`5) toneType=${input.toneType} 조건을 고려한다.`);
    rules.push(
      '6) 결과는 변환된 이메일 본문 텍스트만 출력한다. (제목, 설명, 부연설명, 인사말, 메타박스, 따옴표, ``` 코드블록 금지)',
    );

    return [
      '[SYSTEM]',
      input.systemPrompt.trim(),
      '',
      '[OPTIONS_AND_RULES]',
      rules.join('\n'),
      '',
      '[USER_EMAIL_TEXT]',
      input.originalText.trim(),
    ].join('\n');
  }

  private async withTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number,
  ): Promise<T> {
    let timeoutHandle: NodeJS.Timeout | undefined;

    const timeoutPromise = new Promise<T>((_, reject) => {
      timeoutHandle = setTimeout(() => {
        reject(new Error(`GEMINI_TIMEOUT: ${timeoutMs}ms`));
      }, timeoutMs);
    });

    try {
      return await Promise.race([promise, timeoutPromise]);
    } finally {
      if (timeoutHandle) clearTimeout(timeoutHandle);
    }
  }

  private sanitizeModelText(text: string): string {
    const trimmed = text.trim();
    const fenced = trimmed.match(/^```[a-zA-Z0-9_-]*\n([\s\S]*)\n```$/);
    if (fenced?.[1]) return fenced[1].trim();
    return trimmed;
  }

  async transformEmail(input: TransformEmailInput): Promise<string> {
    const originalText = input?.originalText ?? '';
    if (!originalText.trim()) {
      throw new BadRequestException('originalText가 비어있습니다.');
    }

    const systemPrompt = input?.systemPrompt ?? '';
    if (!systemPrompt.trim()) {
      throw new BadRequestException('systemPrompt가 비어있습니다.');
    }

    const toneType = input?.toneType;
    if (toneType !== 'RULE' && toneType !== 'GPT' && toneType !== 'HYBRID') {
      throw new BadRequestException('toneType가 올바르지 않습니다.');
    }

    const prompt = this.buildPrompt({
      systemPrompt,
      originalText,
      toneType,
      maxLength: input.maxLength ?? null,
      forbidEmotion: input.forbidEmotion ?? null,
    });

    try {
      const geminiClient = this.getGeminiClient();
      const geminiModel = geminiClient.getGenerativeModel({
        model: this.geminiModel,
      });

      const generatePromise = geminiModel
        .generateContent(prompt)
        .then((result) => result.response.text());

      const rawText = await this.withTimeout(
        generatePromise,
        this.geminiTimeoutMs,
      );
      const content = this.sanitizeModelText(rawText);

      if (!content || !content.trim()) {
        throw new InternalServerErrorException('Gemini 응답이 비어있습니다.');
      }

      return content.trim();
    } catch (error) {
      // 입력/환경 설정 오류는 4xx로 유지 (디버깅 가능)
      if (error instanceof BadRequestException) throw error;

      // 이미 HttpException(예: InternalServerErrorException)을 던진 경우 그대로 전달
      if (error instanceof HttpException) throw error;

      const message = error instanceof Error ? error.message : String(error);
      const stack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `Gemini transformEmail 실패: ${message} (model=${this.geminiModel})`,
        stack,
      );
      throw new InternalServerErrorException('이메일 변환에 실패했습니다.');
    }
  }
}
