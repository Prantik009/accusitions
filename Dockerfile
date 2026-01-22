# syntax=docker/dockerfile:1

# ============================================
# Base stage: Common setup for all environments
# ============================================
FROM node:20-alpine AS base

WORKDIR /app

# Install dependencies needed for bcrypt native compilation
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./

# ============================================
# Development stage
# ============================================
FROM base AS development

# Install all dependencies (including devDependencies)
RUN npm ci

# Copy source code
COPY . .

# Create logs directory
RUN mkdir -p logs

# Expose port
EXPOSE 3000

# Start with file watching for development
CMD ["npm", "run", "dev"]

# ============================================
# Production dependencies stage
# ============================================
FROM base AS prod-deps

# Install only production dependencies
RUN npm ci --only=production

# ============================================
# Production stage
# ============================================
FROM node:20-alpine AS production

WORKDIR /app

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy production dependencies from prod-deps stage
COPY --from=prod-deps /app/node_modules ./node_modules

# Copy source code
COPY --chown=nodejs:nodejs . .

# Create logs directory with proper permissions
RUN mkdir -p logs && chown -R nodejs:nodejs logs

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Start the application
CMD ["node", "src/index.js"]
