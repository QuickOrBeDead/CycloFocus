# Build stage
FROM node:25.4.0-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# Production stage
FROM node:25.4.0-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --production --ignore-scripts && \
    npm cache clean --force && \
    rm -rf /root/.npm

COPY --from=builder /app/dist ./dist

EXPOSE 80

CMD ["node", "dist/index.js"]
