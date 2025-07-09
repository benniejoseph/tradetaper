# `tradetaper-backend/src/auth`

This directory handles user authentication and authorization.

## Directory-Specific Instructions

- This module contains strategies for JWT, local, and Google authentication.
- Guards are used to protect routes.

## Local Conventions

- Use `Passport` for authentication strategies.
- DTOs are used for login and registration data.

## Relevant Patterns

- Strategies are implemented to handle different authentication providers.
- Guards are used as middleware to protect endpoints.

## @imports to Shared Documentation

- @import [Src README](../README.md) 