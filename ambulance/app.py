"""
SMART AMBULANCE – Intelligent Emergency Route & Hospital Management System
Flask Full Stack Application with SQLite Authentication & REST APIs.
"""

import os
import sqlite3
import copy
from functools import wraps
from flask import Flask, render_template, request, redirect, url_for, session, jsonify, flash
from werkzeug.security import generate_password_hash, check_password_hash

from graph_data import DEFAULT_NODES, DEFAULT_EDGES, TRAFFIC_LEVELS, HOSPITALS, AMBULANCE_START, HYDERABAD_AREAS, MAP_CENTER, DEFAULT_ZOOM
from routing import RoutingEngine

app = Flask(__name__)
app.secret_key = os.environ.get("FLASK_SECRET_KEY", "smart_ambulance_emergency_route_system_key_2026")

DB_NAME = os.path.join(os.path.dirname(os.path.abspath(__file__)), "ambulance.db")

# In-memory graph state for live traffic simulation (initialized from graph_data)
CURRENT_NODES = copy.deepcopy(DEFAULT_NODES)
CURRENT_EDGES = copy.deepcopy(DEFAULT_EDGES)
CURRENT_AMBULANCE = copy.deepcopy(AMBULANCE_START)
routing_engine = RoutingEngine(CURRENT_NODES, CURRENT_EDGES)

def get_db():
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL
        )
    """)
    # Seed a demo emergency paramedic account if empty
    cursor.execute("SELECT COUNT(*) FROM users")
    if cursor.fetchone()[0] == 0:
        demo_pwd = generate_password_hash("Password123")
        cursor.execute(
            "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
            ("Captain Alex Taylor", "paramedic@emergency.org", demo_pwd)
        )
    conn.commit()
    conn.close()

# Initialize DB at startup
init_db()

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if "user_id" not in session:
            flash("Please log in to access the Smart Ambulance Emergency System.", "warning")
            return redirect(url_for("login"))
        return f(*args, **kwargs)
    return decorated_function

# ----------------------------------------------------------------------
# Authentication Routes
# ----------------------------------------------------------------------

@app.route("/")
@login_required
def index():
    return render_template(
        "index.html",
        user_name=session.get("user_name", "Paramedic"),
        user_email=session.get("user_email", "")
    )

@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        email = request.form.get("email", "").strip().lower()
        password = request.form.get("password", "")

        if not email or not password:
            flash("Please provide both email address and password.", "danger")
            return render_template("login.html")

        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM users WHERE email = ?", (email,))
        user = cursor.fetchone()
        conn.close()

        if user and check_password_hash(user["password"], password):
            session["user_id"] = user["id"]
            session["user_name"] = user["name"]
            session["user_email"] = user["email"]
            flash(f"Welcome back, {user['name']}! Emergency navigation ready.", "success")
            return redirect(url_for("index"))
        else:
            flash("Invalid email or password. Please verify your credentials.", "danger")
            return render_template("login.html")

    return render_template("login.html")

@app.route("/register", methods=["GET", "POST"])
def register():
    if request.method == "POST":
        name = request.form.get("name", "").strip()
        email = request.form.get("email", "").strip().lower()
        password = request.form.get("password", "")
        confirm_password = request.form.get("confirm_password", "")

        if not name or not email or not password or not confirm_password:
            flash("All registration fields are required.", "danger")
            return render_template("register.html")

        if password != confirm_password:
            flash("Passwords do not match. Please re-enter.", "danger")
            return render_template("register.html")

        if len(password) < 6:
            flash("Password must contain at least 6 characters.", "danger")
            return render_template("register.html")

        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("SELECT id FROM users WHERE email = ?", (email,))
        if cursor.fetchone():
            conn.close()
            flash("An account with this email already exists. Please login.", "warning")
            return render_template("register.html")

        hashed_pwd = generate_password_hash(password)
        try:
            cursor.execute(
                "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
                (name, email, hashed_pwd)
            )
            conn.commit()
            conn.close()
            flash("Registration successful! You may now log in.", "success")
            return redirect(url_for("login"))
        except Exception as e:
            conn.close()
            flash(f"Registration failed: {str(e)}", "danger")
            return render_template("register.html")

    return render_template("register.html")

@app.route("/logout")
def logout():
    session.clear()
    flash("You have been safely logged out.", "info")
    return redirect(url_for("login"))

# ----------------------------------------------------------------------
# Admin Portal Routes
# ----------------------------------------------------------------------

@app.route("/admin")
@app.route("/admin/dashboard")
@login_required
def admin_dashboard():
    """System Administration & Operational Management Portal."""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id, name, email FROM users ORDER BY id ASC")
    users = cursor.fetchall()
    conn.close()

    hospitals = HOSPITALS if HOSPITALS else [n for n in CURRENT_NODES if n.get("type") == "hospital"]

    return render_template(
        "admin.html",
        user_name=session.get("user_name", "Admin"),
        user_email=session.get("user_email", ""),
        users=users,
        hospitals=hospitals,
        nodes=CURRENT_NODES,
        edges=CURRENT_EDGES,
        areas=HYDERABAD_AREAS,
        traffic_levels=TRAFFIC_LEVELS
    )

@app.route("/admin/user/add", methods=["POST"])
@login_required
def admin_add_user():
    """Admin endpoint to provision a new responder account."""
    name = request.form.get("name", "").strip()
    email = request.form.get("email", "").strip().lower()
    password = request.form.get("password", "")

    if not name or not email or not password:
        flash("All fields are required to create an account.", "warning")
        return redirect(url_for("admin_dashboard"))

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM users WHERE email = ?", (email,))
    if cursor.fetchone():
        conn.close()
        flash("An account with this email address already exists.", "danger")
        return redirect(url_for("admin_dashboard"))

    hashed_pwd = generate_password_hash(password)
    try:
        cursor.execute(
            "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
            (name, email, hashed_pwd)
        )
        conn.commit()
        flash(f"Responder account for '{name}' successfully provisioned.", "success")
    except Exception as e:
        flash(f"Failed to create account: {str(e)}", "danger")
    finally:
        conn.close()

    return redirect(url_for("admin_dashboard"))

@app.route("/admin/user/delete/<int:user_id>", methods=["POST"])
@login_required
def admin_delete_user(user_id):
    """Admin endpoint to remove a responder account."""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM users")
    total_users = cursor.fetchone()[0]

    if total_users <= 1:
        conn.close()
        flash("Cannot delete the last registered responder account.", "warning")
        return redirect(url_for("admin_dashboard"))

    if session.get("user_id") == user_id:
        conn.close()
        flash("You cannot delete your own currently active session account.", "warning")
        return redirect(url_for("admin_dashboard"))

    try:
        cursor.execute("DELETE FROM users WHERE id = ?", (user_id,))
        conn.commit()
        flash("Responder account successfully removed.", "info")
    except Exception as e:
        flash(f"Failed to delete account: {str(e)}", "danger")
    finally:
        conn.close()

    return redirect(url_for("admin_dashboard"))

@app.route("/api/admin/stats", methods=["GET"])
def get_admin_stats():
    """Returns real-time telemetry stats for the administration dashboard."""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM users")
    user_count = cursor.fetchone()[0]
    conn.close()

    traffic_summary = {}
    for edge in CURRENT_EDGES:
        t = edge.get("traffic", "clear").lower()
        traffic_summary[t] = traffic_summary.get(t, 0) + 1

    return jsonify({
        "success": True,
        "hospitals_count": len(HOSPITALS),
        "nodes_count": len(CURRENT_NODES),
        "edges_count": len(CURRENT_EDGES),
        "areas_count": len(HYDERABAD_AREAS),
        "users_count": user_count,
        "traffic_summary": traffic_summary
    })

# ----------------------------------------------------------------------
# REST API Endpoints
# ----------------------------------------------------------------------

@app.route("/api/graph", methods=["GET"])
def get_graph():
    """Returns nodes, edges, hospitals, traffic levels, areas, and active ambulance position."""
    hospitals = HOSPITALS if HOSPITALS else [n for n in CURRENT_NODES if n.get("type") == "hospital"]
    ambulance_node = CURRENT_AMBULANCE if CURRENT_AMBULANCE else next((n for n in CURRENT_NODES if n.get("type") == "ambulance"), CURRENT_NODES[0])

    return jsonify({
        "success": True,
        "city": "Hyderabad",
        "center": MAP_CENTER,
        "default_zoom": DEFAULT_ZOOM,
        "nodes": CURRENT_NODES,
        "edges": CURRENT_EDGES,
        "hospitals": hospitals,
        "ambulance": ambulance_node,
        "areas": HYDERABAD_AREAS,
        "traffic_levels": TRAFFIC_LEVELS
    })

@app.route("/api/nearest_node", methods=["GET"])
def find_nearest_node_api():
    """
    Finds nearest road node for clicked coordinates on the Hyderabad map.
    Usage: /api/nearest_node?lat=17.44&lng=78.35
    """
    try:
        lat = float(request.args.get("lat"))
        lng = float(request.args.get("lng"))
        node, dist = routing_engine.find_nearest_node(lat, lng)
        if node:
            return jsonify({
                "success": True,
                "node": node,
                "distance_km": dist
            })
        return jsonify({"success": False, "error": "No nodes found"}), 404
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 400

@app.route("/api/ambulance/location", methods=["POST"])
def set_ambulance_location():
    """
    Updates the current ambulance location to a selected area, node, or coordinate.
    Payload: { "node_id": "loc_gachibowli" } OR { "lat": 17.44, "lng": 78.35, "name": "Custom Location" }
    """
    global CURRENT_AMBULANCE
    data = request.get_json(force=True, silent=True) or {}
    node_id = data.get("node_id")

    if node_id and node_id in routing_engine.nodes_dict:
        node = routing_engine.nodes_dict[node_id]
        CURRENT_AMBULANCE = {
            "id": node["id"],
            "name": node.get("name", "Ambulance Position"),
            "lat": node["lat"],
            "lng": node["lng"],
            "type": "ambulance",
            "area": node.get("area", "Hyderabad")
        }
        return jsonify({"success": True, "ambulance": CURRENT_AMBULANCE})

    lat = data.get("lat")
    lng = data.get("lng")
    if lat is not None and lng is not None:
        try:
            lat = float(lat)
            lng = float(lng)
            nearest_node, dist = routing_engine.find_nearest_node(lat, lng)
            CURRENT_AMBULANCE = {
                "id": nearest_node["id"] if nearest_node else "amb_custom",
                "name": data.get("name") or (f"Near {nearest_node['name']}" if nearest_node else f"Location [{lat:.4f}, {lng:.4f}]"),
                "lat": lat,
                "lng": lng,
                "snapped_node_id": nearest_node["id"] if nearest_node else None,
                "type": "ambulance",
                "area": nearest_node.get("area", "Hyderabad") if nearest_node else "Hyderabad"
            }
            return jsonify({"success": True, "ambulance": CURRENT_AMBULANCE, "nearest_node": nearest_node, "distance_km": dist})
        except Exception as e:
            return jsonify({"success": False, "error": str(e)}), 400

    return jsonify({"success": False, "error": "Provide node_id or lat/lng"}), 400

@app.route("/api/routes", methods=["GET"])
def get_routes():
    """
    Computes top K shortest paths from source to target.
    Usage: /api/routes?source=<id>&target=<id>&k=3
    Also supports source_lat and source_lng for map click origin!
    """
    source = request.args.get("source")
    target = request.args.get("target")
    k = request.args.get("k", 3, type=int)

    source_lat = request.args.get("source_lat", type=float)
    source_lng = request.args.get("source_lng", type=float)

    # If coordinates provided or source is not in graph, find nearest node
    if source_lat is not None and source_lng is not None:
        nearest_node, _ = routing_engine.find_nearest_node(source_lat, source_lng)
        if nearest_node:
            source = nearest_node["id"]

    if not source:
        source = CURRENT_AMBULANCE.get("id") or (DEFAULT_NODES[0]["id"] if DEFAULT_NODES else "amb_central")

    # If source is an ambulance marker with custom ID, resolve to nearest node
    if source not in routing_engine.nodes_dict:
        if CURRENT_AMBULANCE and "lat" in CURRENT_AMBULANCE and "lng" in CURRENT_AMBULANCE:
            nearest_node, _ = routing_engine.find_nearest_node(CURRENT_AMBULANCE["lat"], CURRENT_AMBULANCE["lng"])
            if nearest_node:
                source = nearest_node["id"]

    if not target:
        hospitals = HOSPITALS if HOSPITALS else [n for n in CURRENT_NODES if n.get("type") == "hospital"]
        if hospitals:
            target = hospitals[0]["id"]
        else:
            return jsonify({"success": False, "error": "No destination hospital specified"}), 400

    try:
        routes = routing_engine.find_k_shortest_paths(source, target, k=k)
        if not routes:
            return jsonify({
                "success": False,
                "error": f"No viable route found between {source} and {target}."
            }), 404

        best_route = routes[0]
        return jsonify({
            "success": True,
            "source": source,
            "target": target,
            "count": len(routes),
            "best_route": best_route,
            "routes": routes
        })
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route("/api/traffic", methods=["POST"])
def update_traffic():
    """
    Updates the traffic condition of a specific road edge.
    Payload: { "source": "node_1", "target": "node_2", "level": "heavy" }
    """
    data = request.get_json(force=True, silent=True) or {}
    source = data.get("source")
    target = data.get("target")
    level = data.get("level", "moderate")

    if not source or not target:
        return jsonify({"success": False, "error": "source and target required"}), 400

    updated = routing_engine.update_traffic(source, target, level)
    if updated:
        # Also update in CURRENT_EDGES list
        for edge in CURRENT_EDGES:
            if (edge["source"] == source and edge["target"] == target) or \
               (edge["source"] == target and edge["target"] == source):
                edge["traffic"] = level.lower()

        return jsonify({
            "success": True,
            "message": f"Traffic updated to '{level}' on road {source} ↔ {target}."
        })
    else:
        return jsonify({"success": False, "error": "Road edge not found."}), 404

@app.route("/api/traffic/reset", methods=["POST"])
def reset_traffic():
    """Resets all traffic levels to clear/default."""
    routing_engine.reset_traffic()
    for edge in CURRENT_EDGES:
        edge["traffic"] = "clear"

    return jsonify({
        "success": True,
        "message": "All road network traffic reset to clear."
    })

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=True)
