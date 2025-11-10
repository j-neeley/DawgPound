FROM node:18-slim
WORKDIR /usr/src/app

# Install deps
COPY package.json package-lock.json* ./
RUN npm install --production

# Copy source
COPY src ./src

EXPOSE 4000
CMD ["node", "src/server.js"]
