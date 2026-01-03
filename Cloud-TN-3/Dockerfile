# syntax=docker/dockerfile:1
FROM node:18-alpine AS base
WORKDIR /app

COPY package.json package-lock.json ./
COPY backend/package.json backend/package-lock.json ./backend/
RUN npm ci
RUN cd backend && npm ci

FROM base AS backend-build
WORKDIR /app/backend
COPY backend/. .
RUN npx prisma generate
RUN npm run build

FROM node:18-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=backend-build /app/backend/dist ./backend/dist
COPY --from=backend-build /app/backend/node_modules ./backend/node_modules
COPY --from=backend-build /app/backend/prisma ./backend/prisma
COPY --from=backend-build /app/backend/package.json ./backend/package.json
EXPOSE 8080
CMD ["node", "backend/dist/main.js"]
