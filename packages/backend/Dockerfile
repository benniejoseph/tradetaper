# Use Node.js LTS version
FROM node:20-alpine

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY packages/shared-dto/package*.json ./packages/shared-dto/
COPY packages/backend/package*.json ./packages/backend/

# Install dependencies
RUN npm install

# Copy source code
COPY tsconfig.json ./
COPY packages/shared-dto ./packages/shared-dto
COPY packages/backend ./packages/backend

# Build shared DTOs
RUN cd packages/shared-dto && npm run build

# Build backend
RUN cd packages/backend && npm run build

# Set working directory to backend
WORKDIR /app/packages/backend

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"] 