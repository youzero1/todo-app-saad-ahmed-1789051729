# Build stage — compile the Vite app to static files
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# If this app reads any VITE_* variables, declare an ARG + ENV pair for each
# one HERE, before the build — Vite inlines import.meta.env.VITE_* at build time.
RUN npx vite build

# Serve stage — static files behind nginx with SPA fallback
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
