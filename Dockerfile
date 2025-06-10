FROM node:18-alpine

WORKDIR /app

# Copy source files first
COPY . .

# Install all dependencies including devDependencies
RUN npm install

# Build TypeScript
RUN npm run build

# Clean up devDependencies
RUN npm prune --production

# Expose port and start application
EXPOSE 3000
CMD ["npm", "start"] 