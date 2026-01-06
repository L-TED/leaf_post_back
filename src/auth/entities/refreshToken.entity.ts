import { Users } from 'src/users/entities/user.entity';
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Index('refresh_tokens_pkey', ['id'], { unique: true })
@Entity('refresh_tokens', { schema: 'public' })
export class RefreshTokens {
  @PrimaryGeneratedColumn({ type: 'integer', name: 'id' })
  id: number;

  @Column('character varying', { name: 'token', length: 255 })
  token: string;

  @Column('boolean', {
    name: 'is_revoked',
    nullable: true,
    default: () => 'false',
  })
  isRevoked: boolean | null;

  @Column('timestamp with time zone', { name: 'expires_at' })
  expiresAt: Date;

  @Column('timestamp with time zone', {
    name: 'created_at',
    default: () => 'now()',
  })
  createdAt: Date;

  @ManyToOne(() => Users, (users) => users.refreshTokens, {
    onDelete: 'CASCADE',
  })
  @JoinColumn([{ name: 'user_id', referencedColumnName: 'id' }])
  user: Users;
}
