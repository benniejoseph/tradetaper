# 🚀 TradeTaper Admin Dashboard

A comprehensive, modern admin dashboard for the TradeTaper trading platform. Built with Next.js, TypeScript, and Tailwind CSS, featuring real-time analytics, geographic insights, and beautiful visualizations.

## ✨ Features

### 📊 Analytics & Insights
- **Real-time metrics** with live updates every 30 seconds
- **Interactive charts** using Recharts for revenue, user activity, and trading data
- **System health monitoring** with uptime, performance, and API metrics
- **Geographic analytics** with world map visualization
- **Top trading pairs** analysis and volume tracking

### 🌍 Geographic Intelligence
- **World map** showing global user distribution
- **Country-wise breakdown** of users, trades, and revenue
- **Regional performance** analysis with detailed tables
- **IP-based location tracking** for user activities

### ⚡ Real-time Features
- **Live activity feed** with user actions and system events
- **Real-time notifications** for critical alerts
- **Auto-refreshing data** with configurable intervals
- **Live user tracking** with location and activity status

### 🎨 Modern UI/UX
- **Dark theme** optimized for admin work
- **Responsive design** for all devices
- **Beautiful animations** with Framer Motion
- **Glassmorphism effects** and modern styling
- **Collapsible sidebar** with tooltips
- **Loading states** and skeleton screens

### 🔧 Technical Features
- **TypeScript** for type safety
- **React Query** for efficient data fetching
- **Tailwind CSS** for responsive styling
- **ESLint** and **Prettier** for code quality
- **Next.js 15** with App Router
- **Vercel deployment** ready

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
   NEXT_PUBLIC_API_URL=https://your-backend-api.com/api/v1
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
