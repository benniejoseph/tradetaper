#!/bin/bash

echo "🚀 Deploying Strategies Feature to Railway..."

# Ensure we're in the right directory
cd "$(dirname "$0")"

# Check if we have uncommitted changes
if [[ -n $(git status --porcelain) ]]; then
    echo "📝 Committing latest changes..."
    git add .
    git commit -m "Deploy strategies feature with database migration

- Add strategies table migration script
- Update frontend to use Railway backend
- Include database schema updates for PostgreSQL

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"
fi

# Push to main branch (Railway auto-deploys from main)
echo "📤 Pushing to main branch..."
git push origin main

echo "✅ Code pushed to Railway!"
echo ""
echo "🔧 Next steps:"
echo "1. Wait for Railway deployment to complete (~2-3 minutes)"
echo "2. Run database migration manually via Railway dashboard or connect to DB"
echo "3. Execute the SQL in: tradetaper-backend/src/migrations/create-strategies-table.sql"
echo ""
echo "🌐 Railway Dashboard: https://railway.app/dashboard"
echo "📊 Your project should be deploying now..."