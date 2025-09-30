# Dockerfile para o backend Flask
FROM python:3.11-slim

WORKDIR /app

# Copia o arquivo de dependências
COPY requirements.txt .

# Instala as dependências
RUN pip install --no-cache-dir -r requirements.txt

# Copia o código da aplicação
COPY . .

# Expõe a porta 5000
EXPOSE 5000

# Define variáveis de ambiente
ENV FLASK_APP=app
ENV PYTHONUNBUFFERED=1

# Comando para iniciar a aplicação
CMD ["python", "-m", "flask", "run", "--host=0.0.0.0"]