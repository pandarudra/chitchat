FROM node:20-alpine

WORKDIR /app

COPY . .

RUN npm install

WORKDIR /app/apps/web

EXPOSE 5173

CMD ["npm", "run", "dev"]
