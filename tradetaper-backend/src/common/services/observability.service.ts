import {
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnApplicationShutdown,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Sentry from '@sentry/node';
import { PostHog } from 'posthog-node';

type CaptureProperties = Record<
  string,
  string | number | boolean | null | undefined
>;

@Injectable()
export class ObservabilityService
  implements OnApplicationBootstrap, OnApplicationShutdown
{
  private readonly logger = new Logger(ObservabilityService.name);
  private posthogClient: PostHog | null = null;
  private sentryEnabled = false;

  constructor(private readonly configService: ConfigService) {}

  onApplicationBootstrap(): void {
    this.initializeSentry();
    this.initializePosthog();
  }

  async onApplicationShutdown(): Promise<void> {
    try {
      if (this.posthogClient) {
        await this.posthogClient.shutdown();
      }
    } catch (error) {
      this.logger.warn(
        `PostHog shutdown failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    if (this.sentryEnabled) {
      await Sentry.close(2000).catch(() => undefined);
    }
  }

  captureException(
    exception: unknown,
    context?: {
      tags?: Record<string, string>;
      extra?: CaptureProperties;
      user?: { id?: string; email?: string };
    },
  ): void {
    if (!this.sentryEnabled) {
      return;
    }

    Sentry.withScope((scope) => {
      if (context?.tags) {
        for (const [key, value] of Object.entries(context.tags)) {
          scope.setTag(key, value);
        }
      }
      if (context?.extra) {
        for (const [key, value] of Object.entries(context.extra)) {
          scope.setExtra(key, value);
        }
      }
      if (context?.user) {
        scope.setUser({
          id: context.user.id,
          email: context.user.email,
        });
      }

      if (exception instanceof Error) {
        Sentry.captureException(exception);
      } else {
        Sentry.captureException(new Error(String(exception)));
      }
    });
  }

  captureEvent(
    event: string,
    distinctId: string,
    properties?: CaptureProperties,
  ): void {
    if (!this.posthogClient) {
      return;
    }

    this.posthogClient.capture({
      event,
      distinctId,
      properties: {
        environment:
          this.configService.get<string>('NODE_ENV') || 'development',
        source: 'tradetaper-backend',
        ...properties,
      },
    });
  }

  private initializeSentry(): void {
    const dsn = this.configService.get<string>('SENTRY_DSN')?.trim();
    if (!dsn) {
      return;
    }

    const tracesSampleRateRaw = Number(
      this.configService.get<string>('SENTRY_TRACES_SAMPLE_RATE'),
    );
    const tracesSampleRate =
      Number.isFinite(tracesSampleRateRaw) &&
      tracesSampleRateRaw >= 0 &&
      tracesSampleRateRaw <= 1
        ? tracesSampleRateRaw
        : 0.1;

    Sentry.init({
      dsn,
      environment:
        this.configService.get<string>('SENTRY_ENVIRONMENT') ||
        this.configService.get<string>('NODE_ENV') ||
        'development',
      release:
        this.configService.get<string>('SENTRY_RELEASE') ||
        process.env.BUILD_VERSION,
      tracesSampleRate,
    });

    this.sentryEnabled = true;
    this.logger.log('Sentry initialized');
  }

  private initializePosthog(): void {
    const apiKey = this.configService.get<string>('POSTHOG_API_KEY')?.trim();
    if (!apiKey) {
      return;
    }

    const host = (
      this.configService.get<string>('POSTHOG_HOST') ||
      'https://us.i.posthog.com'
    ).trim();

    this.posthogClient = new PostHog(apiKey, {
      host,
      flushAt: 10,
      flushInterval: 5000,
    });

    this.logger.log(`PostHog initialized (${host})`);
  }
}
