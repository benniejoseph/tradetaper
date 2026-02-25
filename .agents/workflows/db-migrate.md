---
description: Run production database migrations
---
This workflow builds the backend to compile the latest entities and migration files, and then executes the pending TypeORM migrations against the production database on Supabase.

// turbo-all

1. Build the backend to compile migrations to the dist directory
```bash
cd tradetaper-backend && npm run build
```

2. Run the production migration command (using credentials from env-vars.yaml)
```bash
cd tradetaper-backend && NODE_ENV=production DB_HOST=db.bzzdioswzlzvvlmellzh.supabase.co DB_PORT=5432 DB_DATABASE=postgres DB_NAME=postgres DB_USER=postgres DB_USERNAME=postgres DB_PASSWORD="c82CrLB987oYJCaWe+7KeQ==" npm run migration:run
```
