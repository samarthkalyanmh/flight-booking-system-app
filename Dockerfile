FROM node:18-alpine

# Create app directory
WORKDIR /usr/src/app

# Install netcat for health checks
RUN apk add --no-cache netcat-openbsd

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
COPY package*.json ./

RUN npm install
# Install nodemon globally for development
RUN npm install -g nodemon

# Bundle app source
COPY . .

# Make entrypoint script executable
RUN chmod +x ./docker-entrypoint.sh

# Expose port
EXPOSE 3000

# Set entrypoint
ENTRYPOINT ["./docker-entrypoint.sh"]

# Start the application (this will be overridden by docker-compose.yml for development)
CMD ["npm", "start"]
