# ---- frontend build ----
FROM node:22-bookworm-slim AS fe
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# ---- backend build ----
FROM node:22-bookworm-slim AS be
WORKDIR /app/backend
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*
COPY backend/package*.json ./
RUN npm install
COPY backend/ ./
RUN npm run build

# ---- runtime ----
FROM node:22-bookworm-slim
WORKDIR /app/backend
ENV NODE_ENV=production PORT=8080
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*
COPY backend/package*.json ./
RUN npm install
COPY --from=be /app/backend/dist ./dist
COPY --from=fe /app/frontend/dist ./public
# Copilot SDK requires an explicit CLI path and a writable home
ENV COPILOT_CLI_PATH=/app/backend/node_modules/@github/copilot/index.js
ENV COPILOT_HOME=/tmp/copilot-home
ENV DB_PATH=/tmp/data.db
EXPOSE 8080
CMD ["node", "dist/server.js"]
