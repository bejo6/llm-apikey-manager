"""
Models routes
"""
from flask import Blueprint, request, jsonify
import db

models_bp = Blueprint('models', __name__)

@models_bp.route("/api/models", methods=["GET"])
def get_models():
    """Get all models with pagination and filters"""
    page = int(request.args.get("page", 1))
    per_page = int(request.args.get("per_page", 50))
    provider = request.args.get("provider")
    is_free = request.args.get("is_free")
    search = request.args.get("search")
    tier = request.args.get("tier")
    
    models, total = db.get_all_models(page, per_page, provider, is_free, search, tier)
    
    return jsonify({
        "data": models,
        "page": page,
        "per_page": per_page,
        "total": total,
        "pages": (total + per_page - 1) // per_page
    })

@models_bp.route("/api/models/<id>", methods=["GET"])
def get_model(id):
    """Get single model by ID"""
    model = db.get_model_by_id(id)
    if model:
        return jsonify(model)
    return jsonify({"error": "Model not found"}), 404

@models_bp.route("/api/models", methods=["POST"])
def add_model():
    """Add new model"""
    data = request.json
    result = db.add_model(**data)
    return jsonify(result)

@models_bp.route("/api/models/<id>", methods=["PUT"])
def update_model(id):
    """Update model"""
    data = request.json
    updated = db.update_model(id, **data)
    return jsonify({"updated": updated})

@models_bp.route("/api/models/<id>", methods=["DELETE"])
def delete_model(id):
    """Delete model"""
    deleted = db.delete_model(id)
    return jsonify({"deleted": deleted})

@models_bp.route("/api/models/free", methods=["GET"])
def get_free_models():
    """Get all free models"""
    provider = request.args.get("provider")
    models = db.get_free_models(provider)
    return jsonify(models)
