# frontend/Dockerfile

# Use an official Node.js runtime as a parent image
# Using alpine for a smaller image size
FROM node:18-alpine

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json (or yarn.lock)
# This leverages Docker's layer caching. The npm install step will only re-run
# if these files change.
COPY package.json ./
# If you use yarn, use this instead:
# COPY package.json yarn.lock ./

# Install project dependencies
RUN npm install --legacy-peer-deps  
# If you use yarn, use this instead:
# RUN yarn install

# The source code will be mounted as a volume, so we don't copy it here.

# Expose the port the Vite dev server runs on
EXPOSE 5173

# The command to start the Vite development server
CMD ["npm", "run", "dev"]