FROM node:18-alpine

WORKDIR /app

# Copy source files first
COPY . .

# Install dependencies
RUN npm install --production

# Build TypeScript
RUN npm run build

# Expose port and start application
EXPOSE 3000
CMD ["npm", "start"] 