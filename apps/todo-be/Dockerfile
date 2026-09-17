# Local-development container for the NestJS backend only — see
# docs/PLAN.md Phase 11 and docker-compose.yml at the repo root.
#
# This is a single-stage build, not a production image: the Nx webpack build
# for this app externalizes node_modules rather than bundling them, so the
# workspace's node_modules must exist alongside dist/apps/todo-be at
# runtime. Render deploys from source instead (see render.yaml) and is
# unaffected by this file.
FROM node:20-slim

WORKDIR /workspace

COPY package.json package-lock.json .npmrc ./
RUN npm ci

COPY . .

RUN npx nx build todo-be --configuration=production

EXPOSE 3333

CMD ["node", "dist/apps/todo-be/main.js"]
