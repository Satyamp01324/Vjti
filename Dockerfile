# Multi-stage build for production

# Stage 1: Build frontend
FROM node:18-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Stage 2: Setup backend
FROM python:3.12-slim AS backend-setup
WORKDIR /app/backend
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
COPY backend/ ./

# Stage 3: Production image
FROM python:3.12-slim
WORKDIR /app

# Install Node.js for serving frontend
RUN apt-get update && apt-get install -y nodejs npm && rm -rf /var/lib/apt/lists/*

# Copy backend
COPY --from=backend-setup /app/backend /app/backend
COPY --from=backend-setup /usr/local/lib/python3.12/site-packages /usr/local/lib/python3.12/site-packages

# Copy frontend build
COPY --from=frontend-build /app/frontend/dist /app/frontend/dist

# Install serve for frontend
RUN npm install -g serve

# Expose ports
EXPOSE 8000 5174

# Create startup script
RUN echo '#!/bin/bash\n\
cd /app/backend && python -m uvicorn main:app --host 0.0.0.0 --port 8000 &\n\
cd /app/frontend/dist && serve -s . -l 5174\n\
' > /app/start.sh && chmod +x /app/start.sh

CMD ["/app/start.sh"]
