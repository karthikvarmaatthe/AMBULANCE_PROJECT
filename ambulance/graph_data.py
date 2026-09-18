"""
Hyderabad City-Wide Road Network Graph Data for Smart Ambulance System.
Loads the comprehensive Hyderabad road graph, intersections, corridors, expressways,
and distributed hospitals from cached data/hyderabad_network.json.
Provides spatial nearest-node lookup and area catalogs.
"""

import os
import json
import math

DATA_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data", "hyderabad_network.json")

def haversine_distance(lat1, lon1, lat2, lon2):
    """Calculates great-circle distance in kilometers between two points."""
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

def load_graph_data():
    if os.path.exists(DATA_FILE):
        try:
            with open(DATA_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            print(f"Warning: Could not read {DATA_FILE}: {e}")

    # If data file missing, invoke the builder
    try:
        import build_hyderabad_network
        build_hyderabad_network.build_hyderabad_dataset()
        with open(DATA_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        print(f"Error rebuilding network: {e}")
        # Return bare minimum fallback
        return {
            "city": "Hyderabad",
            "center": {"lat": 17.405, "lng": 78.475},
            "default_zoom": 12,
            "ambulance": {"id": "amb_central", "name": "Central Emergency Depot", "lat": 17.4045, "lng": 78.4640, "type": "ambulance"},
            "hospitals": [],
            "nodes": [],
            "edges": [],
            "traffic_levels": ["clear", "light", "moderate", "heavy", "severe"]
        }

_DATA = load_graph_data()

DEFAULT_NODES = _DATA.get("nodes", [])
DEFAULT_EDGES = _DATA.get("edges", [])
TRAFFIC_LEVELS = _DATA.get("traffic_levels", ["clear", "light", "moderate", "heavy", "severe"])
HOSPITALS = _DATA.get("hospitals", [])
AMBULANCE_START = _DATA.get("ambulance", DEFAULT_NODES[0] if DEFAULT_NODES else {})
MAP_CENTER = _DATA.get("center", {"lat": 17.405, "lng": 78.475})
DEFAULT_ZOOM = _DATA.get("default_zoom", 12)

# Extract unique Hyderabad areas for origin selection dropdown
HYDERABAD_AREAS = []
seen_areas = set()
for node in DEFAULT_NODES:
    area = node.get("area")
    if area and area not in seen_areas and node.get("type") == "intersection":
        seen_areas.add(area)
        HYDERABAD_AREAS.append({
            "id": node["id"],
            "area": area,
            "name": node["name"],
            "lat": node["lat"],
            "lng": node["lng"],
            "details": node.get("details", "")
        })

HYDERABAD_AREAS.sort(key=lambda x: x["area"])

def get_nearest_node(lat, lng, nodes=None):
    """Finds the closest node on the Hyderabad road graph to a given latitude & longitude."""
    if nodes is None:
        nodes = DEFAULT_NODES

    best_node = None
    min_dist = float("inf")

    for node in nodes:
        d = haversine_distance(lat, lng, node["lat"], node["lng"])
        if d < min_dist:
            min_dist = d
            best_node = node

    return best_node, round(min_dist, 2)
