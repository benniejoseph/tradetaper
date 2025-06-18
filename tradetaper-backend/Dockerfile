# Production Dockerfile for TradeTaper Backend
FROM node:20-slim

# Install Python, build tools, and curl for native dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies for build
RUN npm install --legacy-peer-deps && npm cache clean --force

# Copy source code
COPY . .

# Build application
RUN npm run build

# Set environment variables
ENV NODE_ENV=production
ENV PORT=8080

# Expose port 8080 (Cloud Run default)
EXPOSE 8080

# Install Cloud SQL Proxy
RUN curl -sSL -o /usr/local/bin/cloud-sql-proxy \
    https://storage.googleapis.com/cloud-sql-connectors/cloud-sql-proxy/v2.9.1/cloud-sql-proxy.linux.amd64 \
    && chmod +x /usr/local/bin/cloud-sql-proxy

# Start the application
CMD ["node", "dist/main.js"]