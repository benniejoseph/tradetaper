# Dockerfile for tradetaper-backend

# --- Builder Stage ---
FROM node:20-slim AS builder

WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install all dependencies (including devDependencies)
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the NestJS application (with skipLibCheck to avoid dependency type errors)
RUN npx tsc -p tsconfig.build.json --skipLibCheck

# --- Production Stage ---
FROM node:20-slim AS production

WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install only production dependencies
RUN npm install --production

# Copy the built application from the builder stage
COPY --from=builder /app/dist ./dist

# Expose the port the app runs on
EXPOSE 3000

# Start the application
CMD ["node", "dist/main"]