FROM node:18-alpine
WORKDIR /app
COPY package.json ./
COPY src ./src
COPY migrations ./migrations
COPY public ./public
ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", "src/server.js"]
