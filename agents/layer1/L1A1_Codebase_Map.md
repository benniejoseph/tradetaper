# L1A1: Codebase & Architecture Map

This document outlines the architecture and key components of the TradeTaper monorepo.

## 1. Project Overview & Technology Stack

The TradeTaper project is a monorepo containing three distinct applications. The initial analysis confirms the architecture described in the project summary.

### 1.1. `tradetaper-backend`

*   **Framework**: NestJS (`@nestjs/core`)
*   **Database**: PostgreSQL
*   **ORM**: TypeORM (`typeorm`, `@nestjs/typeorm`)
*   **Authentication**: Passport.js (`@nestjs/passport`, `passport-local`, `passport-google-oauth20`)
*   **AI**: Google Generative AI (`@google/generative-ai`)
*   **Payments**: Stripe (`stripe`)
*   **Trading Data**: MetaAPI (`metaapi.cloud-sdk`)
*   **Deployment**: Docker & GCP Cloud Run (`Dockerfile`, `cloudbuild.yaml`)

### 1.2. `tradetaper-frontend`

*   **Framework**: Next.js (`next`)
*   **UI**: React, Tailwind CSS
*   **State Management**: Redux Toolkit (`@reduxjs/toolkit`)
*   **API Communication**: Axios, Socket.IO
*   **Payments**: Stripe.js (`@stripe/react-stripe-js`)
*   **Charting**: Lightweight Charts, Recharts
*   **Testing**: Jest, Playwright (`@playwright/test`)
*   **Deployment**: Vercel

### 1.3. `tradetaper-admin`

*   **Framework**: Next.js (`next`)
*   **UI**: React, Tailwind CSS
*   **Data Fetching**: TanStack Query (`@tanstack/react-query`)
*   **API Communication**: Axios, Socket.IO
*   **Deployment**: Vercel

---

## 2. Backend Architecture (`tradetaper-backend`)

The backend follows a modular architecture typical of NestJS applications.

### 2.1. API Controllers (`*controller.ts`)

The following controllers define the primary API endpoints:

*   `admin/admin.controller.ts`
*   `app.controller.ts`
*   `auth/auth.controller.ts`
*   `auth/google-oauth.controller.ts`
*   `auth/manual-google-oauth.controller.ts`
*   `auth/test.controller.ts`
*   `content/content.controller.ts`
*   `files/files.controller.ts`
*   `market-data/market-data-public.controller.ts`
*   `market-data/market-data.controller.ts`
*   `notes/ai.controller.ts`
*   `notes/calendar.controller.ts`
*   `notes/media.controller.ts`
*   `notes/notes.controller.ts`
*   `strategies/strategies.controller.ts`
*   `subscriptions/subscriptions.controller.ts`
*   `subscriptions/webhooks.controller.ts`
*   `trades/trades.controller.ts`
*   `users/accounts.controller.ts`
*   `users/mt5-accounts.controller.ts`

### 2.2. Data Models / Entities (`*entity.ts`)

The following TypeORM entities define the database schema:

*   `notes/entities/note-block.entity.ts`
*   `notes/entities/note-media.entity.ts`
*   `notes/entities/note.entity.ts`
*   `notes/entities/psychological-insight.entity.ts`
*   `strategies/entities/strategy.entity.ts`
*   `subscriptions/entities/subscription.entity.ts`
*   `subscriptions/entities/usage.entity.ts`
*   `tags/entities/tag.entity.ts`
*   `trades/entities/trade.entity.ts`
*   `users/entities/account.entity.ts`
*   `users/entities/mt5-account.entity.ts`
*   `users/entities/user.entity.ts`

---

## 3. Frontend Architecture (`tradetaper-frontend`)

The frontend uses the Next.js App Router for routing and application structure.

### 3.1. Page Routes (`src/app`)

The primary application routes for authenticated users are located in the `(app)` route group:

*   `/dashboard`
*   `/journal`
*   `/trades`
*   `/notes`
*   `/analytics`
*   `/strategies`
*   `/settings`
*   `/billing`
*   `/pricing`

Other top-level routes include `/login`, `/register`, and `/support`.

### 3.2. UI Components (`src/components`)

Components are organized by feature, mirroring the route structure. Key component directories include:

*   `analytics`
*   `auth`
*   `charts`
*   `common`
*   `dashboard`
*   `journal`
*   `layout`
*   `notes`
*   `pricing`
*   `settings`
*   `trades`
*   `ui` (for generic, reusable UI elements)