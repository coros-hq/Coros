import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import { render } from '@react-email/render';
import { WelcomeInvite } from './templates/welcome-invite';
import { ProjectInvite } from './templates/project-invite';
import { LeaveStatusUpdate } from './templates/leave-status-update';

/** Resend returns `{ data, error }` and does not throw on API failures — must check `error`. */
function assertResendOk(
  result: { data: unknown; error: unknown },
  context: string,
  logger: Logger,
): void {
  if (result.error) {
    const msg =
      typeof result.error === 'object' &&
      result.error !== null &&
      'message' in result.error
        ? String((result.error as { message: string }).message)
        : JSON.stringify(result.error);
    logger.error(`${context}: ${msg}`);
    throw new Error(`Resend: ${msg}`);
  }
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly resend: Resend;
  private readonly from: string;
  private readonly webUrl: string;

  constructor(private readonly configService: ConfigService) {
    const apiKey =
      this.configService.get<string>('RESEND_KEY') ??
      this.configService.get<string>('RESEND_API_KEY');
    this.resend = new Resend(apiKey);
    this.from =
      this.configService.get<string>('RESEND_FROM') ??
      'Coros <onboarding@coros.click>';
    this.webUrl =
      this.configService.get<string>('COROS_WEB_URL') ?? 'http://localhost:5173';
  }

  async sendWelcomeInvite(
    to: string,
    firstName: string,
    token: string,
  ): Promise<void> {
    const inviteUrl = `${this.webUrl}/set-password/${token}`;
    const html = await render(
      WelcomeInvite({ firstName, inviteUrl })
    );
    const result = await this.resend.emails.send({
      from: this.from,
      to,
      subject: 'Welcome to Coros — set your password',
      html,
    });
    assertResendOk(result, 'sendWelcomeInvite', this.logger);
  }

  async sendProjectInvite(
    to: string,
    projectName: string,
    projectId: string,
  ): Promise<void> {
    const projectUrl = `${this.webUrl}/projects/${projectId}`;
    const html = await render(
      ProjectInvite({ projectName, projectUrl })
    );
    const result = await this.resend.emails.send({
      from: this.from,
      to,
      subject: `You've been added to ${projectName}`,
      html,
    });
    assertResendOk(result, 'sendProjectInvite', this.logger);
  }

  async sendLeaveStatusUpdate(
    to: string,
    firstName: string,
    leaveType: string,
    startDate: string,
    endDate: string,
    status: 'approved' | 'rejected',
    reason?: string,
  ): Promise<void> {
    const leaveUrl = `${this.webUrl}/leave-requests`;
    const html = await render(
      LeaveStatusUpdate({ firstName, leaveType, startDate, endDate, status, reason, leaveUrl })
    );
    const result = await this.resend.emails.send({
      from: this.from,
      to,
      subject: `Your leave request has been ${status}`,
      html,
    });
    assertResendOk(result, 'sendLeaveStatusUpdate', this.logger);
  }
}
