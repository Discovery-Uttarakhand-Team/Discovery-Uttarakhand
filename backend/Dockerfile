# ==============================================================================
# DISCOVERY UTTARAKHAND — BACKEND PRODUCTION DOCKERFILE
# Multi-stage production container for Node.js Express API
# ==============================================================================

FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency manifests
COPY package*.json ./

# Install all dependencies including devDependencies for build
RUN npm ci

# Copy source code (respecting .dockerignore)
COPY . .

# ==============================================================================
# Production Runner Stage
# ==============================================================================
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

# Install curl for docker healthcheck
RUN apk add --no-cache curl

# Create non-root application user
RUN addgroup -S nodejs -g 1001 && \
    adduser -S nodeapp -u 1001 -G nodejs

# Copy dependency manifests and install production dependencies only
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy application files from builder
COPY --from=builder --chown=nodeapp:nodejs /app /app

# Ensure uploads directory has correct write permissions
RUN mkdir -p /app/uploads && chown -R nodeapp:nodejs /app/uploads

# Switch to non-root user
USER nodeapp

# Expose backend port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:5000/api/health || exit 1

# Start production server
CMD ["node", "server.js"]
