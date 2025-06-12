# Use Node.js 20 LTS
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package.json first for better caching
COPY package.json ./

# Install dependencies with legacy peer deps to avoid conflicts
# Use npm install instead of npm ci to avoid lockfile issues
RUN npm install --legacy-peer-deps --production

# Copy source code
COPY . .

# Install dev dependencies for build
RUN npm install --legacy-peer-deps

# Build the application
RUN npm run build

# Remove dev dependencies after build
RUN npm prune --production

# Expose port
EXPOSE 3000

# Set environment
ENV NODE_ENV=production
ENV PORT=3000

# Start the application
CMD ["npm", "run", "start:prod"] 