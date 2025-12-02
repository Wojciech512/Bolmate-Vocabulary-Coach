FROM node:20-alpine

WORKDIR /app

RUN apk update && apk add --no-cache curl

COPY package.json package-lock.json* ./

RUN npm install --legacy-peer-deps

COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "3000"]
