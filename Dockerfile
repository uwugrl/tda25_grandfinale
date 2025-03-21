
FROM node:20

WORKDIR /app

COPY package.json .

RUN yarn install && yarn cache clean

COPY DockerEntrypoint.sh .
COPY next.config.ts .
COPY postcss.config.mjs .
COPY README.md .
COPY sentry.client.config.ts .
COPY sentry.edge.config.ts .
COPY sentry.server.config.ts .
COPY tsconfig.json .

COPY public/ ./public
COPY src/ ./src
COPY prisma/ ./prisma

RUN chmod +x DockerEntrypoint.sh

RUN yarn prisma generate
RUN yarn build

EXPOSE 80

STOPSIGNAL SIGKILL

ENTRYPOINT [ "npm", "run", "start:prod" ]
