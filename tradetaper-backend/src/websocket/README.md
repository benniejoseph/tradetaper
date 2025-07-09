# `tradetaper-backend/src/websocket`

This directory handles real-time communication using WebSockets.

## Directory-Specific Instructions

- This module provides real-time updates for trades and other events.
- It uses Socket.IO gateways to manage WebSocket connections.

## Local Conventions

- Gateways are used to handle WebSocket events.

## Relevant Patterns

- This module uses a gateway to broadcast real-time data to connected clients.

## @imports to Shared Documentation

- @import [Src README](../README.md) 