# Dockerfile for ocr-learning-app

# 1. Builder stage
FROM node:22-alpine AS builder
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy dependency definition files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy the rest of the application source code
COPY . .

# Build the application
RUN pnpm build

# 2. Production stage
FROM node:22-alpine
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json .
COPY --from=builder /app/pnpm-lock.yaml .
COPY --from=builder /app/next.config.mjs .
COPY --from=builder /app/eng.traineddata .
COPY --from=builder /app/osd.traineddata .

RUN pnpm install --prod

# Expose the port the app runs on
EXPOSE 3000

# Set the command to start the app
CMD ["pnpm", "start"]
