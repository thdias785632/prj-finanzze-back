## Multi-stage Dockerfile
## Builder: installs build deps, installs node modules and builds the project
FROM node:18-bullseye AS builder
ENV DEBIAN_FRONTEND=noninteractive

WORKDIR /app
COPY package*.json ./
RUN npm ci
RUN npm i
COPY . .
RUN npm run build
# Ensure JSON swagger file is copied into dist so runtime can require it
RUN mkdir -p dist/infra/http/swagger && cp src/infra/http/swagger/swagger-output.json dist/infra/http/swagger/swagger-output.json

## Runner: smaller final image with only runtime libs
FROM node:18-bullseye-slim AS runner
ENV NODE_ENV=production
ENV DEBIAN_FRONTEND=noninteractive

WORKDIR /app
# Copy only what's needed from the builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY package*.json ./

# Railway sets PORT env; app should read process.env.PORT
EXPOSE 3000

CMD ["npm", "run", "start:prod"]
