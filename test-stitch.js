const { spawn } = require('child_process');
if (!process.env.STITCH_TOKEN) {
  console.error('Missing STITCH_TOKEN env var');
  process.exit(1);
}

const server = spawn('npx', ['-y', 'stitch-mcp'], {
  env: { ...process.env, STITCH_TOKEN: process.env.STITCH_TOKEN },
  stdio: ['pipe', 'pipe', 'inherit']
});
server.stdout.on('data', data => console.log('OUT:', data.toString()));
server.stdin.write(JSON.stringify({
  jsonrpc: "2.0", id: 1, method: "initialize",
  params: { protocolVersion: "2024-11-05", capabilities: {}, clientInfo: { name: "test", version: "1" } }
}) + "\n");
setTimeout(() => {
  server.stdin.write(JSON.stringify({ jsonrpc: "2.0", id: 2, method: "tools/list" }) + "\n");
}, 2000);
setTimeout(() => server.kill(), 4000);
