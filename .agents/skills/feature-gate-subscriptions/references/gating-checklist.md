# Feature Gate Checklist

## Backend

- Check exists at API boundary.
- Check uses active subscription status.
- Response error shape is consistent.

## Frontend

- Locked and unlocked states render correctly.
- Upsell/upgrade copy appears only when blocked.
- Quota usage is visible where applicable.

## Data Consistency

- Profile and billing pages show same plan tier.
- Entitlement from auth state matches billing snapshot.

## Regression

- Premium-only APIs reject Essential users.
- Essential-limited APIs enforce quota deterministically.
