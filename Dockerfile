FROM ubuntu:latest
RUN apt-get update -y
RUN mkdir -p /usr/src/app
#install dependencies

WORKDIR /usr/src/app
ADD DevopsDashboardNode.tar.gz /usr/src/app
WORKDIR /usr/src/app/DevopsDashboardNode
RUN apt-get update
RUN apt-get install -y build-essential
RUN apt-get -y install nodejs npm
RUN  npm install


EXPOSE 4200
CMD ["node","app.js"]