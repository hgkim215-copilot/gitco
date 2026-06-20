# Single-stage runtime image. Frontend (frontend/dist) and backend (backend/dist)
# are PRE-BUILT locally (native) before `docker build`, because running vite/tsc
# under amd64 emulation on Apple Silicon segfaults. Here we only install the
# backend's runtime dependencies (better-sqlite3 fetches a prebuilt linux-x64
# binary; @github/copilot pulls its linux-x64 platform package).
FROM node:22-bookworm-slim
WORKDIR /app/backend
ENV NODE_ENV=production PORT=8080
# Build tools as a fallback in case a native prebuilt binary is unavailable.
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*
COPY backend/package*.json ./
RUN npm install --omit=dev
COPY backend/dist ./dist
COPY frontend/dist ./public
# Copilot SDK requires an explicit CLI path and writable dirs.
ENV COPILOT_CLI_PATH=/app/backend/node_modules/@github/copilot/index.js
ENV COPILOT_HOME=/tmp/copilot-home
ENV DB_PATH=/tmp/data.db
EXPOSE 8080
CMD ["node", "dist/server.js"]
