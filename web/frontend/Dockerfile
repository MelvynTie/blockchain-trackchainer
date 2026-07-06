FROM docker.io/library/node:24-alpine as build-stage

WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install

COPY . .
RUN npm run build:webpack

FROM docker.io/library/nginx:alpine
RUN rm -rf /usr/share/nginx/html/*
COPY --from=build-stage /app/client/static /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
