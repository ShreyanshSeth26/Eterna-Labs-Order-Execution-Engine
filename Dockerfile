FROM node:24-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package.json pnpm-lock.yaml* ./
RUN corepack enable && pnpm i --frozen-lockfile || pnpm i
COPY tsconfig.json ./
COPY src ./src
CMD ["pnpm","dlx","ts-node-dev","--respawn","--transpile-only","src/index.ts"]
