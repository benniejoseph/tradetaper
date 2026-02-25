---
description: Format and Lint all projects
---
This workflow runs prettier formatting and strict ESLint checking across all three TypeScript projects in the repository to ensure no syntax errors block the CI/CD pipeline.

// turbo-all

1. Format Backend code
```bash
cd tradetaper-backend && npm run format
```

2. Lint Backend
```bash
cd tradetaper-backend && npm run lint
```

3. Lint Frontend
```bash
cd tradetaper-frontend && npm run lint
```

4. Lint Admin
```bash
cd tradetaper-admin && npm run lint
```
