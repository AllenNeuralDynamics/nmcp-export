FROM node:24.1

WORKDIR /app

COPY dist .

RUN npm install --production=true

CMD ["./docker-entry.sh"]

EXPOSE  5000
