# June 2026 — Security Remediation & UX Enhancements

Branch: `fix/security-and-enhancements`

## Security fixes (backend)

| Fix | Where | Operational requirement |
|-----|-------|-------------------------|
| Admin API now requires valid JWT + admin allowlist | `src/auth/guards/admin.guard.ts`, applied controller-wide in `src/admin/admin.controller.ts` | Set `ADMIN_EMAILS` (comma-separated) in the backend env. Unset = all admin access denied. |
| Removed `run-sql`, `clear-table`, `clear-all-tables` endpoints | `src/admin/admin.controller.ts` / `admin.service.ts` | Use migrations or audited DB access. |
| Table-name SQL injection fixed | `admin.service.ts` (`assertValidTableName`) | — |
| Removed hardcoded demo admin login (`admin123`) | `src/auth/auth.controller.ts` | Admins log in via the normal login form. |
| Hardcoded Gemini API keys removed | `src/notes/ai.service.ts`, `deploy-cloudrun-quick.sh` | **Rotate both keys in GCP** — they are in git history. |
| JWT/CSRF fallback secrets removed — app refuses to start without strong values | `src/auth/auth.module.ts`, `src/main.ts` | Set `JWT_SECRET` (≥32 chars) and `CSRF_SECRET` (≥32 chars). |
| JWT tokens now expire (`JWT_EXPIRES_IN`, default 7d) | `src/auth/auth.module.ts` | — |
| Global rate limiting (120 req/min) + strict limits on login (10/min) and register (5/min) | `src/app.module.ts`, `src/auth/auth.controller.ts` | — |
| Local-dev DB schema sync is opt-in | `src/database/database.module.ts` | Set `DB_SYNCHRONIZE=true` locally if you want sync instead of migrations. |
| Dependency vulnerabilities: backend 54→0 critical/high, frontend 16→2 moderate | `package.json` overrides (crypto-js ≥4.2, lodash, tar, axios) | — |

## Security fixes (admin app)

- Real login page (`/login`) using the regular auth endpoint; JWT attached via axios interceptors; 401/403 auto-redirects to login.
- `NoAuthWrapper` ("bypasses all authentication") replaced with `AuthWrapper` route guard.
- All `mock-admin-token` usage and debug/test pages removed.
- Destructive "Danger Zone" database UI replaced with a read-only stats panel.

## CI changes

- New `secret-scan` job (gitleaks) — deploy depends on it.
- `npm audit --omit=dev --audit-level=critical` for all three apps.
- Backend unit tests now run in CI before deploy (all 10 suites pass).
- Deploy passes `CSRF_SECRET` and `ADMIN_EMAILS` from GitHub secrets — **create both secrets before merging**.

## New product features (frontend)

### Lottie micro-animations
Authored with the `text-to-lottie` skill (`.agents/skills/text-to-lottie`), rendered by the SVG-only `lottie-web` light build, loaded lazily (`src/components/lottie/`). Files in `public/lottie/`:

- `candle-loader.json` — pulsing candlesticks; used by dashboard + journal loading states.
- `empty-chart.json` — self-drawing equity curve; used by empty states.
- `trade-win.json` — one-shot celebration (arrow + ring + sparks) for future use on trade save.
- `streak-flame.json` — flickering flame used by the streak card.

### Journaling streak (habit loop)
`JournalStreakCard` on the dashboard computes current/best consecutive-day streaks from trade entry dates. Greyed-out flame when the streak is broken; "personal best" reinforcement when current == best.

### Tilt guard (trading psychology)
`useTiltDetection` flags today's trades matching a revenge-trading signature — ≥3 entries within 60 minutes of a loss, or escalating size across 3 consecutive losses — and `TiltGuardBanner` shows a gentle, dismissable (once/day) cool-down prompt.

### P&L privacy mode
Eye toggle in the header (`PrivacyModeProvider`). Blurs any element tagged `data-sensitive` (portfolio balance, journal P&L column) — for screen sharing and for process-over-outcome focus. Persisted in localStorage.

### Navigation & theme
- Sidebar now exposes every feature: new **Mentor** group (Trader Mind, AI Mentor, Psychology) and **Markets** group (Market Intelligence, Backtesting, Prop Firm Tracker). `/mentor`, `/psychology`, `/prop-firm` were previously unreachable.
- Dark mode: background `neutral-950` instead of pure black, softened foreground, visible `neutral-800` borders — reduces halation/eye strain.
- Fonts now self-hosted via `next/font` (Poppins + JetBrains Mono) instead of render-blocking CSS `@import`.
