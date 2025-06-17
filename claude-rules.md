# TradeTaper Claude Rules

## Project Overview
TradeTaper is a professional trading journal platform with MetaTrader 5 integration, consisting of three main applications:
- **tradetaper-backend**: NestJS API server with TypeORM, PostgreSQL, WebSockets
- **tradetaper-frontend**: Next.js 15 main application with Redux Toolkit
- **tradetaper-admin**: Next.js 15 admin dashboard with React Query

## Global Rules

### General Coding Standards
- **TypeScript**: Use strict typing, avoid `any`, prefer interfaces over types
- **Error Handling**: Always implement proper error handling with try-catch blocks
- **Security**: Never expose sensitive data, validate all inputs, use proper authentication
- **Performance**: Optimize database queries, implement caching where appropriate
- **Testing**: Write unit tests for critical business logic
- **Documentation**: Include JSDoc comments for complex functions and APIs

### Git Practices
- Use conventional commits: `feat:`, `fix:`, `refactor:`, `docs:`, etc.
- Create feature branches from main
- Write descriptive commit messages
- Include issue numbers in commits when applicable

### Environment Management
- Never commit `.env` files
- Use `.env.example` for documentation
- Validate required environment variables on startup
- Use different configs for dev/staging/production

---

## tradetaper-backend/ Rules

### Architecture Patterns
- **NestJS Modules**: Follow feature-based module organization
- **Controllers**: Handle HTTP requests, delegate business logic to services
- **Services**: Contain business logic, inject repositories and other services
- **DTOs**: Use for request/response validation with class-validator
- **Entities**: TypeORM entities with proper relationships and constraints
- **Guards**: Implement authentication and authorization
- **Interceptors**: Use for logging, transformation, and caching

### Code Organization
```
src/
├── modules/           # Feature modules (auth, users, trades, etc.)
├── common/           # Shared utilities, guards, interceptors
├── database/         # Database configuration and migrations
├── config/          # Configuration modules
└── types/           # Global type definitions
```

### Database & TypeORM
- **Migrations**: Always create migrations for schema changes
- **Entities**: Use decorators properly, define relationships clearly
- **Repositories**: Use TypeORM repository pattern, avoid query builders in services
- **Transactions**: Use transactions for multi-step operations
- **Indexes**: Add appropriate indexes for performance

### API Design
- **RESTful**: Follow REST conventions consistently
- **Versioning**: Use `/api/v1/` prefix for all endpoints
- **Status Codes**: Use appropriate HTTP status codes
- **Validation**: Validate all inputs using DTOs and class-validator
- **Pagination**: Implement pagination for list endpoints
- **Rate Limiting**: Implement rate limiting for public endpoints

### WebSocket Implementation
- **Gateways**: Use NestJS WebSocket gateways for real-time features
- **Authentication**: Implement WebSocket authentication
- **Room Management**: Use Socket.IO rooms for targeted messaging
- **Error Handling**: Handle WebSocket errors gracefully
- **Namespace**: Use appropriate namespaces for different features

### Security
- **JWT**: Use JWT for stateless authentication
- **Bcrypt**: Hash passwords with bcrypt
- **CORS**: Configure CORS appropriately
- **Rate Limiting**: Implement rate limiting
- **Input Validation**: Sanitize and validate all inputs
- **File Upload**: Validate file types and sizes

### Testing
- **Unit Tests**: Test services and utilities
- **Integration Tests**: Test controllers and database interactions
- **E2E Tests**: Test complete user flows
- **Mocking**: Mock external dependencies in tests

### Deployment
- **Docker**: Use multi-stage builds for optimization
- **Environment**: Use environment-specific configurations
- **Health Checks**: Implement health check endpoints
- **Logging**: Use structured logging with appropriate levels
- **Monitoring**: Implement error tracking and performance monitoring

---

## tradetaper-frontend/ Rules

### Architecture Patterns
- **App Router**: Use Next.js 15 App Router exclusively
- **Server Components**: Prefer server components when possible
- **Client Components**: Use 'use client' only when necessary
- **Redux Toolkit**: Use RTK for global state management
- **React Hook Form**: Use for form handling and validation
- **SWR/React Query**: Consider for server state management

### Code Organization
```
src/
├── app/              # Next.js App Router pages and layouts
├── components/       # Reusable UI components
├── store/           # Redux store and slices
├── hooks/           # Custom React hooks
├── services/        # API service functions
├── utils/           # Utility functions
├── types/           # TypeScript type definitions
├── config/          # Configuration files
└── lib/             # Third-party library configurations
```

### Component Guidelines
- **Functional Components**: Use only functional components with hooks
- **Props Interface**: Define interfaces for all component props
- **Default Props**: Use default parameters instead of defaultProps
- **Composition**: Favor composition over inheritance
- **Single Responsibility**: Each component should have one clear purpose
- **Accessibility**: Include proper ARIA attributes and semantic HTML

### State Management
- **Redux Toolkit**: Use createSlice for reducers
- **Async Thunks**: Use createAsyncThunk for API calls
- **Selectors**: Create memoized selectors with createSelector
- **Local State**: Use useState for component-local state
- **Form State**: Use React Hook Form for complex forms

### Styling
- **Tailwind CSS**: Use Tailwind for styling
- **CSS Modules**: Use for component-specific styles when needed
- **Responsive Design**: Implement mobile-first responsive design
- **Design System**: Follow consistent spacing, colors, and typography
- **Dark Mode**: Support dark mode where applicable

### API Integration
- **Axios**: Use configured axios instance for API calls
- **Error Handling**: Implement global error handling
- **Loading States**: Show loading indicators for async operations
- **Optimistic Updates**: Implement optimistic UI updates where appropriate
- **Caching**: Cache API responses appropriately

### Performance
- **Code Splitting**: Use dynamic imports for large components
- **Image Optimization**: Use Next.js Image component
- **Bundle Analysis**: Monitor bundle size
- **Memoization**: Use React.memo and useMemo appropriately
- **Lazy Loading**: Implement lazy loading for below-fold content

### Trading Features
- **Real-time Data**: Implement WebSocket connections for live data
- **Charts**: Use lightweight-charts for trading visualizations
- **Data Validation**: Validate trading data on client and server
- **Offline Support**: Handle offline scenarios gracefully
- **Export Features**: Implement data export functionality

### Security
- **Authentication**: Implement secure authentication flow
- **Token Management**: Handle JWT tokens securely
- **Input Sanitization**: Sanitize user inputs
- **Environment Variables**: Use NEXT_PUBLIC_ prefix appropriately
- **CSP**: Implement Content Security Policy

---

## tradetaper-admin/ Rules

### Architecture Patterns
- **Admin-Specific**: Design for admin users with different UX patterns
- **React Query**: Use TanStack Query for server state management
- **Dashboard Patterns**: Implement standard admin dashboard patterns
- **Real-time Updates**: Use WebSockets for live admin data
- **Data Visualization**: Use Recharts for analytics and reporting

### Code Organization
```
src/
├── app/              # Next.js App Router admin pages
├── components/       # Admin-specific UI components
├── lib/             # Utilities and configurations
└── hooks/           # Custom hooks for admin functionality
```

### Admin-Specific Components
- **Data Tables**: Implement sortable, filterable data tables
- **Analytics Cards**: Create reusable metric display components
- **Charts**: Use Recharts for various chart types
- **Modals**: Implement modal patterns for admin actions
- **Forms**: Create admin forms for data management
- **Search/Filter**: Implement advanced search and filtering

### Dashboard Features
- **KPI Cards**: Display key performance indicators
- **Real-time Metrics**: Show live system metrics
- **User Management**: Implement user CRUD operations
- **System Monitoring**: Display system health and performance
- **Activity Logs**: Show audit trails and activity feeds
- **Export Functions**: Enable data export in various formats

### Data Visualization
- **Recharts**: Use for all chart components
- **Responsive Charts**: Ensure charts work on all screen sizes
- **Interactive Charts**: Implement hover states and click events
- **Color Schemes**: Use consistent color palettes
- **Animation**: Add subtle animations for better UX

### Admin Security
- **Role-Based Access**: Implement proper admin role checks
- **Audit Logging**: Log all admin actions
- **Session Management**: Implement secure admin sessions
- **IP Restrictions**: Consider IP-based access controls
- **2FA**: Implement two-factor authentication for admins

### Performance (Admin-Specific)
- **Data Pagination**: Implement server-side pagination for large datasets
- **Virtual Scrolling**: Use for very large lists
- **Background Refresh**: Update data without user intervention
- **Caching**: Cache admin data appropriately
- **Lazy Loading**: Load dashboard components progressively

### Admin UX Patterns
- **Navigation**: Implement clear navigation patterns
- **Breadcrumbs**: Show current location in admin hierarchy
- **Bulk Actions**: Enable bulk operations on data
- **Confirmation Modals**: Confirm destructive actions
- **Keyboard Shortcuts**: Implement admin keyboard shortcuts
- **Dark Theme**: Provide dark theme for extended use

---

## Folder-Specific Development Workflows

### Backend Development
1. Create feature branch
2. Generate migration if needed: `npm run migration:generate`
3. Create/update DTOs and entities
4. Implement service logic
5. Add controller endpoints
6. Write unit tests
7. Update API documentation
8. Test with Postman/Insomnia

### Frontend Development
1. Create feature branch
2. Design component interfaces
3. Implement UI components
4. Add Redux slices if needed
5. Integrate with backend APIs
6. Add error handling
7. Test responsive design
8. Verify accessibility

### Admin Development
1. Create feature branch
2. Design admin-specific components
3. Implement data visualization
4. Add admin business logic
5. Test with admin workflows
6. Verify permissions and security
7. Test performance with large datasets

---

## Common Pitfalls to Avoid

### Backend
- Don't expose internal IDs in APIs
- Don't forget to validate file uploads
- Don't skip transaction rollbacks
- Don't hardcode configuration values
- Don't ignore database connection pooling

### Frontend
- Don't use useEffect for derived state
- Don't forget to handle loading states
- Don't skip error boundaries
- Don't ignore accessibility
- Don't bundle server-only code in client

### Admin
- Don't show sensitive user data unnecessarily
- Don't skip admin action confirmations
- Don't ignore audit logging
- Don't forget admin-specific error handling
- Don't skip admin permission checks

---

## Deployment Considerations

### Backend
- Use Docker multi-stage builds
- Implement proper health checks
- Configure all environment variables properly
- Set up database connection pooling
- Implement graceful shutdown

### Frontend
- Optimize for static generation where possible
- Configure proper caching headers
- Implement error tracking
- Use CDN for assets
- Monitor Core Web Vitals

### Admin
- Restrict access by IP if possible
- Implement admin-specific monitoring
- Use separate deployment pipeline
- Consider staging environment for admin features
- Monitor admin user sessions

---

## Emergency Procedures

### Backend Issues
1. Check application logs
2. Verify database connectivity
3. Check external service status (Stripe, MetaAPI)
4. Monitor memory and CPU usage
5. Rollback deployment if necessary

### Frontend Issues
1. Check browser console errors
2. Verify API connectivity
3. Check CDN status
4. Monitor build process
5. Rollback to previous version

### Admin Issues
1. Verify admin authentication
2. Check admin-specific logs
3. Ensure database access
4. Verify admin permissions
5. Provide alternative admin access method