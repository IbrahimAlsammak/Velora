# Recipe to pack the website (React) + the web server (Caddy) into a Docker "box".
# Step 1: build the website files with Node (this step is thrown away afterwards)
FROM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# Step 2: Caddy = the web server. It shows the website, passes /api and /uploads to the backend,
# and gets the https padlock certificate automatically (and renews it).
FROM caddy:2-alpine
COPY Caddyfile /etc/caddy/Caddyfile
COPY --from=build /app/dist /srv
