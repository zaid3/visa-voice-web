FROM node:20-alpine
WORKDIR /app
COPY . .
RUN corepack enable && corepack prepare pnpm@latest --activate
RUN pnpm install && pnpm build
ENV PORT=3000
EXPOSE 3000
CMD ["pnpm","start","--","-p","3000"]
