#!/bin/bash
set -e

echo "Starting isolated npm build..."

# Clear any npm workspace-related environment variables
unset npm_config_workspace
unset npm_config_workspaces
unset npm_config_workspaces_update
unset NPM_CONFIG_WORKSPACE
unset NPM_CONFIG_WORKSPACES

# Remove any potential workspace config files
rm -f .npmrc .yarnrc .pnpmrc

# Run the build command
npm run build

echo "Build completed successfully" 