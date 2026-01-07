import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Villagers } from '../../villagers/entities/villager.entity';

@Index('villager_tones_pkey', ['id'], { unique: true })
@Entity('villager_tones', { schema: 'public' })
export class VillagerTones {
  @PrimaryGeneratedColumn({ type: 'integer', name: 'id' })
  id: number;

  // Rule fallback 시 설명/말투 요약 설명
  @Column('character varying', {
    name: 'speech_style',
    nullable: true,
    length: 50,
  })
  speechStyle: string | null;

  // 문장 끝 고정 패턴
  @Column('character varying', {
    name: 'sentence_ending',
    nullable: true,
    length: 50,
  })
  sentenceEnding: string | null;

  // 성격 키워드 집합
  @Column('text', { name: 'personality_keywords', nullable: true })
  personalityKeywords: string | null;

  // 예시 문장
  @Column('text', { name: 'example_sentences', nullable: true })
  exampleSentences: string | null;

  // 톤
  @Column('character varying', { name: 'tone_type', length: 20 })
  toneType: string;

  // 시스템 프롬프트(예: "너는 동물의 숲 주민 "애플"이야. 밝고 명랑하게 말하고 말 끝마다 큐룽을 붙여")
  @Column('text', { name: 'system_prompt', nullable: true })
  systemPrompt: string | null;

  // 최대 길이 제한
  @Column('integer', { name: 'max_length', nullable: true })
  maxLength: number | null;

  // 감정 과다 차단
  @Column('boolean', {
    name: 'forbid_emotion',
    nullable: true,
    default: () => 'false',
  })
  forbidEmotion: boolean | null;

  @Column('timestamp with time zone', {
    name: 'created_at',
    nullable: true,
    default: () => 'now()',
  })
  createdAt: Date | null;

  @ManyToOne(() => Villagers, (villagers) => villagers.villagerTones, {
    onDelete: 'CASCADE',
  })
  @JoinColumn([{ name: 'villager_id', referencedColumnName: 'id' }])
  villager: Villagers;
}
