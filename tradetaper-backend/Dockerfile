# Minimal Dockerfile for admin API deployment
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies for build
RUN npm install && npm cache clean --force

# Copy source code
COPY . .

# Build application
RUN npm run build

# Expose port
# EXPOSE 8080

# Set environment variables
ENV NODE_ENV=production

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider /api/v1/ping || exit 1

# Start the application
CMD ["node", "dist/main.minimal.js"]