from flask import Flask
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
try:
    # Quando executado como pacote (python -m backend.wsgi)
    from backend.config import Config as AppConfig
except ModuleNotFoundError:  # Quando executado via backend/wsgi.py diretamente
    from config import Config as AppConfig

db = SQLAlchemy()
jwt = JWTManager()


def create_app() -> Flask:
    app = Flask(__name__)
    app.config.from_object(AppConfig)

    CORS(app, resources={
        r"/api/*": {
            "origins": "*",
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"]
        }
    })

    db.init_app(app)
    jwt.init_app(app)

    # Blueprints
    from .routes import api_bp
    from .pokeapi import poke_bp
    from .auth import auth_bp

    app.register_blueprint(api_bp, url_prefix="/api")
    app.register_blueprint(poke_bp, url_prefix="/api")
    app.register_blueprint(auth_bp, url_prefix="/api/auth")

    with app.app_context():
        db.create_all()

    return app


