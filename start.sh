#!/bin/bash
set -e

echo "🚀 Iniciando Pokédex Digital..."

# Cria diretório de logs do Nginx
mkdir -p /var/log/nginx

# Inicia Nginx em background
echo "📦 Iniciando Nginx..."
nginx &

# Aguarda Nginx iniciar
sleep 3

# Inicia Flask com Gunicorn
echo "🐍 Iniciando Flask Backend..."
cd /app

# Cria database se não existir
python -c "from app import create_app, db; app = create_app(); app.app_context().push(); db.create_all(); print('✅ Database criado')"

# Inicia Gunicorn
exec gunicorn --bind 127.0.0.1:5000 --workers 2 --threads 4 --timeout 120 --access-logfile - --error-logfile - "app:create_app()"
