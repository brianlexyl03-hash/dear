FROM node:20-bookworm-slim AS build
WORKDIR /app
COPY package*.json ./
COPY apps/web/package*.json apps/web/
COPY apps/api/package*.json apps/api/
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-bookworm-slim AS runtime
ENV NODE_ENV=production
ENV PORT=8787
WORKDIR /app
COPY --from=build /app/package*.json ./
COPY --from=build /app/apps/api/package*.json apps/api/
RUN npm ci --omit=dev
COPY --from=build /app/apps/api/dist apps/api/dist
COPY --from=build /app/apps/web/dist apps/web/dist
RUN mkdir -p /data
ENV DATABASE_PATH=/data/live-mind.sqlite
EXPOSE 8787
CMD ["node", "apps/api/dist/index.js"]
