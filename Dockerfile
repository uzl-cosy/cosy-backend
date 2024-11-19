# syntax=docker/dockerfile:1

FROM --platform=linux/amd64 node:18-alpine
ENV NODE_ENV=production

WORKDIR /app

COPY ["package.json", "package-lock.json*", "./"]

RUN npm install --production

COPY . .

EXPOSE 8080

CMD ["node", "server.js"]
