# ==============================================
# Stage 1: Build stage
# ==============================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package management files
COPY package*.json ./

# Install ALL dependencies (including devDependencies for build)
RUN npm ci

# Copy the rest of the application code
COPY . .

# Execute the build script
# This generates frontend assets via vite, and dist/server.cjs via esbuild
RUN npm run build

# ==============================================
# Stage 2: Production runtime stage
# ==============================================
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copy package management files
COPY package*.json ./

# Install production dependencies only to keep image small
RUN npm ci --only=production

# Copy built assets and compiled server code from the builder stage
COPY --from=builder /app/dist ./dist

# Expose the internal port (adjust if your server.ts uses a different port)
EXPOSE 3000

# Start the Node.js production server
CMD ["npm", "run", "start"]
