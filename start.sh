#!/bin/bash
set -e

echo "🚀 Iniciando Pokédex Digital..."

# Inicia Nginx em background
echo "📦 Iniciando Nginx..."
nginx

# Aguarda Nginx iniciar
sleep 2

# Inicia Flask com Gunicorn
echo "🐍 Iniciando Flask Backend..."
cd /app
exec gunicorn --bind 127.0.0.1:5000 --workers 2 --threads 4 --timeout 120 "app:create_app()"
