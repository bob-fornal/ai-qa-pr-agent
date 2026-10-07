FROM node:22-alpine
WORKDIR /app
COPY package.json ./
COPY src ./src
COPY migrations ./migrations
COPY public ./public
ENV NODE_ENV=production
ENV FEATURE_DISCOUNT_APPROVAL=false
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://localhost:3000/health || exit 1
EXPOSE 3000
CMD ["node", "src/server.js"]
