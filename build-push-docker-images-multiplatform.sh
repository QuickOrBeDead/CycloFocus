#!/bin/sh

# backend image
docker buildx build --platform linux/amd64,linux/arm64/v8 --push -f client/Dockerfile -t boraakgn/cyclo-focus-client:v0.0.1-alpha.1 -t boraakgn/cyclo-focus-client:latest ./client/

# frontend image
docker buildx build --platform linux/amd64,linux/arm64/v8 --push -f server/Dockerfile -t boraakgn/cyclo-focus-server:v0.0.1-alpha.1 -t boraakgn/cyclo-focus-server:latest ./server/
