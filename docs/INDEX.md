# TradeTaper Documentation Index

**Last Updated:** February 10, 2026

This directory contains all project documentation organized by category.

---

## 📚 Documentation Structure

### 📖 [Overview](./overview/)
Project-level documentation and guides for AI assistants.

- **[CLAUDE.md](./overview/CLAUDE.md)** - Complete project context for AI assistants
  - Architecture, tech stack, project structure
  - Key features, security implementations
  - Development guidelines, common tasks
  - Comprehensive reference for the entire project

---

### 🔒 [Security](./security/)
Security implementations, fixes, and best practices.

- **[walkthrough_security_cleanup.md](./security/walkthrough_security_cleanup.md)** - Security audit and cleanup walkthrough
  - Phase 1 & 2 critical fixes
  - CVE remediations, admin guard fixes
  - SQL injection protection

- **[CSRF-PROTECTION.md](./security/CSRF-PROTECTION.md)** - CSRF protection implementation guide
  - Double Submit Cookie pattern
  - Frontend integration steps
  - Testing and verification

---

### 🏗️ [Infrastructure](./infrastructure/)
Deployment, caching, and infrastructure documentation.

- **[REDIS_SETUP.md](./infrastructure/REDIS_SETUP.md)** - Redis setup and configuration guide
  - GCP Memorystore setup
  - Connection configuration
  - Troubleshooting

- **[REDIS-DEPLOYMENT-SUMMARY.md](./infrastructure/REDIS-DEPLOYMENT-SUMMARY.md)** - Redis deployment summary
  - Implementation details
  - Performance improvements
  - Cost analysis

- **[DEPLOYMENT-SUMMARY.md](./infrastructure/DEPLOYMENT-SUMMARY.md)** - General deployment guide
  - Backend (Cloud Run)
  - Frontend (Vercel)
  - Environment configuration

- **[FINAL-DEPLOYMENT-STATUS.md](./infrastructure/FINAL-DEPLOYMENT-STATUS.md)** - Current deployment status
  - Production URLs
  - Service health
  - Configuration verification

---

### 🗄️ [Database](./database/)
Database architecture, migrations, and optimizations.

- **[DATABASE-ARCHITECTURE-AUDIT.md](./database/DATABASE-ARCHITECTURE-AUDIT.md)** - Complete database audit
  - Schema review
  - Index recommendations
  - Query optimization

- **[SUPABASE-MIGRATION-COMPLETE.md](./database/SUPABASE-MIGRATION-COMPLETE.md)** - Supabase migration report
  - Migration steps completed
  - Verification results
  - Post-migration cleanup

- **[SUPABASE-VS-CLOUDSQL-ANALYSIS.md](./database/SUPABASE-VS-CLOUDSQL-ANALYSIS.md)** - Cost comparison analysis
  - Detailed cost breakdown
  - Feature comparison
  - Migration decision rationale

---

### ✨ [Features](./features/)
Feature implementations, integrations, and guides.

#### MT5 Integration
- **[MT5-TERMINAL-INTEGRATION-ANALYSIS.md](./features/MT5-TERMINAL-INTEGRATION-ANALYSIS.md)** - Complete MT5 analysis
  - Architecture review
  - Implementation details
  - Issues and recommendations

- **[MT5-INTEGRATION-IMPROVEMENTS.md](./features/MT5-INTEGRATION-IMPROVEMENTS.md)** - MT5 improvements implemented
  - Bug fixes
  - Enhancements
  - Testing results

- **[MT5-AUTO-SYNC-GUIDE.md](./features/MT5-AUTO-SYNC-GUIDE.md)** - User guide for MT5 auto-sync
  - Setup instructions
  - Configuration steps
  - Troubleshooting

- **[MT4_MT5 Data Fetching Solutions.md](./features/MT4_MT5 Data Fetching Solutions.md)** - Technical solutions for MT4/MT5 data fetching

#### Notification System
- **[NOTIFICATION-FRAMEWORK-IMPLEMENTATION.md](./features/NOTIFICATION-FRAMEWORK-IMPLEMENTATION.md)** - Notification framework implementation plan
  - Architecture overview
  - Integration checklist
  - Backend and frontend components

- **[NOTIFICATION-INTEGRATION-COMPLETE.md](./features/NOTIFICATION-INTEGRATION-COMPLETE.md)** - Integration completion report
  - Implemented features
  - Testing results
  - Known limitations

- **[NOTIFICATION-DEPLOYMENT-SUCCESS.md](./features/NOTIFICATION-DEPLOYMENT-SUCCESS.md)** - Deployment success report
  - Deployment steps
  - Verification
  - Post-deployment status

---

### ⚡ [Performance](./performance/)
Performance optimizations, cost analysis, and improvements.

- **[PHASE-8-COMPLETE.md](./performance/PHASE-8-COMPLETE.md)** - Phase 8 performance optimization summary
  - Redis caching implementation
  - Component memoization
  - Lazy loading
  - Cost savings analysis

- **[COST-BUDGET-ANALYSIS.md](./performance/COST-BUDGET-ANALYSIS.md)** - Detailed cost analysis
  - Monthly cost breakdown
  - Optimization opportunities
  - Budget recommendations

- **[COST-OPTIMIZATION-IMPLEMENTATION.md](./performance/COST-OPTIMIZATION-IMPLEMENTATION.md)** - Cost optimization implementation
  - Specific optimizations applied
  - Expected savings
  - Monitoring recommendations

- **[LAZY_LOADING.md](./performance/LAZY_LOADING.md)** - Lazy loading implementation guide
  - Components to lazy load
  - Implementation patterns
  - Performance metrics

---

### 🔧 [Troubleshooting](./troubleshooting/)
Issue reports, diagnostics, and fixes.

#### WebSocket Issues
- **[WEBSOCKET-ROOT-CAUSE-FOUND.md](./troubleshooting/WEBSOCKET-ROOT-CAUSE-FOUND.md)** - Root cause analysis and fix
  - Problem: NotificationsGateway not registered
  - Solution: Register in SimpleWebSocketModule
  - Complete timeline

- **[WEBSOCKET-ISSUE-DEEP-DIVE.md](./troubleshooting/WEBSOCKET-ISSUE-DEEP-DIVE.md)** - Deep investigation into WebSocket issues
  - Multiple debugging attempts
  - False leads analyzed
  - Final solution path

- **[WEBSOCKET-DIAGNOSTIC.md](./troubleshooting/WEBSOCKET-DIAGNOSTIC.md)** - WebSocket diagnostic commands
  - Browser console tests
  - Verification steps
  - Expected results

#### Other Issues
- **[NAVIGATION-FIX-REPORT.md](./troubleshooting/NAVIGATION-FIX-REPORT.md)** - Navigation and routing fixes
  - Issues identified
  - Fixes implemented
  - Testing results

---

## 📝 Quick Reference

### For Developers
- **Getting Started:** [README.md](../README.md)
- **Project Context:** [docs/overview/CLAUDE.md](./overview/CLAUDE.md)
- **Security:** [docs/security/](./security/)
- **Deployment:** [docs/infrastructure/DEPLOYMENT-SUMMARY.md](./infrastructure/DEPLOYMENT-SUMMARY.md)

### For AI Assistants
- **Primary Reference:** [docs/overview/CLAUDE.md](./overview/CLAUDE.md)
- **Security Context:** [docs/security/](./security/)
- **Feature Implementations:** [docs/features/](./features/)

### For Troubleshooting
- **WebSocket Issues:** [docs/troubleshooting/WEBSOCKET-ROOT-CAUSE-FOUND.md](./troubleshooting/WEBSOCKET-ROOT-CAUSE-FOUND.md)
- **Performance Issues:** [docs/performance/](./performance/)
- **Database Issues:** [docs/database/](./database/)

---

## 🔄 Maintenance

This index should be updated whenever:
- New documentation is added
- Documentation is reorganized
- Major features are implemented
- Critical issues are resolved

**Last Reviewed:** February 10, 2026
