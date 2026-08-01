FROM node:22-alpine AS build
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json tsconfig.base.json tsconfig.json ./
COPY apps/api ./apps/api
COPY packages/config ./packages/config
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @vocabulary/config build && pnpm --filter @vocabulary/api build

FROM node:22-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app
USER node
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/apps/api/dist ./apps/api/dist
COPY --from=build --chown=node:node /app/apps/api/package.json ./apps/api/package.json
COPY --from=build --chown=node:node /app/packages/config/dist ./packages/config/dist
COPY --from=build --chown=node:node /app/packages/config/package.json ./packages/config/package.json
EXPOSE 3001
CMD ["node", "apps/api/dist/main.js"]
