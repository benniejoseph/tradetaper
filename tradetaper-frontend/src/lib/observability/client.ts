'use client';

import * as Sentry from '@sentry/nextjs';
import posthog from 'posthog-js';

type ObservabilityUser = {
  id: string;
  email?: string | null;
};

const DEFAULT_POSTHOG_HOST = 'https://us.i.posthog.com';
const DEFAULT_POSTHOG_UI_HOST = 'https://us.i.posthog.com';

let clientInitialized = false;
let posthogReady = false;

function parseSampleRate(rawValue: string | undefined, fallback: number): number {
  const parsed = Number(rawValue);
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 1) {
    return fallback;
  }
  return parsed;
}

export function initializeClientObservability(): void {
  if (clientInitialized || typeof window === 'undefined') {
    return;
  }
  clientInitialized = true;

  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN?.trim();
  if (dsn) {
    Sentry.init({
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

  const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY?.trim();
  if (posthogKey) {
    const posthogHost = (
      process.env.NEXT_PUBLIC_POSTHOG_HOST || DEFAULT_POSTHOG_HOST
    ).trim();
    const posthogUiHost = (
      process.env.NEXT_PUBLIC_POSTHOG_UI_HOST || DEFAULT_POSTHOG_UI_HOST
    ).trim();
    posthog.init(posthogKey, {
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
}

export function syncObservabilityUser(user: ObservabilityUser | null): void {
  if (typeof window === 'undefined') {
    return;
  }

  if (!user) {
    Sentry.setUser(null);
    if (posthogReady) {
      posthog.reset();
    }
    return;
  }

  Sentry.setUser({
    id: user.id,
    email: user.email || undefined,
  });

  if (posthogReady) {
    posthog.identify(user.id, {
      email: user.email || undefined,
    });
  }
}

export function captureClientEvent(
  event: string,
  properties?: Record<string, string | number | boolean | null | undefined>,
): void {
  if (!posthogReady || typeof window === 'undefined') {
    return;
  }
  posthog.capture(event, properties);
}
