import requests
from flask import Blueprint, jsonify, request, current_app
from flask_jwt_extended import jwt_required

poke_bp = Blueprint("poke", __name__)

BASE_URL = "https://pokeapi.co/api/v2"


@poke_bp.get("/pokemon")
@jwt_required(optional=True)
def list_pokemon():
    try:
        limit = int(request.args.get("limit", 24))
    except (TypeError, ValueError):
        limit = 24
    try:
        offset = int(request.args.get("offset", 0))
    except (TypeError, ValueError):
        offset = 0
    # Limite máximo da PokéAPI é 1000 por requisição
    if limit > 1000:
        limit = 1000
    if offset < 0:
        offset = 0
    # Tenta com uma sequência de limites até obter sucesso
    for candidate in [limit, 1000, 500, 200, 100, 50, 20, 10]:
        params = {"limit": candidate, "offset": offset}
        resp = requests.get(f"{BASE_URL}/pokemon", params=params, timeout=20)
        try:
            current_app.logger.info("/pokemon params=%s status=%s", params, resp.status_code)
        except Exception:
            pass
        if resp.status_code == 200:
            return jsonify(resp.json()), 200
        if resp.status_code not in (422, 400):
            # Erro diferente de validação: devolve como veio
            return jsonify(resp.json()), resp.status_code

    # Se chegou aqui, todos retornaram 422/400. Devolve payload seguro.
    return jsonify({"count": 0, "next": None, "previous": None, "results": []}), 200


@poke_bp.get("/pokemon/<name>")
@jwt_required(optional=True)
def pokemon_detail(name: str):
    resp = requests.get(f"{BASE_URL}/pokemon/{name}", timeout=15)
    return jsonify(resp.json()), resp.status_code


@poke_bp.get("/type")
@jwt_required(optional=True)
def list_types():
    resp = requests.get(f"{BASE_URL}/type", timeout=15)
    return jsonify(resp.json()), resp.status_code


@poke_bp.get("/type/<name>")
@jwt_required(optional=True)
def list_by_type(name: str):
    """Lista Pokémon por tipo, normalizando para { results: [{ name, url }], count }"""
    resp = requests.get(f"{BASE_URL}/type/{name}", timeout=20)
    if resp.status_code != 200:
        return jsonify(resp.json()), resp.status_code
    data = resp.json()
    pokemons = data.get("pokemon", [])
    results = []
    for entry in pokemons:
        p = entry.get("pokemon") or {}
        if p.get("name") and p.get("url"):
            results.append({"name": p["name"], "url": p["url"]})
    return jsonify({
        "count": len(results),
        "results": results
    }), 200

