# Build Stage
FROM node:20-slim AS builder

# Enable corepack for pnpm
RUN corepack enable

WORKDIR /app

# Copy dependency files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --no-frozen-lockfile

# Copy source code and build
COPY . .
RUN pnpm run build

# Production Stage
FROM node:20-slim AS runner

WORKDIR /app

# Copy built files and production dependencies
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Copy Drizzle files for in-container migrations (Option 2)
COPY --from=builder /app/drizzle.config.ts ./drizzle.config.ts
COPY --from=builder /app/src/db ./src/db

EXPOSE 3000

CMD ["node", "./dist/index.mjs"]
