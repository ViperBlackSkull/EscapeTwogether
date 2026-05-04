# Stage 1: Build client and server
FROM node:20-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
COPY client/package.json ./client/
COPY server/package.json ./server/
COPY tsconfig.base.json ./
COPY shared/ ./shared/

RUN npm ci --workspaces

COPY client/ ./client/
COPY server/ ./server/

RUN npm run build --workspace=client
RUN npm run build --workspace=server

# Stage 2: Production dependencies only
FROM node:20-alpine AS prod-deps

WORKDIR /app

COPY package.json package-lock.json ./
COPY client/package.json ./client/
COPY server/package.json ./server/
COPY tsconfig.base.json ./

RUN npm ci --workspaces --omit=dev

# Stage 3: Production runtime (distroless for minimal attack surface)
FROM gcr.io/distroless/nodejs20

LABEL version="1.0.0"
LABEL description="EscapeTwogether - A two-player cooperative escape room game"
LABEL maintainer="EscapeTwogether"

WORKDIR /app

# Copy compiled server code (rootDir ".." outputs to dist/server/src/)
COPY --from=build /app/server/dist/server/src/ ./server/src/
COPY --from=build /app/server/dist/shared/ ./shared/
COPY --from=build /app/client/dist/ ./client/dist/
# npm workspaces hoist deps to root node_modules
COPY --from=prod-deps /app/node_modules/ ./node_modules/

# Distroless provides nonroot user (UID 65534)
USER nonroot:nonroot

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["server/src/index.js"]
