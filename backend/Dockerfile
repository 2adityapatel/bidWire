FROM node:20-alpine AS base
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm ci

# Generate Prisma client (with linux-musl-openssl-3.0.x binary target)
COPY prisma ./prisma
RUN npx prisma generate

# Build TypeScript
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# ── Production image ──────────────────────────────────────────────────────────
FROM node:20-alpine AS production
WORKDIR /app

# Install OpenSSL 3 — required by the Prisma linux-musl-openssl-3.0.x engine binary
RUN apk add --no-cache openssl

COPY --from=base /app/dist ./dist
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/prisma ./prisma
COPY package.json ./

EXPOSE 3001
CMD ["npm", "start"]
