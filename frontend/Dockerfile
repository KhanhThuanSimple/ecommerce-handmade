FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies với npm install (không dùng npm ci)
RUN npm install --legacy-peer-deps

# Copy source code
COPY . .

# Build project
RUN npm run build

# Install serve để chạy production
RUN npm install -g serve

EXPOSE 3000

CMD ["serve", "-s", "build", "-l", "3000"]
