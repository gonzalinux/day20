# Build stage
FROM oven/bun:canary-slim AS builder

WORKDIR /app

# Copy frontend files
COPY . .



RUN bun install

# Build the application
RUN bun run build-only

# Production stage
FROM nginx:alpine

# Copy built assets from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY ./nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 3500
EXPOSE 3500

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
