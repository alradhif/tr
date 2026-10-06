# Track+ single-container image: Express API + built React frontend.
# Used by the Cloud Run service and by the migrate / demo-reset Cloud Run jobs.

# ---- Frontend build ----
FROM node:22-bookworm-slim AS frontend
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY frontend/ ./
# The API is served from the same origin under /api
ENV VITE_API_URL=/api
RUN npm run build

# ---- Backend dependencies + Prisma client ----
FROM node:22-bookworm-slim AS backend
WORKDIR /app
COPY package.json package-lock.json prisma.config.ts ./
COPY Backend/prisma ./Backend/prisma
RUN npm ci --omit=dev --no-audit --no-fund
# prisma.config.ts reads DATABASE_URL; generate does not connect, so a placeholder is enough
RUN DATABASE_URL=postgresql://build:build@localhost:5432/build npx prisma generate

# ---- Runtime ----
FROM node:22-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production \
    PORT=8080
COPY --from=backend /app/node_modules ./node_modules
COPY package.json package-lock.json prisma.config.ts ./
COPY Backend/prisma ./Backend/prisma
COPY Backend/src ./Backend/src
COPY --from=frontend /app/frontend/dist ./frontend/dist
USER node
EXPOSE 8080
CMD ["node", "Backend/src/index.js"]
