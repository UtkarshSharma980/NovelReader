# Build stage for frontend
FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci --include=dev
COPY frontend/ ./
RUN npx vite build

# Production stage
FROM node:20-alpine AS production
WORKDIR /app

# Copy backend
COPY backend/package*.json ./
RUN npm ci --omit=dev

COPY backend/ ./

# Copy frontend build to backend public folder
COPY --from=frontend-build /app/frontend/dist ./public

# Expose port
EXPOSE 3001

# Set environment
ENV NODE_ENV=production
ENV PORT=3001

# Start server
CMD ["node", "index.js"]
