# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache python3 make g++ cairo-dev jpeg-dev pango-dev giflib-dev

# Copy package files and install all dependencies
COPY package*.json ./
RUN npm ci --legacy-peer-deps

# Copy source code
COPY . .

# Build NestJS app
RUN npm run build

# Stage 2: Production
FROM node:20-alpine

WORKDIR /app

# Install runtime dependencies AND build tools for canvas
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    giflib-dev \
    cairo \
    jpeg \
    pango \
    giflib \
    bash \
    git \
    curl

# Copy only necessary files from builder
COPY package*.json ./
RUN npm ci --legacy-peer-deps --omit=dev

# Copy built files
COPY --from=builder /app/dist ./dist

# Expose NestJS port
EXPOSE 3000

# Run the app
CMD ["node", "dist/main"]