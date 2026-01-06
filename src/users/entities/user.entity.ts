import { RefreshTokens } from 'src/auth/entities/refreshToken.entity';
import { Emails } from 'src/emails/entities/email.entity';
import { Column, Entity, Index, OneToMany } from 'typeorm';

@Index('users_email_key', ['email'], { unique: true })
@Index('users_pkey', ['id'], { unique: true })
@Entity('users', { schema: 'public' })
export class Users {
  @Column('uuid', { primary: true, name: 'id' })
  id: string;

  @Column('character varying', { name: 'email', unique: true, length: 255 })
  email: string;

  @Column('character varying', { name: 'password', length: 255 })
  password: string;

  @Column('character varying', { name: 'nickname', length: 50 })
  nickname: string;

  @Column('text', { name: 'profile_image_url', nullable: true })
  profileImage: string | null;

  @Column('timestamp with time zone', {
    name: 'created_at',
    nullable: true,
    default: () => 'now()',
  })
  createdAt: Date | null;

  @OneToMany(() => Emails, (emails) => emails.user)
  emails: Emails[];

  @OneToMany(() => RefreshTokens, (refreshTokens) => refreshTokens.user)
  refreshTokens: RefreshTokens[];
}
