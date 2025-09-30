from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity

from . import db
from .models import PokemonUsuario
from .pokeapi import poke_bp

api_bp = Blueprint("api", __name__)
api_bp.register_blueprint(poke_bp, url_prefix="/")


@api_bp.get("/health")
def health():
    return jsonify({"status": "ok"})


@api_bp.get("/me/team")
@jwt_required()
def get_team():
    user_id = int(get_jwt_identity())
    print(f"DEBUG: get_team called with user_id={user_id}")
    team = db.session.scalars(
        db.select(PokemonUsuario).filter_by(IDUsuario=user_id, GrupoBatalha=True)
    ).all()
    print(f"DEBUG: found {len(team)} team members")
    return jsonify([_to_dict(p) for p in team])


@api_bp.post("/me/team")
@jwt_required()
def add_to_team():
    user_id = int(get_jwt_identity())
    data = request.get_json() or {}
    current_count = db.session.scalar(
        db.select(db.func.count()).select_from(PokemonUsuario).filter_by(
            IDUsuario=user_id, GrupoBatalha=True
        )
    )
    if current_count >= 6:
        return jsonify({"msg": "Equipe de Batalha já tem 6 integrantes"}), 400

    pokemon = PokemonUsuario(
        IDUsuario=user_id,
        IDTipoPokemon=data.get("IDTipoPokemon"),
        Codigo=data["Codigo"],
        ImagemUrl=data.get("ImagemUrl"),
        Nome=data["Nome"],
        GrupoBatalha=True,
        Favorito=data.get("Favorito", False),
    )
    db.session.add(pokemon)
    db.session.commit()
    return jsonify(_to_dict(pokemon)), 201


@api_bp.delete("/me/team/<int:id_pokemon_usuario>")
@jwt_required()
def remove_from_team(id_pokemon_usuario: int):
    user_id = int(get_jwt_identity())
    pokemon = db.session.get(PokemonUsuario, id_pokemon_usuario)
    if not pokemon or pokemon.IDUsuario != user_id or not pokemon.GrupoBatalha:
        return jsonify({"msg": "Não encontrado"}), 404
    db.session.delete(pokemon)
    db.session.commit()
    return ("", 204)


@api_bp.get("/me/favorites")
@jwt_required()
def get_favorites():
    user_id = int(get_jwt_identity())
    print(f"DEBUG: get_favorites called with user_id={user_id}")
    favs = db.session.scalars(
        db.select(PokemonUsuario).filter_by(IDUsuario=user_id, Favorito=True)
    ).all()
    print(f"DEBUG: found {len(favs)} favorites")
    return jsonify([_to_dict(p) for p in favs])


@api_bp.post("/me/favorites")
@jwt_required()
def add_favorite():
    user_id = int(get_jwt_identity())
    data = request.get_json() or {}
    pokemon = PokemonUsuario(
        IDUsuario=user_id,
        IDTipoPokemon=data.get("IDTipoPokemon"),
        Codigo=data["Codigo"],
        ImagemUrl=data.get("ImagemUrl"),
        Nome=data["Nome"],
        Favorito=True,
        GrupoBatalha=data.get("GrupoBatalha", False),
    )
    db.session.add(pokemon)
    db.session.commit()
    return jsonify(_to_dict(pokemon)), 201


@api_bp.delete("/me/favorites/<int:id_pokemon_usuario>")
@jwt_required()
def remove_favorite(id_pokemon_usuario: int):
    user_id = int(get_jwt_identity())
    pokemon = db.session.get(PokemonUsuario, id_pokemon_usuario)
    if not pokemon or pokemon.IDUsuario != user_id or not pokemon.Favorito:
        return jsonify({"msg": "Não encontrado"}), 404
    db.session.delete(pokemon)
    db.session.commit()
    return ("", 204)


def _to_dict(p: PokemonUsuario) -> dict:
    return {
        "IDPokemonUsuario": p.IDPokemonUsuario,
        "IDUsuario": p.IDUsuario,
        "IDTipoPokemon": p.IDTipoPokemon,
        "Codigo": p.Codigo,
        "ImagemUrl": p.ImagemUrl,
        "Nome": p.Nome,
        "GrupoBatalha": p.GrupoBatalha,
        "Favorito": p.Favorito,
    }


