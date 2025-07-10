# L1A1: Codebase & Architecture Map

This document provides a high-level overview of the TradeTaper monorepo, including the architecture, technologies, and file structure of each sub-project.

## 1. High-Level Architecture

The TradeTaper project is a monorepo containing three distinct applications:

- **`tradetaper-frontend`**: A Next.js application that serves as the main user-facing client.
- **`tradetaper-backend`**: A NestJS application that provides the API and handles all business logic.
- **`tradetaper-admin`**: A Next.js application for administrative purposes.

## 2. Technology Stack

### 2.1. `tradetaper-frontend`

- **Framework**: Next.js
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Redux Toolkit
- **API Communication**: Axios
- **Testing**: Jest, Playwright

### 2.2. `tradetaper-backend`

- **Framework**: NestJS
- **Language**: TypeScript
- **Database**: PostgreSQL with TypeORM
- **API**: RESTful API with WebSockets
- **Authentication**: Passport.js (JWT, Google OAuth)
- **Integrations**: Stripe, MetaAPI, Google Cloud Storage

### 2.3. `tradetaper-admin`

- **Framework**: Next.js
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **API Communication**: Axios

## 3. File Structure

### 3.1. `tradetaper-frontend`

```
/Users/benniejoseph/Documents/TradeTaper/tradetaper-frontend
├── public/
├── src/
│   ├── app/
│   ├── components/
│   ├── config/
│   ├── context/
│   ├── hooks/
│   ├── lib/
│   ├── services/
│   ├── store/
│   └── styles/
└── tests/
```

### 3.2. `tradetaper-backend`

```
/Users/benniejoseph/Documents/TradeTaper/tradetaper-backend
├── src/
│   ├── admin/
│   ├── auth/
│   ├── common/
│   ├── content/
│   ├── database/
│   ├── files/
│   ├── market-data/
│   ├── migrations/
│   ├── notes/
│   ├── seed/
│   ├── strategies/
│   ├── subscriptions/
│   ├── tags/
│   ├── trades/
│   ├── types/
│   ├── users/
│   └── websocket/
└── test/
```

### 3.3. `tradetaper-admin`

```
/Users/benniejoseph/Documents/TradeTaper/tradetaper-admin
├── public/
└── src/
    ├── app/
    ├── components/
    ├── hooks/
    └── lib/
```