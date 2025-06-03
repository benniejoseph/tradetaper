# 🚀 TradeTaper Admin Dashboard

A comprehensive, modern admin dashboard for the TradeTaper trading platform. Built with Next.js, TypeScript, and Tailwind CSS, featuring real-time analytics, geographic insights, and beautiful visualizations.

## ✨ Features

### 🏠 **Main Dashboard**
- **Real-time Analytics**: Live data from TradeTaper backend API hosted on Railway
- **Key Metrics**: Total users, active users, trades, revenue with growth indicators
- **Interactive Charts**: Revenue trends, user activity, trade volume using Recharts
- **System Health**: Uptime monitoring, response times, CPU/memory usage
- **Top Trading Pairs**: Most popular currency pairs with trade counts and volumes
- **Recent Activity Feed**: Live user activities with auto-refresh every 5 seconds

### 👥 **User Management**
- **User Overview**: Total users, active users, new signups, churn analytics
- **User Search & Filtering**: Real-time search by name, email with pagination
- **User Profiles**: Detailed user information with join dates and status
- **User Status Tracking**: New users, active users, churned users identification
- **Export Functionality**: Download user data for external analysis

### 💹 **Trade Management**
- **Trade Analytics**: Total trades, volume, P&L, win rate statistics
- **Live Trade Monitoring**: Real-time trade table with status tracking
- **Trade Filtering**: Filter by status (open/closed), search by pair or trader
- **Trading Pairs Analysis**: Top performing currency pairs with volume metrics
- **P&L Tracking**: Profit/loss calculations with color-coded indicators
- **Trade Details**: Entry/exit prices, amounts, timestamps, trader information

### 💰 **Subscription Analytics**
- **Revenue Metrics**: Total revenue, ARPU, churn rate, growth trends
- **Plan Distribution**: Visual breakdown of Free, Pro, Premium subscribers
- **Revenue Trends**: Monthly revenue charts with subscriber growth
- **Plan Comparison**: Detailed analysis of each subscription tier
- **Churn Analysis**: User retention and churn rate monitoring
- **Revenue Forecasting**: Growth projections and trend analysis

### 🌍 **Geographic Analytics**
- **Global User Distribution**: Interactive world map with user locations
- **Country Breakdown**: Users, trades, revenue by country
- **Regional Performance**: Top performing markets and regions
- **Geographic Insights**: Market penetration analysis by location
- **Export Geographic Data**: Download country-wise performance reports

### 📊 **Live Activity Monitor**
- **Real-time Activity Feed**: Live user actions and system events
- **Activity Analytics**: Event types breakdown with statistics
- **Geographic Activity**: Real-time activity by location
- **Event Filtering**: Filter by activity type, user, time range
- **Performance Metrics**: Response times and system health indicators

## 🛠️ Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Animations**: Framer Motion
- **State Management**: React Query (TanStack Query)
- **Icons**: Lucide React
- **Deployment**: Vercel

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/benniejoseph/tradetaper.git
   cd tradetaper/tradetaper-admin
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Configure the following variables:
   ```env
   NEXT_PUBLIC_API_URL=https://tradetaper-backend-production.up.railway.app/api/v1
   NEXT_PUBLIC_APP_NAME=TradeTaper Admin Dashboard
   NEXT_PUBLIC_APP_VERSION=1.0.0
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📱 Pages & Features

### 🏠 Dashboard (`/`)
- Overview of key metrics and KPIs
- Revenue and user activity charts
- System health status
- Recent activity feed
- Top trading pairs

### 🌍 Geographic Analytics (`/geographic`)
- World map with user distribution
- Country-wise performance metrics
- Regional breakdown tables
- Geographic filters and sorting

### 📊 Analytics (`/analytics`) - Coming Soon
- Advanced analytics and reporting
- Custom date ranges and filters
- Export functionality
- Detailed performance insights

### 👥 Users (`/users`) - Coming Soon
- User management interface
- User activity tracking
- Subscription status monitoring
- User analytics and insights

### 💰 Revenue (`/revenue`) - Coming Soon
- Revenue analytics and forecasting
- Subscription revenue tracking
- Payment analytics
- Financial reporting

## 🎨 Design Philosophy

The dashboard is designed with inspiration from modern admin interfaces on Behance, focusing on:

- **Dark-first design** for reduced eye strain during extended use
- **Information hierarchy** with clear visual structure
- **Interactive elements** with smooth animations
- **Data visualization** that tells a story
- **Responsive layout** that works on all devices

## 🔧 Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript checks

### Code Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── page.tsx           # Dashboard home page
│   ├── geographic/        # Geographic analytics
│   └── layout.tsx         # Root layout
├── components/            # Reusable components
│   ├── Sidebar.tsx        # Navigation sidebar
│   ├── StatsCards.tsx     # Metric cards
│   ├── WorldMap.tsx       # Geographic visualization
│   └── LiveActivityFeed.tsx # Real-time activity
├── lib/                   # Utilities and helpers
│   ├── api.ts            # API client and types
│   └── utils.ts          # Helper functions
└── types/                 # TypeScript type definitions
```

## 📊 Data Sources

The dashboard currently uses mock data for demonstration purposes. In a production environment, it would connect to:

- **TradeTaper Backend API** for user and trading data
- **Analytics service** for real-time metrics
- **Geographic service** for location data
- **System monitoring** for health metrics

## 🚀 Deployment

### Vercel (Recommended)

1. **Connect to Vercel**
   ```bash
   npm install -g vercel
   vercel
   ```

2. **Configure environment variables** in Vercel dashboard

3. **Deploy**
   ```bash
   vercel --prod
   ```

### Manual Deployment

1. **Build the project**
   ```bash
   npm run build
   ```

2. **Start the production server**
   ```bash
   npm start
   ```

## 🔒 Security Considerations

- Environment variables are properly configured
- API endpoints use HTTPS
- No sensitive data in client-side code
- Proper error handling and logging
- Rate limiting considerations for API calls

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📝 License

This project is part of the TradeTaper platform. All rights reserved.

## 🔗 Links

- **Live Demo**: [https://tradetaper-admin-mya0n91q3-benniejosephs-projects.vercel.app](https://tradetaper-admin-mya0n91q3-benniejosephs-projects.vercel.app)
- **Main App**: [https://tradetaper-frontend-benniejosephs-projects.vercel.app](https://tradetaper-frontend-benniejosephs-projects.vercel.app)
- **Backend API**: [https://tradetaper-backend-production.up.railway.app](https://tradetaper-backend-production.up.railway.app)

## 📞 Support

For support, email admin@tradetaper.com or create an issue in the GitHub repository.

---

Built with ❤️ by the TradeTaper team
