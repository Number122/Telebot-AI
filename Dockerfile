FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
COPY tsconfig.json ./
RUN npm install

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Expose port and start application
EXPOSE 3000
CMD ["npm", "start"] 