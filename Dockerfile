# Build Frontend
FROM node:25.4.0-alpine AS build-client
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

# Build stage
FROM node:25.4.0-alpine AS builder

WORKDIR /app

COPY server/package.json server/package-lock.json* ./
RUN npm ci

COPY server/tsconfig.json ./
COPY server/src ./src
RUN npm run build

# Production stage
FROM node:25.4.0-alpine

WORKDIR /app

COPY server/package.json server/package-lock.json* ./
RUN npm ci --production --ignore-scripts && \
    npm cache clean --force && \
    rm -rf /root/.npm

COPY --from=builder /app/dist ./dist
COPY --from=build-client /app/client/dist ./dist/public

EXPOSE 80

CMD ["node", "dist/index.js"]
