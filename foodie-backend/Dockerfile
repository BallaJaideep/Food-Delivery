# Use official lightweight Node.js LTS image
FROM node:20-alpine

# Set working directory inside container
WORKDIR /app

# Copy package definitions
COPY package*.json ./

# Install dependencies cleanly
RUN npm ci

# Copy backend source code
COPY . .

# Expose backend port
EXPOSE 5000

# Start server
CMD ["node", "server.js"]

