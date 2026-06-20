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
# Copilot SDK needs the CLI path explicitly
ENV COPILOT_CLI_PATH=/app/backend/node_modules/@github/copilot/index.js
ENV COPILOT_HOME=/tmp/copilot-home
EXPOSE 8080
CMD ["node", "dist/server.js"]
