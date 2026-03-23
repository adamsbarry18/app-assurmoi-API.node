FROM node:24-alpine

ENV HOME=/home/app

WORKDIR $HOME

RUN npm install -g nodemon
EXPOSE 3000