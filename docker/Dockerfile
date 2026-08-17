FROM node:20-slim AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

ENV STATIC_EXPORT=true
ARG NEXT_PUBLIC_AUDIO_BASE_URL=https://igormcsouza-blog-audio.s3.us-east-1.amazonaws.com/audio
ENV NEXT_PUBLIC_AUDIO_BASE_URL=${NEXT_PUBLIC_AUDIO_BASE_URL}

RUN npx velite build && npx next build

FROM nginx:1.27-alpine
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/out /usr/share/nginx/html/blog
