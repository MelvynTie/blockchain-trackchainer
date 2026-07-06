FROM docker.io/library/node:22-alpine

ENV NODE_ENV production
ENV PORT 3000
ENV DOCKER_SOCKET_PATH /host/var/run/docker.sock
ENV DOCKER_CCENV_IMAGE hyperledger/fabric-ccenv:2.5.4
ENV HFC_GRPC_PROVIDER grpc-js

# git is needed for some npm dependencies; no native build tools needed
# since @grpc/grpc-js is pure JavaScript
RUN apk add --no-cache git

RUN mkdir /app
COPY . /app
WORKDIR /app
RUN npm i --include=dev \
      && npm run build

EXPOSE 3000
CMD ["npm", "run", "serve"]
