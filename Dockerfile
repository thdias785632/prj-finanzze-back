FROM node:18-bullseye-slim

# Install system deps required by canvas (only necessary if canvas needs to compile)
RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    build-essential \
    pkg-config \
    libcairo2-dev \
    libpango1.0-dev \
    libjpeg-dev \
    libgif-dev \
    librsvg2-dev \
    libpixman-1-dev \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy only package files to leverage Docker layer caching
COPY package*.json ./

# Install dependencies (production only to keep image small)
RUN npm ci --omit=dev

# Copy source and build
COPY . .
RUN npm run build

# Railway sets PORT environment variable; listen on it in your app (process.env.PORT)
ENV NODE_ENV=production

EXPOSE 3000

# Run built app
CMD ["npm", "run", "start:prod"]
