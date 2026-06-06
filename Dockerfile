FROM node:24-alpine
RUN npm install -g pnpm@8.15.8
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile=false
COPY . .
EXPOSE 4200
CMD ["pnpm", "start", "--host", "0.0.0.0"]
