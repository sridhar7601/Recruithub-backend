FROM node:22.14-alpine AS builder

WORKDIR /app
COPY . .
RUN yarn install && \
    yarn nx build hub-core-api && \
    yarn cache clean

FROM node:22.14-slim

WORKDIR /app
COPY --from=builder /app/dist/apps/hub-core-api .
COPY package.json yarn.lock ./
RUN yarn install --production && \
    yarn cache clean

ENV MONGO_URI=""
ENV PROFILE_EVALUATOR_QUEUE_URL=""
ENV AWS_REGION="us-west-2"
ENV CORE_API_PORT="8000"
ENV NODE_ENV="prod"

EXPOSE 8000
CMD ["node", "main.js"]
