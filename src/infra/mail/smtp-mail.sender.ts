import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import type { MailSender, SendMailInput } from './mail.service';

@Injectable()
export class SmtpMailSender implements MailSender {
  private readonly transporter: Transporter;
  private readonly enabled: boolean;

  constructor(private readonly configService: ConfigService) {
    const host = this.configService.get<string>('SMTP_HOST');
    const portRaw = this.configService.get<string>('SMTP_PORT');
    const user = this.configService.get<string>('SMTP_USER');
    const pass = this.configService.get<string>('SMTP_PASS');

    this.enabled = Boolean(host && portRaw && user && pass);

    const port = Number(portRaw ?? NaN);
    const secure = port === 465;

    this.transporter = nodemailer.createTransport({
      host,
      port: Number.isFinite(port) ? port : 587,
      secure,
      auth: user && pass ? { user, pass } : undefined,
    });
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  async sendMail(input: SendMailInput): Promise<void> {
    if (!this.enabled) {
      throw new Error('SMTP is not configured');
    }

    await this.transporter.sendMail({
      from: input.from,
      to: input.to,
      subject: input.subject,
      text: input.text,
    });
  }
}
