# TradeTaper Project Summary

This document provides a comprehensive overview of the TradeTaper application, including its architecture, features, and key functionalities.

## 1. High-Level Architecture

TradeTaper is a full-stack web application designed for forex traders to journal, analyze, and improve their trading performance. It follows a modern monorepo architecture, composed of three main parts:

*   **`tradetaper-frontend`**: A **Next.js** and **React** single-page application that provides the user interface.
*   **`tradetaper-backend`**: A **NestJS** (Node.js) application that serves as the REST API and handles all business logic.
*   **`tradetaper-admin`**: A separate **Next.js** application for administrative purposes.

The entire system is designed for cloud deployment, with extensive configuration for Google Cloud Platform (GCP), including Cloud Run, App Engine, and Cloud SQL.

---

## 2. Core Functionality & Features

### 2.1. Trading Journal

The central feature of TradeTaper is the trading journal. Users can:

*   **Manually Log Trades**: Record detailed information about each trade, including entry/exit points, strategy used, and notes.
*   **Import from MT5**: Connect their MetaTrader 5 (MT5) accounts to automatically sync their trading history, eliminating manual data entry. This is facilitated by the `metaapi.cloud-sdk` and a custom MT5 bridge (`.mq5` file).
*   **Attach Media**: Upload images or other media to their trade notes for better context and analysis.
*   **Advanced Filtering**: Filter and search through their trade history using a variety of parameters.

### 2.2. Performance Analytics

TradeTaper provides a rich set of tools for analyzing trading performance:

*   **Dashboard**: A central dashboard displays key performance indicators (KPIs) like Profit & Loss (P&L), win rate, and top traded pairs.
*   **Breakdowns**: Pie charts and bar charts break down performance by currency pair, strategy, or other metrics.
*   **P&L Calendar**: A calendar heatmap visualizes daily P&L, making it easy to spot winning and losing streaks.
*   **Advanced Analytics Service**: The backend includes a dedicated service (`advanced-analytics.service.ts`) for calculating more complex metrics.

### 2.3. Note-Taking & AI Features

To complement the trading journal, TradeTaper includes a sophisticated note-taking system with AI-powered enhancements:

*   **Rich Text Notes**: Users can create detailed notes, which can be linked to specific trades or exist as standalone entries.
*   **AI Services (`AIService`)**: The application integrates with the Gemini API to provide:
    *   **Speech-to-Text**: Transcribe voice notes directly into text.
    *   **Text Enhancement**: Improve grammar, clarity, summarize, or expand on written text.
    *   **Automatic Tagging & Titling**: Automatically generate relevant tags and a title for a note based on its content.

### 2.4. User & Account Management

*   **Authentication**: Secure user authentication is implemented using a combination of local (email/password) and Google OAuth strategies. JWTs (JSON Web Tokens) are used for session management.
*   **Account Linking**: Users can link multiple trading accounts, including MT5 accounts, to their TradeTaper profile.
*   **Subscription & Billing**: The application is built to handle user subscriptions, integrated with **Stripe**. It includes logic for creating checkout sessions, managing subscription statuses, and handling webhooks for payment events.

### 2.5. Real-time Features

*   **Live Activity Feed**: A WebSocket implementation (`simple-trades.gateway.ts`) provides a live feed of trading activity.
*   **Live Trading Dashboard**: A dedicated dashboard for monitoring live market data and trading positions (likely requires further implementation).

---

## 3. Technical Deep Dive

### 3.1. Backend (`tradetaper-backend`)

*   **Framework**: Built on **NestJS**, a modular and scalable Node.js framework.
*   **Database**: Uses a **PostgreSQL** database, managed via **TypeORM**, a powerful Object-Relational Mapper (ORM). Database migrations are managed with TypeORM's migration tool.
*   **API Structure**: The API is well-structured into modules, each responsible for a specific domain (e.g., `UsersModule`, `TradesModule`, `SubscriptionsModule`).
*   **Configuration**: Uses `@nestjs/config` for environment variable management, allowing for different configurations for development and production.
*   **Deployment**: Includes extensive scripts and configuration for deploying to **Google Cloud Run** and **Google App Engine**, with a strong focus on connecting to a **Cloud SQL** instance via a VPC Access Connector.

### 3.2. Frontend (`tradetaper-frontend`)

*   **Framework**: Built with **Next.js** and **React**.
*   **State Management**: Uses **Redux Toolkit** (`@reduxjs/toolkit`) for centralized state management, with slices for different parts of the application state (e.g., `authSlice`, `tradesSlice`).
*   **Styling**: Uses standard CSS with `globals.css`, indicating a straightforward approach to styling.
*   **API Communication**: Uses `axios` for making requests to the backend API.
*   **Component Library**: Appears to use a custom-built component library, with a focus on creating reusable UI elements for charts, tables, and forms.

### 3.3. Admin (`tradetaper-admin`)

*   A separate Next.js application, likely for managing users, subscriptions, and other administrative tasks. It is less developed than the main frontend and backend.

---

## 4. What You Might Have Missed

Based on the file structure and the debugging session, here are a few key points that might not be immediately obvious:

*   **Serverless First Design**: The entire architecture is geared towards serverless deployments (Cloud Run, App Engine, Vercel). This is evident from the use of the Cloud SQL connector, the read-only filesystem issues, and the stateless nature of the API.
*   **Monorepo, but not fully integrated**: While the projects are in a single repository, they don't use a formal monorepo management tool like Nx or Turborepo. This means dependencies and build processes are managed independently for each project.
*   **Extensive Customization**: The project avoids relying heavily on third-party UI libraries, opting instead to build its own components, especially for data visualization.
*   **Feature-Rich, but Potentially Incomplete**: The codebase contains a vast number of features. Some, like the live trading dashboard, may be placeholders or in the early stages of development. The presence of backup files (`.bak`) suggests a lot of active, in-progress development.
*   **The Deployment Struggle is a Key Feature**: The incredibly detailed and difficult deployment debugging session is, in itself, a feature of this project's current state. It highlights the complexities of deploying a stateful application (requiring a database) in a serverless environment and the importance of perfectly matching the runtime environment between development and production.

This summary should provide a solid foundation for understanding the TradeTaper project, its goals, and its current state. 