"""
Providers routes
"""
from flask import Blueprint, request, jsonify
import db

providers_bp = Blueprint('providers', __name__)

@providers_bp.route("/api/providers", methods=["GET"])
def get_providers():
    """Get all providers with pagination and search"""
    page = int(request.args.get("page", 1))
    per_page = int(request.args.get("per_page", 50))
    search = request.args.get("search")
    
    providers, total = db.get_all_providers(page, per_page, search)
    
    # Add counts via JOIN
    conn = db.get_conn()
    cur = conn.cursor()
    provider_ids = [p['id'] for p in providers]
    
    if provider_ids:
        placeholders = ','.join(['?'] * len(provider_ids))
        counts = cur.execute(f"""
            SELECT 
                p.id,
                COUNT(DISTINCT k.id) as key_count,
                COUNT(DISTINCT m.id) as model_count
            FROM providers p
            LEFT JOIN api_keys k ON p.id = k.provider_id
            LEFT JOIN models m ON p.id = m.provider_id
            WHERE p.id IN ({placeholders})
            GROUP BY p.id
        """, provider_ids).fetchall()
        
        counts_dict = {row['id']: {'key_count': row['key_count'], 'model_count': row['model_count']} for row in counts}
        
        for p in providers:
            p['key_count'] = counts_dict.get(p['id'], {}).get('key_count', 0)
            p['model_count'] = counts_dict.get(p['id'], {}).get('model_count', 0)
    
    conn.close()
    
    return jsonify({
        "data": providers,
        "page": page,
        "per_page": per_page,
        "total": total,
        "pages": (total + per_page - 1) // per_page
    })

@providers_bp.route("/api/providers/<id>", methods=["GET"])
def get_provider(id):
    """Get single provider by ID"""
    provider = db.get_provider_by_id(id)
    if provider:
        return jsonify(provider)
    return jsonify({"error": "Provider not found"}), 404

@providers_bp.route("/api/providers", methods=["POST"])
def add_provider():
    """Add new provider"""
    data = request.json
    result = db.add_provider(**data)
    return jsonify(result)

@providers_bp.route("/api/providers/<id>", methods=["PUT"])
def update_provider(id):
    """Update provider"""
    data = request.json
    updated = db.update_provider(id, **data)
    return jsonify({"updated": updated})

@providers_bp.route("/api/providers/<id>", methods=["DELETE"])
def delete_provider(id):
    """Delete provider"""
    deleted = db.delete_provider(id)
    return jsonify({"deleted": deleted})
