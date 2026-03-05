
# Stage 1: build React

FROM node:20-bullseye-slim AS build
WORKDIR /app 
COPY frontend/package*.json ./
# skip native binaries for safety (avoids cross-platform troubles)
RUN npm ci 
COPY frontend/ .
RUN npm run build


# Stage 2: serve with Nginx

FROM nginx:stable-alpine
# copy React build
COPY --from=build /app/dist /usr/share/nginx/html
# copy Nginx config
COPY nginx/default.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
# create dirs, if not presented and set permissions 
RUN mkdir -p /app/static /app/media && chmod -R 755 /app/static /app/media
CMD ["nginx", "-g", "daemon off;"]




