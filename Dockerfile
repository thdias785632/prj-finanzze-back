## Multi-stage Dockerfile
## Builder: installs build deps, installs node modules and builds the project
FROM node:18-bullseye AS builder
ENV DEBIAN_FRONTEND=noninteractive

# Install build deps required to compile native modules (canvas)
RUN apt-get update && apt-get install -y --no-install-recommends \
  build-essential \
  pkg-config \
  libcairo2-dev \
  libpango1.0-dev \
  libjpeg-dev \
  libgif-dev \
  librsvg2-dev \
  libpixman-1-dev \
  python3 \
  make \
  g++ \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
# Ensure JSON swagger file is copied into dist so runtime can require it
RUN mkdir -p dist/infra/http/swagger && cp src/infra/http/swagger/swagger-output.json dist/infra/http/swagger/swagger-output.json

## Runner: smaller final image with only runtime libs
FROM node:18-bullseye-slim AS runner
ENV NODE_ENV=production
ENV DEBIAN_FRONTEND=noninteractive

# Install only runtime libraries (no -dev packages)
RUN apt-get update && apt-get install -y --no-install-recommends \
  libcairo2 \
  libpango-1.0-0 \
  libjpeg62-turbo \
  libgif7 \
  librsvg2-2 \
  libpixman-1-0 \
  libfontconfig1 \
  libxrender1 \
  libxext6 \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app
# Copy only what's needed from the builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY package*.json ./

# Railway sets PORT env; app should read process.env.PORT
EXPOSE 3000

CMD ["npm", "run", "start:prod"]
