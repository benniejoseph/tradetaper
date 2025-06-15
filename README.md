# TradeTaper - Professional Trading Journal Platform

A comprehensive trading journal application with MetaTrader 5 integration, real-time analytics, and subscription management.

## Project Structure

```
tradetaper/
├── tradetaper-backend/     # NestJS backend API
├── tradetaper-frontend/    # Next.js main application
├── tradetaper-admin/       # Next.js admin dashboard
├── deploy-gcp.sh          # GCP deployment script
└── GCP_DEPLOYMENT_GUIDE.md # Deployment documentation
```

## Features

- 📊 **Trading Journal**: Track trades with detailed analytics
- 🤖 **MT5 Integration**: Automatic trade import from MetaTrader 5
- 📈 **Real-time Analytics**: Performance metrics and insights
- 💳 **Subscription Management**: Stripe integration for payments
- 👥 **Admin Dashboard**: User and system management
- 🔒 **Secure Authentication**: JWT-based auth system
- ☁️ **Cloud Storage**: Google Cloud Storage for images

## Tech Stack

- **Backend**: NestJS, TypeORM, PostgreSQL
- **Frontend**: Next.js 15, React 19, TypeScript
- **Admin**: Next.js 15, Recharts, React Query
- **Infrastructure**: Google Cloud Run, Cloud SQL
- **Payments**: Stripe
- **Trading**: MetaAPI

## Quick Start

### Prerequisites
- Node.js v20.x
- Docker
- Google Cloud SDK
- PostgreSQL (for local development)

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/tradetaper.git
   cd tradetaper
   ```

2. **Install dependencies**
   ```bash
   npm install
   cd tradetaper-backend && npm install
   cd ../tradetaper-frontend && npm install
   cd ../tradetaper-admin && npm install
   ```

3. **Set up environment variables**
   - Copy `.env.example` to `.env` in each directory
   - Fill in required values

4. **Start development servers**
   ```bash
   # Backend (port 3000)
   cd tradetaper-backend && npm run start:dev
   
   # Frontend (port 3001)
   cd tradetaper-frontend && npm run dev
   
   # Admin (port 3002)
   cd tradetaper-admin && npm run dev
   ```

## Deployment

### Google Cloud Platform

See [GCP_DEPLOYMENT_GUIDE.md](./GCP_DEPLOYMENT_GUIDE.md) for detailed deployment instructions.

Quick deploy:
```bash
./deploy-gcp.sh your-project-id
```

## Environment Variables

### Backend
- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: Secret for JWT tokens
- `STRIPE_SECRET_KEY`: Stripe API key
- `METAAPI_TOKEN`: MetaAPI authentication token
- `GCS_BUCKET_NAME`: Google Cloud Storage bucket

### Frontend
- `NEXT_PUBLIC_API_URL`: Backend API URL
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`: Stripe public key

## API Documentation

- Health Check: `GET /api/v1/health`
- Authentication: `POST /api/v1/auth/login`
- Trades: `GET /api/v1/trades`
- Admin: `GET /api/v1/admin/*`

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, email support@tradetaper.com or join our Discord community.