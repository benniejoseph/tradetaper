# TradeTaper

TradeTaper is a comprehensive trade journaling application designed to help traders track, analyze, and improve their performance.

## Project Structure

This repository is a monorepo containing:

*   `tradetaper-frontend/`: The Next.js and Tailwind CSS powered frontend application.
*   `tradetaper-backend/`: The NestJS backend API.

## Key Features (Recently Enhanced)

### Frontend (`tradetaper-frontend/`)

*   **Journal Page (Formerly Trades Page):**
    *   Redesigned UI/UX for a more intuitive experience.
    *   Account-aware: Trades are now linked to and filterable by user accounts.
    *   Advanced Filtering: Filter trades by active position (open/closed), timeframes (1D, 7D, 1M, All, Custom Range), starred status, and search query (symbol, notes, setup).
    *   Comprehensive Header Stats: View monthly progress, account balance, win rate (with visual bar), and long/short ratio (with visual bar).
    *   Detailed Trades Table: Displays key trade information including Pair, Open Date, Account, Session, Holdtime, Entry, Exit, P&L, and R-Multiple. Clickable rows open a preview.
    *   Trade Preview Drawer: A quick-view drawer with detailed trade information (P&L, fees, entry/exit, time, size), notes, setup, mistakes, lessons, and chart image. Includes edit/delete actions and a star toggle.
    *   Footer Summary Stats: Aggregated statistics including Total P&L, Total Trades, Commissions, Total Value Traded, Avg Win, Avg Loss, and Avg R:R.
*   **New/Edit Trade Form:**
    *   Full-width layout with clearly defined sections for Core Info, Entry/Exit, Risk/Reward, Strategy/Analysis, Reflection, and Chart Upload.
    *   Consistent UI styling for both creating new trades and editing existing ones.
    *   Supports adding `isStarred` status to trades.
    *   Dynamic R:R calculation based on entry, stop loss, and take profit.
    *   Creatable tags for better trade organization.
    *   Image upload functionality for trade charts.
*   **Account Management:** Basic account selection and display.

### Backend (`tradetaper-backend/`)

*   **Account-linked Trades:** Trade entity, DTOs, service, and controller updated to support associating trades with user accounts (`accountId`).
*   **Starred Trades:** `isStarred` boolean field added to the Trade entity and integrated into CRUD operations.
*   **Tagging System:** Support for tagging trades.
*   **File Uploads:** Endpoint for uploading trade chart images.
*   **Authentication & Authorization:** User authentication and management.

## Getting Started

(To be added: Instructions for setting up and running the frontend and backend.)

## Contributing

(To be added: Guidelines for contributing to the project.)