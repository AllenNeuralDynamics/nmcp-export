FROM node:20.10

WORKDIR /app

COPY dist .

RUN npm install --production=true

CMD ["./docker-entry.sh"]

EXPOSE  5000
