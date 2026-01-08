import { Users } from 'src/users/entities/user.entity';
import { Villagers } from 'src/villagers/entities/villager.entity';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';

@Index('emails_pkey', ['id'], { unique: true })
@Entity('emails', { schema: 'public' })
// status => @IsIn(['reserved', 'sent', 'canceled', 'failed'])
export class Emails {
  @Column('uuid', { primary: true, name: 'id' })
  id: string;

  @Column('character varying', { name: 'status', length: 20 })
  status: string;

  @Column('character varying', { name: 'sender_email', length: 255 })
  senderEmail: string;

  @Column('character varying', { name: 'receiver_email', length: 255 })
  receiverEmail: string;

  @Column('character varying', {
    name: 'subject',
    length: 255,
    nullable: true,
  })
  subject: string | null;

  @Column('text', { name: 'original_text' })
  originalText: string;

  @Column('text', { name: 'transformed_text' })
  transformedText: string;

  @Column('text', { name: 'image_url', nullable: true })
  imageUrl: string | null;

  @Column('timestamp with time zone', { name: 'scheduled_at' })
  scheduledAt: Date;

  @Column('timestamp with time zone', {
    name: 'created_at',
    nullable: true,
    default: () => 'now()',
  })
  createdAt: Date | null;

  @ManyToOne(() => Users, (users) => users.emails, { onDelete: 'CASCADE' })
  @JoinColumn([{ name: 'user_id', referencedColumnName: 'id' }])
  user: Users;

  @ManyToOne(() => Villagers, (villagers) => villagers.emails)
  @JoinColumn([{ name: 'villager_id', referencedColumnName: 'id' }])
  villager: Villagers;
}
