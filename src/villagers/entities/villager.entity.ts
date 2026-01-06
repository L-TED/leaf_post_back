import { Emails } from 'src/emails/entities/email.entity';
import {
  Column,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { VillagerTones } from './villagerTones.entity';

@Index('villagers_pkey', ['id'], { unique: true })
@Entity('villagers', { schema: 'public' })
export class Villagers {
  @PrimaryGeneratedColumn({ type: 'integer', name: 'id' })
  id: number;

  @Column('character varying', { name: 'name', length: 100 })
  name: string;

  @Column('text', { name: 'image_url' })
  imageUrl: string;

  @Column('timestamp with time zone', {
    name: 'created_at',
    nullable: true,
    default: () => 'now()',
  })
  createdAt: Date | null;

  @OneToMany(() => Emails, (emails) => emails.villager)
  emails: Emails[];

  @OneToMany(() => VillagerTones, (villagerTones) => villagerTones.villager)
  villagerTones: VillagerTones[];
}
