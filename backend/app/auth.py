from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity

from . import db
from .models import Usuario, TipoPokemon
import requests

auth_bp = Blueprint("auth", __name__)


@auth_bp.post("/register")
def register():
    data = request.get_json() or {}
    required = {"nome", "login", "email", "senha"}
    if not required.issubset(data):
        return jsonify({"msg": "Campos obrigatórios: nome, login, email, senha"}), 400

    if db.session.scalar(db.select(Usuario).filter_by(Login=data["login"])):
        return jsonify({"msg": "Login já existente"}), 409
    if db.session.scalar(db.select(Usuario).filter_by(Email=data["email"])):
        return jsonify({"msg": "Email já existente"}), 409

    # Verifica se é o primeiro usuário (será admin)
    user_count = db.session.scalar(db.select(db.func.count(Usuario.IDUsuario)))
    is_first_user = user_count == 0

    user = Usuario(
        Nome=data["nome"],
        Login=data["login"],
        Email=data["email"],
        Senha=generate_password_hash(data["senha"]),
        IsAdmin=is_first_user,
    )
    db.session.add(user)
    db.session.commit()
    token = create_access_token(identity=str(user.IDUsuario))
    return jsonify({
        "msg": "Usuário criado",
        "access_token": token,
        "user": {
            "id": user.IDUsuario,
            "nome": user.Nome,
            "email": user.Email,
            "login": user.Login,
            "isAdmin": user.IsAdmin,
        }
    }), 201


@auth_bp.post("/seed")
def seed_user():
    """Cria um usuário padrão para testes: login=admin senha=admin"""
    if db.session.scalar(db.select(Usuario).filter_by(Login="admin")):
        return jsonify({"msg": "Usuário já existe"})
    user = Usuario(
        Nome="Administrador",
        Login="admin",
        Email="admin@example.com",
        Senha=generate_password_hash("admin"),
    )
    db.session.add(user)
    db.session.commit()
    return jsonify({"msg": "Usuário admin criado", "login": "admin", "senha": "admin"})


@auth_bp.post("/seed/types")
def seed_types():
    """Carrega tipos da PokéAPI na tabela TipoPokemon se ainda não existirem."""
    resp = requests.get("https://pokeapi.co/api/v2/type")
    resp.raise_for_status()
    data = resp.json()
    created = 0
    for t in data.get("results", []):
        name = t.get("name")
        if not name:
            continue
        # Descricao armazenada em pt-br? manter o slug como descricao por simplicidade
        if not db.session.scalar(db.select(TipoPokemon).filter_by(Descricao=name)):
            db.session.add(TipoPokemon(Descricao=name))
            created += 1
    db.session.commit()
    return jsonify({"msg": "Tipos carregados", "novos": created})


@auth_bp.post("/login")
def login():
    data = request.get_json() or {}
    login_field = data.get("login")
    senha = data.get("senha")
    if not login_field or not senha:
        return jsonify({"msg": "Informe login e senha"}), 400

    user = db.session.scalar(db.select(Usuario).filter_by(Login=login_field))
    if not user or not check_password_hash(user.Senha, senha):
        return jsonify({"msg": "Credenciais inválidas"}), 401

    token = create_access_token(identity=str(user.IDUsuario))
    return jsonify({"access_token": token, "user": {
        "id": user.IDUsuario,
        "nome": user.Nome,
        "email": user.Email,
        "login": user.Login,
        "isAdmin": user.IsAdmin,
    }})


@auth_bp.get("/me")
@jwt_required()
def me():
    user_id = int(get_jwt_identity())
    user = db.session.get(Usuario, user_id)
    return jsonify({
        "id": user.IDUsuario,
        "nome": user.Nome,
        "email": user.Email,
        "login": user.Login,
        "isAdmin": user.IsAdmin,
    })


@auth_bp.post("/reset-password")
def reset_password():
    """Reset de senha: usuário informa login/email e nova senha"""
    data = request.get_json() or {}
    login_or_email = data.get("loginOrEmail")
    nova_senha = data.get("novaSenha")

    if not login_or_email or not nova_senha:
        return jsonify({"msg": "Informe login/email e nova senha"}), 400

    # Buscar usuário por login ou email
    user = db.session.scalar(
        db.select(Usuario).filter(
            (Usuario.Login == login_or_email) | (Usuario.Email == login_or_email)
        )
    )

    if not user:
        return jsonify({"msg": "Usuário não encontrado"}), 404

    # Atualizar senha
    user.Senha = generate_password_hash(nova_senha)
    db.session.commit()

    return jsonify({"msg": "Senha alterada com sucesso"}), 200


@auth_bp.get("/users")
@jwt_required()
def list_users():
    """Lista todos os usuários cadastrados (apenas admin)"""
    current_user_id = int(get_jwt_identity())
    current_user = db.session.get(Usuario, current_user_id)

    # Apenas admin pode listar usuários
    if not current_user or not current_user.IsAdmin:
        return jsonify({"msg": "Acesso negado. Apenas administradores podem acessar esta área."}), 403

    users = db.session.scalars(db.select(Usuario).order_by(Usuario.DtInclusao.desc())).all()

    # Retorna apenas dados não sensíveis
    return jsonify([{
        "id": u.IDUsuario,
        "nome": u.Nome,
        "dtInclusao": u.DtInclusao.isoformat() if u.DtInclusao else None,
    } for u in users]), 200


@auth_bp.delete("/users/<int:user_id>")
@jwt_required()
def delete_user(user_id: int):
    """Deleta um usuário (apenas admin, não pode deletar a si mesmo)"""
    current_user_id = int(get_jwt_identity())
    current_user = db.session.get(Usuario, current_user_id)

    # Apenas admin pode deletar usuários
    if not current_user or not current_user.IsAdmin:
        return jsonify({"msg": "Acesso negado. Apenas administradores podem deletar usuários."}), 403

    if current_user_id == user_id:
        return jsonify({"msg": "Você não pode deletar sua própria conta"}), 400

    user = db.session.get(Usuario, user_id)
    if not user:
        return jsonify({"msg": "Usuário não encontrado"}), 404

    db.session.delete(user)
    db.session.commit()

    return jsonify({"msg": "Usuário deletado com sucesso"}), 200


