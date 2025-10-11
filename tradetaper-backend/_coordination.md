# Backend Coordination Document

This document provides a detailed overview of the `tradetaper-backend` application. All agents operating within this directory must adhere to the guidelines and information presented here.

## 1. Overview

This is a NestJS application that serves as the backend API for the TradeTaper platform. It handles all business logic, data persistence, and communication with external services.

**Key Technologies:**
- **Framework**: NestJS
- **Language**: TypeScript
- **Database**: PostgreSQL with TypeORM
- **Authentication**: JWT, Google OAuth
- **API Specification**: OpenAPI (Swagger)

## 2. Directory Structure

The backend is organized as follows:

- **`src/`**: The main source code directory.
- **`src/auth/`**: Contains all authentication and authorization logic.
- **`src/users/`**: Manages user and account-related functionalities.
- **`src/trades/`**: Handles all logic related to trades, analytics, and reporting.
- **`src/database/`**: Contains the data source configuration and migrations.
- **`src/common/`**: Includes shared modules, filters, guards, and interceptors.
- **`test/`**: Contains all backend end-to-end tests.

## 3. Local Conventions

- **Module-Based Structure**: The application is organized into modules. Each feature should reside in its own module.
- **DTOs for API Contracts**: Use Data Transfer Objects (DTOs) for all API request and response bodies.
- **Dependency Injection**: Utilize NestJS's dependency injection system for all services and providers.
- **Environment Variables**: All configuration should be managed through environment variables, not hardcoded values.

## 4. Agent Instructions

- **Layer 3 (Development) Agents**: When adding new features, create a new module for the feature. Ensure all database interactions are handled through TypeORM repositories.
- **Layer 4 (Intelligence) Agents**: Your analysis should focus on the `src/` directory. Look for performance bottlenecks in database queries, potential security vulnerabilities in the `src/auth/` module, and architectural anti-patterns.
- **All Agents**: Before making any changes, review the existing end-to-end tests in the `test/` directory to ensure you do not break any existing functionality. 