# Especificar versão do Node.js
FROM node:20-alpine

# Instalar dependências do sistema para canvas
RUN apk add --no-cache \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    musl-dev \
    giflib-dev \
    pixman-dev \
    pangomm-dev \
    libjpeg-turbo-dev \
    freetype-dev \
    python3 \
    make \
    g++

# Diretório de trabalho
WORKDIR /app

# Copiar package.json primeiro para cache das dependências
COPY package.json ./

# Instalar dependências sem package-lock para evitar conflitos
RUN npm install --only=production --no-package-lock

# Copiar resto do código fonte
COPY . .

# Expor porta (Railway define automaticamente)
EXPOSE $PORT

# Comando para iniciar a aplicação
CMD ["npm", "start"]
