FROM node:18-alpine

WORKDIR /app

# Install curl for certificate download (if needed)
RUN apk add --no-cache curl

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy source code
COPY . .

# Create necessary directories
RUN mkdir -p uploads certs

# Download CA certificate if needed (uncomment if using Option A)
# RUN curl -o certs/ca.pem https://letsencrypt.org/certs/isrgrootx1.pem

EXPOSE 5000

# Health check (important for Render)
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/api/health', (res) => process.exit(res.statusCode === 200 ? 0 : 1))"

CMD ["npm", "start"]