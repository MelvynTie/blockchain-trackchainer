FROM golang:1.20-alpine AS build

WORKDIR /src
COPY . .
RUN go mod download
RUN go build -o chaincode .

FROM alpine:latest
COPY --from=build /src/chaincode /chaincode
USER 1000
ENTRYPOINT ["/chaincode"]
