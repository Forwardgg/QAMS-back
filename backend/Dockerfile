FROM node:22-alpine

WORKDIR /app

# Copy package manifest(s) first for better caching
COPY package*.json ./

# Install production dependencies (faster & smaller)
RUN npm install --production

# Copy remaining source
COPY . .

EXPOSE 5000

# Run the server (ensure package.json has a start script or server.js exists)
CMD ["node", "server.js"]
