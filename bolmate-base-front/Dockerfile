FROM node:20.16-slim AS build
WORKDIR /app
COPY package.json package-lock.json* tsconfig.json tsconfig.node.json vite.config.ts index.html ./
COPY src ./src
RUN npm install --no-progress
RUN npm run build

FROM node:20.16-slim
WORKDIR /app
COPY --from=build /app /app
EXPOSE 5173
CMD ["npm", "run", "preview"]
