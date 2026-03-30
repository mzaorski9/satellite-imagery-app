# frontend/Dockerfile.dev
FROM node:20-bullseye-slim
WORKDIR /app 

# install deps 
COPY package*.json ./
# skip native binaries for safety (avoids cross-platform troubles)
RUN npm ci 

COPY . .

# run Vite dev server on host so its accessible outside the container
CMD ["npm", "run", "dev", "--", "--host", "--port", "3000"]
