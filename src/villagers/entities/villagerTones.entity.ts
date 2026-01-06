import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Villagers } from './villager.entity';

@Index('villager_tones_pkey', ['id'], { unique: true })
@Entity('villager_tones', { schema: 'public' })
export class VillagerTones {
  @PrimaryGeneratedColumn({ type: 'integer', name: 'id' })
  id: number;

  @Column('character varying', {
    name: 'speech_style',
    nullable: true,
    length: 50,
  })
  speechStyle: string | null;

  @Column('character varying', {
    name: 'sentence_ending',
    nullable: true,
    length: 50,
  })
  sentenceEnding: string | null;

  @Column('text', { name: 'personality_keywords', nullable: true })
  personalityKeywords: string | null;

  @Column('text', { name: 'example_sentences', nullable: true })
  exampleSentences: string | null;

  @Column('character varying', { name: 'tone_type', length: 20 })
  toneType: string;

  @Column('text', { name: 'system_prompt', nullable: true })
  systemPrompt: string | null;

  @Column('integer', { name: 'max_length', nullable: true })
  maxLength: number | null;

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
