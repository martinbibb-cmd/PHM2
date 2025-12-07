# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/api/package.json ./packages/api/

# Install dependencies
RUN npm ci

# Copy source code
COPY packages/shared ./packages/shared
COPY packages/api ./packages/api
COPY tsconfig.json ./

# Build shared package first
RUN npm run build -w @phm/shared

# Build API
RUN npm run build -w @phm/api

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/api/package.json ./packages/api/

# Install production dependencies only
RUN npm ci --production --ignore-scripts

# Copy built files from builder
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/api/dist ./packages/api/dist
COPY --from=builder /app/packages/api/drizzle ./packages/api/drizzle

# Copy package.json files to preserve workspace links
COPY --from=builder /app/packages/shared/package.json ./packages/shared/
COPY --from=builder /app/packages/api/package.json ./packages/api/

# Create uploads directory
RUN mkdir -p /app/uploads

# Install curl for healthcheck
RUN apk add --no-cache curl

# Expose port
EXPOSE 3001

# Run database migrations and start server
CMD cd packages/api && npm run db:migrate && npm start
