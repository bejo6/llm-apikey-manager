"""
API Keys routes
"""
from flask import Blueprint, request, jsonify
import db
import json
import csv
import io

keys_bp = Blueprint('keys', __name__)

@keys_bp.route("/api/keys", methods=["GET"])
def get_keys():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 50, type=int)
    provider = request.args.get('provider', '')
    status = request.args.get('status', '')
    search = request.args.get('search', '')
    
    keys, total = db.get_all(
        page=page, 
        per_page=per_page, 
        provider=provider if provider else None, 
        status=status if status else None, 
        search=search if search else None
    )
    
    pages = (total + per_page - 1) // per_page
    
    return jsonify({
        "data": keys,
        "total": total,
        "page": page,
        "per_page": per_page,
        "pages": pages
    })

@keys_bp.route("/api/keys", methods=["POST"])
def add_key():
    data = request.get_json()
    result = db.add(
        provider_id=data.get("provider_id"),
        name=data.get("name", ""),
        apiKey=data.get("apiKey"),
        authType=data.get("authType", "apikey"),
        notes=data.get("notes")
    )
    return jsonify(result)

@keys_bp.route("/api/keys/<id>", methods=["PUT"])
def update_key(id):
    data = request.get_json()
    result = db.update(id, **data)
    return jsonify({"updated": result})

@keys_bp.route("/api/keys/<id>", methods=["DELETE"])
def delete_key(id):
    result = db.delete(id)
    return jsonify({"deleted": result})

@keys_bp.route("/api/keys/import", methods=["POST"])
def import_keys():
    """Bulk import API keys from JSON or CSV file."""
    if "file" not in request.files:
        return jsonify({"error": "No file provided"}), 400
    
    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "No file selected"}), 400
    
    filename = file.filename.lower()
    
    try:
        if filename.endswith('.json'):
            content = file.read().decode('utf-8')
            data = json.loads(content)
            
            if not isinstance(data, list):
                return jsonify({"error": "JSON must be an array of objects"}), 400
            
            added = 0
            skipped = 0
            errors = []
            
            for item in data:
                if not all(k in item for k in ['provider', 'apiKey']):
                    errors.append(f"Missing required fields in item: {item}")
                    continue
                
                # Convert provider name to provider_id
                provider_name = item.get('provider')
                provider = db.get_provider_by_name(provider_name)
                if not provider:
                    errors.append(f"Provider not found: {provider_name}")
                    skipped += 1
                    continue
                
                result = db.add(
                    provider_id=provider['id'],
                    name=item.get('name', ''),
                    apiKey=item.get('apiKey'),
                    authType=item.get('authType', 'apikey'),
                    isActive=item.get('isActive', 1),
                    notes=item.get('notes')
                )
                
                if result.get('status') == 'added':
                    added += 1
                else:
                    skipped += 1
            
            return jsonify({
                "success": True,
                "added": added,
                "skipped": skipped,
                "errors": errors
            })
        
        elif filename.endswith('.csv'):
            content = file.read().decode('utf-8')
            csv_reader = csv.DictReader(io.StringIO(content))
            
            added = 0
            skipped = 0
            errors = []
            
            for row in csv_reader:
                if not all(k in row for k in ['provider', 'apiKey']):
                    errors.append(f"Missing required fields in row: {row}")
                    continue
                
                # Convert provider name to provider_id
                provider_name = row.get('provider')
                provider = db.get_provider_by_name(provider_name)
                if not provider:
                    errors.append(f"Provider not found: {provider_name}")
                    skipped += 1
                    continue
                
                result = db.add(
                    provider_id=provider['id'],
                    name=row.get('name', ''),
                    apiKey=row.get('apiKey'),
                    authType=row.get('authType', 'apikey'),
                    isActive=int(row.get('isActive', 1)),
                    notes=row.get('notes')
                )
                
                if result.get('status') == 'added':
                    added += 1
                else:
                    skipped += 1
            
            return jsonify({
                "success": True,
                "added": added,
                "skipped": skipped,
                "errors": errors
            })
        
        else:
            return jsonify({"error": "Unsupported file format. Use .json or .csv"}), 400
    
    except json.JSONDecodeError:
        return jsonify({"error": "Invalid JSON format"}), 400
    except csv.Error as e:
        return jsonify({"error": f"CSV parsing error: {str(e)}"}), 400
    except Exception as e:
        return jsonify({"error": f"Import failed: {str(e)}"}), 500
