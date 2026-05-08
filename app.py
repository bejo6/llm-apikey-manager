from flask import Flask, render_template
import db
from routes import keys_bp, providers_bp, models_bp

app = Flask(__name__)

# Initialize the database on app startup
with app.app_context():
    db.init_db()

# Register blueprints
app.register_blueprint(keys_bp)
app.register_blueprint(providers_bp)
app.register_blueprint(models_bp)

# ============================================
# Page Routes (SPA)
# ============================================

@app.route("/")
def index():
    return render_template("pages/dashboard.html")

@app.route("/keys")
def keys_page():
    return render_template("pages/keys.html")

@app.route("/add")
def add_page():
    return render_template("index.html")

@app.route("/providers")
def providers_page():
    return render_template("pages/providers.html")

@app.route("/models")
def models_page():
    return render_template("pages/models.html")

@app.route("/import")
def import_page():
    return render_template("pages/import.html")

@app.route("/export")
def export_page():
    return render_template("pages/export.html")

if __name__ == "__main__":
    app.run(debug=True, port=5000)
