# Dockerfile unificado para deploy no Render.com
# Este arquivo cria uma imagem que roda backend Flask + frontend Angular com Nginx

# ==========================
# STAGE 1: Build do Frontend
# ==========================
FROM node:20-alpine AS frontend-build

WORKDIR /frontend

# Copia package files
COPY frontend/package*.json ./

# Instala dependências
RUN npm ci --legacy-peer-deps

# Copia código do frontend
COPY frontend/ ./

# Build de produção do Angular
RUN npm run build

# ==========================
# STAGE 2: Setup do Backend + Nginx
# ==========================
FROM python:3.11-slim

# Instala Nginx e dependências
RUN apt-get update && apt-get install -y \
    nginx \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Cria diretórios necessários
WORKDIR /app

# Copia e instala dependências Python
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt gunicorn

# Copia código do backend
COPY backend/ ./

# Copia frontend buildado do stage anterior
COPY --from=frontend-build /frontend/dist/frontend/browser /usr/share/nginx/html

# Remove configuração padrão do Nginx e copia a nossa
RUN rm -f /etc/nginx/sites-enabled/default /etc/nginx/sites-available/default
COPY nginx-production.conf /etc/nginx/sites-enabled/default

# Cria diretórios necessários para Nginx
RUN mkdir -p /var/log/nginx /var/lib/nginx/body /var/lib/nginx/proxy \
    && chown -R www-data:www-data /var/log/nginx /var/lib/nginx \
    && chmod -R 755 /var/log/nginx

# Cria diretório para banco de dados SQLite
RUN mkdir -p /app/instance

# Variáveis de ambiente
ENV FLASK_APP=app
ENV PYTHONUNBUFFERED=1
ENV PORT=10000

# Expõe a porta que o Render vai usar
EXPOSE 10000

# Script de inicialização
COPY start.sh /start.sh
RUN chmod +x /start.sh

# Comando de inicialização
CMD ["/start.sh"]
