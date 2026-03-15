# ASPES Frontend - Dockerfile

# Build stage
FROM node:20-alpine as build-stage

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy project files
COPY . .

# Build for production
# Argument for API URL which can be set at build time
ARG REACT_APP_API_URL
ENV REACT_APP_API_URL=$REACT_APP_API_URL

RUN npm run build

# Production stage
FROM nginx:stable-alpine as production-stage

# Copy build artifacts from build-stage
COPY --from=build-stage /app/build /usr/share/nginx/html

# Copy custom nginx config if needed (for SPA routing)
RUN echo 'server { \
    listen 80; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html index.htm; \
        try_files $uri $uri/ /index.html; \
    } \
    error_page 500 502 503 504 /50x.html; \
    location = /50x.html { \
        root /usr/share/nginx/html; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
