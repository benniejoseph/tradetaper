# Terminal Farm

This directory contains the infrastructure for running MT5 terminals server-side for automatic trade synchronization.

## Architecture

```
┌─────────────────────────────────────┐
│          Docker Container           │
│  ┌─────────────────────────────┐   │
│  │    MT5 Terminal (WINE)       │   │
│  │    + TradeTaperSync EA       │   │
│  └──────────────┬──────────────┘   │
│                 │ HTTP POST         │
└─────────────────┼───────────────────┘
                  │
                  ▼
┌─────────────────────────────────────┐
│     TradeTaper Backend API          │
│  /webhook/terminal/*                │
└─────────────────────────────────────┘
```

## Quick Start (Development)

1. **Build the Docker image:**
   ```bash
   cd terminal-farm
   docker-compose build
   ```

2. **Configure environment variables:**
   Create a `.env` file:
   ```env
   MT5_SERVER=ICMarkets-Demo02
   MT5_LOGIN=12345678
   MT5_PASSWORD=your_password
   TERMINAL_ID=dev-001
   API_ENDPOINT=http://host.docker.internal:3000
   ```

3. **Start the terminal:**
   ```bash
   docker-compose up -d
   ```

4. **View terminal (optional):**
   Connect via VNC to `localhost:5900`

## Files

| File | Purpose |
|------|---------|
| `Dockerfile` | MT5 + WINE container image |
| `docker-compose.yml` | Local development setup |
| `supervisor.conf` | Process management |
| `scripts/start-terminal.sh` | Container startup |
| `ea/TradeTaperSync.mq5` | MQL5 Expert Advisor |

## MQL5 Expert Advisor

The `TradeTaperSync.mq5` EA runs inside MT5 and:
- Sends heartbeat every 60 seconds
- Syncs trade history every 5 minutes
- Sends position updates on trade events

### Webhook Endpoints

| Endpoint | Purpose |
|----------|---------|
| `POST /webhook/terminal/heartbeat` | Connection heartbeat + account info |
| `POST /webhook/terminal/trades` | Trade history sync |
| `POST /webhook/terminal/positions` | Live positions update |

## Production Deployment

For production, deploy to a VPS with:
- Ubuntu 22.04 LTS
- Docker + Docker Compose
- At least 2GB RAM per terminal

### Scaling

Each terminal requires approximately:
- 500MB - 1GB RAM
- 1GB disk space
- Minimal CPU (< 0.5 vCPU)

For 10 users: 1 VPS ($15-20/mo)
For 50 users: 2-3 VPS ($40-60/mo)
For 100+ users: Kubernetes cluster

## Security Notes

- MT5 credentials are passed as environment variables
- Never commit `.env` files
- Use TERMINAL_WEBHOOK_SECRET for API authentication
- Consider VPN for terminal-to-API communication

## Orchestrator Automation (Multi-Account)

To automate the management of multiple terminals on a single VM, use the `orchestrator.py` script.

### Prerequisites
- Python 3.8+
- Docker SDK for Python (`pip install docker requests`)
- Docker Engine running

### Usage
1. Set the environment variables:
   ```bash
   export API_ENDPOINT="https://api.tradetaper.io"
   export ORCHESTRATOR_SECRET="your-orchestrator-secret"
   export IMAGE_NAME="tradetaper/mt5-terminal:latest"
   ```

2. Run the orchestrator:
   ```bash
   python3 orchestrator.py
   ```

The script will poll the API every 60 seconds and automatically start/stop Docker containers to match your enabled accounts in the TradeTaper Dashboard.
