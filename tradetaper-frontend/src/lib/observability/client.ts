'use client';

type ObservabilityUser = {
  id: string;
  email?: string | null;
};

type SentryClient = typeof import('@sentry/nextjs');
type PosthogModule = typeof import('posthog-js');
type PosthogClient = PosthogModule['default'];

const DEFAULT_POSTHOG_HOST = 'https://us.i.posthog.com';
const DEFAULT_POSTHOG_UI_HOST = 'https://us.i.posthog.com';

let clientInitialized = false;
let posthogReady = false;
let sentryClient: SentryClient | null = null;
let posthogClient: PosthogClient | null = null;
let sentryModulePromise: Promise<void> | null = null;
let posthogModulePromise: Promise<void> | null = null;
let pendingUserSync: ObservabilityUser | null | undefined;

function parseSampleRate(rawValue: string | undefined, fallback: number): number {
  const parsed = Number(rawValue);
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 1) {
    return fallback;
  }
  return parsed;
}

function ensureSentryClient(): Promise<void> {
  if (sentryClient) {
    return Promise.resolve();
  }
  if (sentryModulePromise) {
    return sentryModulePromise;
  }

  sentryModulePromise = import('@sentry/nextjs')
    .then((module) => {
      sentryClient = module;
    })
    .catch((error: unknown) => {
      console.error('Failed to load Sentry client:', error);
    })
    .finally(() => {
      sentryModulePromise = null;
    });

  return sentryModulePromise;
}

function ensurePosthogClient(): Promise<void> {
  if (posthogClient) {
    return Promise.resolve();
  }
  if (posthogModulePromise) {
    return posthogModulePromise;
  }

  posthogModulePromise = import('posthog-js')
    .then((module) => {
      posthogClient = module.default;
    })
    .catch((error: unknown) => {
      console.error('Failed to load PostHog client:', error);
    })
    .finally(() => {
      posthogModulePromise = null;
    });

  return posthogModulePromise;
}

function applyUserSync(user: ObservabilityUser | null): void {
  if (!user) {
    if (sentryClient) {
      sentryClient.setUser(null);
    }
    if (posthogReady && posthogClient) {
      posthogClient.reset();
    }
    return;
  }

  if (sentryClient) {
    sentryClient.setUser({
      id: user.id,
      email: user.email || undefined,
    });
  }

  if (posthogReady && posthogClient) {
    posthogClient.identify(user.id, {
      email: user.email || undefined,
    });
  }
}

export function initializeClientObservability(): void {
  if (clientInitialized || typeof window === 'undefined') {
    return;
  }
  clientInitialized = true;

  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN?.trim();
  const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY?.trim();
  if (!dsn && !posthogKey) {
    return;
  }

  const moduleLoads: Promise<void>[] = [];
  if (dsn) {
    moduleLoads.push(ensureSentryClient());
  }
  if (posthogKey) {
    moduleLoads.push(ensurePosthogClient());
  }

  void Promise.all(moduleLoads).then(() => {
    if (dsn && sentryClient) {
      sentryClient.init({
        dsn,
        environment:
          process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT ||
          process.env.NODE_ENV ||
          'development',
        tracesSampleRate: parseSampleRate(
          process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE,
          0.1,
        ),
      });
    }

    if (posthogKey && posthogClient) {
      const posthogHost = (
        process.env.NEXT_PUBLIC_POSTHOG_HOST || DEFAULT_POSTHOG_HOST
      ).trim();
      const posthogUiHost = (
        process.env.NEXT_PUBLIC_POSTHOG_UI_HOST || DEFAULT_POSTHOG_UI_HOST
      ).trim();
      posthogClient.init(posthogKey, {
        api_host: posthogHost,
        ui_host: posthogUiHost,
        person_profiles: 'identified_only',
        capture_pageview: true,
        capture_pageleave: true,
        autocapture: true,
        loaded: (instance) => {
          instance.register({
            app_name: 'tradetaper-frontend',
          });
        },
      });
      posthogReady = true;
    }

    if (pendingUserSync !== undefined) {
      applyUserSync(pendingUserSync);
    }
  });
}

export function syncObservabilityUser(user: ObservabilityUser | null): void {
  if (typeof window === 'undefined') {
    return;
  }

  pendingUserSync = user;

  if (!sentryClient && !posthogClient) {
    return;
  }

  applyUserSync(user);
}

export function captureClientEvent(
  event: string,
  properties?: Record<string, string | number | boolean | null | undefined>,
): void {
  if (!posthogReady || !posthogClient || typeof window === 'undefined') {
    return;
  }
  posthogClient.capture(event, properties);
}
