# `tradetaper-backend/src/subscriptions`

This directory handles user subscriptions and billing.

## Directory-Specific Instructions

- This module integrates with Stripe for payment processing.
- It manages subscription lifecycle events via webhooks.

## Local Conventions

- Use the `StripeService` for all interactions with the Stripe API.
- DTOs are used for creating checkout and portal sessions.

## Relevant Patterns

- Webhooks are used to receive and handle events from Stripe.
- A `UsageLimitGuard` is used to protect features based on subscription status.

## @imports to Shared Documentation

- @import [Src README](../README.md) 