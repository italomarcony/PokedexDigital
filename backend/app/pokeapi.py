import requests
from flask import Blueprint, jsonify, request, current_app
from flask_jwt_extended import jwt_required
from datetime import datetime, timedelta
from typing import Dict, Tuple, Optional

poke_bp = Blueprint("poke", __name__)

BASE_URL = "https://pokeapi.co/api/v2"

# OTIMIZAÇÃO: Cache em memória com TTL de 1 hora
CACHE_TTL_SECONDS = 3600  # 1 hora
_cache: Dict[str, Tuple[dict, datetime]] = {}


def get_from_cache(key: str) -> Optional[dict]:
    """Recupera dados do cache se ainda estiverem válidos"""
    if key in _cache:
        data, timestamp = _cache[key]
        if datetime.now() - timestamp < timedelta(seconds=CACHE_TTL_SECONDS):
            try:
                current_app.logger.info(f"✅ Cache HIT: {key}")
            except Exception:
                pass
            return data
        else:
            # Cache expirado, remove
            del _cache[key]
            try:
                current_app.logger.info(f"⏰ Cache EXPIRED: {key}")
            except Exception:
                pass
    return None


def save_to_cache(key: str, data: dict):
    """Salva dados no cache com timestamp"""
    _cache[key] = (data, datetime.now())
    try:
        current_app.logger.info(f"💾 Cache SAVED: {key} (total cached: {len(_cache)})")
    except Exception:
        pass


@poke_bp.get("/cache/stats")
@jwt_required(optional=True)
def cache_stats():
    """Retorna estatísticas do cache (útil para debugging)"""
    total = len(_cache)
    types = {
        "pokemon_detail": 0,
        "pokemon_list": 0,
        "type_detail": 0,
        "type_list": 0,
        "other": 0
    }

    for key in _cache.keys():
        if key.startswith("pokemon_detail_"):
            types["pokemon_detail"] += 1
        elif key.startswith("pokemon_list_"):
            types["pokemon_list"] += 1
        elif key.startswith("type_detail_"):
            types["type_detail"] += 1
        elif key == "type_list":
            types["type_list"] += 1
        else:
            types["other"] += 1

    return jsonify({
        "total_cached_items": total,
        "cache_ttl_seconds": CACHE_TTL_SECONDS,
        "breakdown": types
    }), 200


@poke_bp.post("/cache/clear")
@jwt_required()
def clear_cache():
    """Limpa todo o cache (requer autenticação)"""
    _cache.clear()
    return jsonify({"msg": "Cache limpo com sucesso"}), 200


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

    # OTIMIZAÇÃO: Verifica cache primeiro
    cache_key = f"pokemon_list_{limit}_{offset}"
    cached_data = get_from_cache(cache_key)
    if cached_data:
        return jsonify(cached_data), 200

    # Tenta com uma sequência de limites até obter sucesso
    for candidate in [limit, 1000, 500, 200, 100, 50, 20, 10]:
        params = {"limit": candidate, "offset": offset}
        resp = requests.get(f"{BASE_URL}/pokemon", params=params, timeout=20)
        try:
            current_app.logger.info("/pokemon params=%s status=%s", params, resp.status_code)
        except Exception:
            pass
        if resp.status_code == 200:
            data = resp.json()
            # OTIMIZAÇÃO: Salva no cache
            save_to_cache(cache_key, data)
            return jsonify(data), 200
        if resp.status_code not in (422, 400):
            # Erro diferente de validação: devolve como veio
            return jsonify(resp.json()), resp.status_code

    # Se chegou aqui, todos retornaram 422/400. Devolve payload seguro.
    return jsonify({"count": 0, "next": None, "previous": None, "results": []}), 200


@poke_bp.get("/pokemon/<name>")
@jwt_required(optional=True)
def pokemon_detail(name: str):
    # OTIMIZAÇÃO: Verifica cache primeiro (mais importante - detalhes individuais)
    cache_key = f"pokemon_detail_{name}"
    cached_data = get_from_cache(cache_key)
    if cached_data:
        return jsonify(cached_data), 200

    resp = requests.get(f"{BASE_URL}/pokemon/{name}", timeout=15)
    if resp.status_code == 200:
        data = resp.json()
        # OTIMIZAÇÃO: Salva no cache
        save_to_cache(cache_key, data)
        return jsonify(data), 200
    return jsonify(resp.json()), resp.status_code


@poke_bp.get("/type")
@jwt_required(optional=True)
def list_types():
    # OTIMIZAÇÃO: Verifica cache primeiro
    cache_key = "type_list"
    cached_data = get_from_cache(cache_key)
    if cached_data:
        return jsonify(cached_data), 200

    resp = requests.get(f"{BASE_URL}/type", timeout=15)
    if resp.status_code == 200:
        data = resp.json()
        # OTIMIZAÇÃO: Salva no cache
        save_to_cache(cache_key, data)
        return jsonify(data), 200
    return jsonify(resp.json()), resp.status_code


@poke_bp.get("/type/<name>")
@jwt_required(optional=True)
def list_by_type(name: str):
    """Lista Pokémon por tipo, normalizando para { results: [{ name, url }], count }"""
    # OTIMIZAÇÃO: Verifica cache primeiro
    cache_key = f"type_detail_{name}"
    cached_data = get_from_cache(cache_key)
    if cached_data:
        return jsonify(cached_data), 200

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

    normalized_data = {
        "count": len(results),
        "results": results
    }
    # OTIMIZAÇÃO: Salva no cache
    save_to_cache(cache_key, normalized_data)
    return jsonify(normalized_data), 200

