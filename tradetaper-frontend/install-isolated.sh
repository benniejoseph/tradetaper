#!/bin/bash
set -e

echo "Starting isolated npm install..."

# Clear any npm workspace-related environment variables
unset npm_config_workspace
unset npm_config_workspaces
unset npm_config_workspaces_update
unset NPM_CONFIG_WORKSPACE
unset NPM_CONFIG_WORKSPACES

# Clear npm cache completely
npm cache clean --force 2>/dev/null || true

# Remove any potential workspace config files
rm -f .npmrc .yarnrc .pnpmrc

# Install dependencies with minimal flags to avoid conflicts
npm install --ignore-engines

echo "Installation completed successfully" 