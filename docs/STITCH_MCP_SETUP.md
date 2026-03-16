# Stitch MCP Setup

This repo is wired with a project MCP config at [`/.mcp.json`](../.mcp.json).

## 1) Set token in your shell

```bash
export STITCH_TOKEN="your-stitch-token"
```

## 2) Verify MCP server boots

```bash
node test-stitch.js
```

Expected behavior:
- Process initializes successfully
- `tools/list` returns available Stitch MCP tools

## 3) If your MCP client does not auto-read `.mcp.json`

Add the same server manually in your client:

- Name: `stitch`
- Command: `npx -y stitch-mcp`
- Env: `STITCH_TOKEN=<your-token>`

