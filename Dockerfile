FROM node:24.10

WORKDIR /app

COPY dist .

RUN npm install --production=true

ENTRYPOINT []
CMD ["bash", "./docker-entry.sh"]

EXPOSE  5000
