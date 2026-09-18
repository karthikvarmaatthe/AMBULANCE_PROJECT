"""
City Road Network Graph Data for Smart Ambulance System.
Defines nodes (intersections, emergency depot, hospitals) and edges (roads).
"""

DEFAULT_NODES = [
    {
        "id": "amb_station_1",
        "name": "Central Emergency Depot (Ambulance Base)",
        "lat": 17.3850,
        "lng": 78.4867,
        "type": "ambulance",
        "details": "Rapid Response Fleet Unit 04"
    },
    {
        "id": "node_1",
        "name": "City Center Junction",
        "lat": 17.3920,
        "lng": 78.4830,
        "type": "intersection",
        "details": "Major 4-way signalized crossing"
    },
    {
        "id": "node_2",
        "name": "Metro Ring Road West",
        "lat": 17.3990,
        "lng": 78.4740,
        "type": "intersection",
        "details": "High capacity bypass arterial"
    },
    {
        "id": "node_3",
        "name": "North Arterial Cross",
        "lat": 17.4090,
        "lng": 78.4790,
        "type": "intersection",
        "details": "Overpass intersection"
    },
    {
        "id": "node_4",
        "name": "Central Flyover South",
        "lat": 17.3890,
        "lng": 78.4960,
        "type": "intersection",
        "details": "Elevated corridor entry point"
    },
    {
        "id": "node_5",
        "name": "Tech Park Expressway",
        "lat": 17.4040,
        "lng": 78.4970,
        "type": "intersection",
        "details": "Dual-lane high speed expressway"
    },
    {
        "id": "node_6",
        "name": "Grand Boulevard Square",
        "lat": 17.4170,
        "lng": 78.4910,
        "type": "intersection",
        "details": "Commercial civic roundabout"
    },
    {
        "id": "node_7",
        "name": "East River Avenue",
        "lat": 17.3950,
        "lng": 78.5100,
        "type": "intersection",
        "details": "Riverbank transit corridor"
    },
    {
        "id": "node_8",
        "name": "Civic Circle North",
        "lat": 17.4260,
        "lng": 78.5040,
        "type": "intersection",
        "details": "North sector perimeter junction"
    },
    {
        "id": "node_9",
        "name": "Highland Bypass",
        "lat": 17.4190,
        "lng": 78.4690,
        "type": "intersection",
        "details": "Western elevated link"
    },
    {
        "id": "node_10",
        "name": "University Quad Link",
        "lat": 17.4020,
        "lng": 78.4870,
        "type": "intersection",
        "details": "Connecting hub between central & north routes"
    },
    {
        "id": "hosp_apollo",
        "name": "Apex Trauma & Multispecialty Hospital",
        "lat": 17.4160,
        "lng": 78.4610,
        "type": "hospital",
        "details": "Level 1 Trauma Center • 24/7 Cardiac & Neuro Emergency"
    },
    {
        "id": "hosp_city",
        "name": "City General Medical Center",
        "lat": 17.4230,
        "lng": 78.4880,
        "type": "hospital",
        "details": "Emergency & Critical Care Wing • 12 Trauma Bays"
    },
    {
        "id": "hosp_care",
        "name": "St. Jude Emergency Care Hospital",
        "lat": 17.4110,
        "lng": 78.5140,
        "type": "hospital",
        "details": "Pediatric & Adult Emergency • Burn & Stroke Unit"
    },
    {
        "id": "hosp_metro",
        "name": "Metro Super Specialty Hospital",
        "lat": 17.4330,
        "lng": 78.4980,
        "type": "hospital",
        "details": "Comprehensive Acute Care • Helicopter Air Ambulance Pad"
    }
]

DEFAULT_EDGES = [
    # Roads from Ambulance Base
    {"source": "amb_station_1", "target": "node_1", "name": "Emergency Depot Way", "distance": 1.1, "base_time": 2.2, "traffic": "clear"},
    {"source": "amb_station_1", "target": "node_4", "name": "South Link Flyover", "distance": 1.2, "base_time": 2.4, "traffic": "clear"},

    # Internal connecting grid
    {"source": "node_1", "target": "node_2", "name": "West Market Avenue", "distance": 1.3, "base_time": 2.8, "traffic": "light"},
    {"source": "node_1", "target": "node_10", "name": "Central Spine Parkway", "distance": 1.2, "base_time": 2.3, "traffic": "clear"},
    {"source": "node_4", "target": "node_10", "name": "South-Central Connector", "distance": 1.7, "base_time": 3.4, "traffic": "clear"},
    {"source": "node_4", "target": "node_7", "name": "East River Ringway", "distance": 1.8, "base_time": 3.5, "traffic": "clear"},
    {"source": "node_2", "target": "node_3", "name": "North Ring Corridor", "distance": 1.4, "base_time": 2.7, "traffic": "moderate"},
    {"source": "node_2", "target": "node_9", "name": "Highland Bypass Link", "distance": 2.2, "base_time": 3.9, "traffic": "clear"},
    {"source": "node_10", "target": "node_3", "name": "University Boulevard", "distance": 1.1, "base_time": 2.2, "traffic": "clear"},
    {"source": "node_10", "target": "node_5", "name": "Tech Cross Arterial", "distance": 1.2, "base_time": 2.5, "traffic": "clear"},
    {"source": "node_5", "target": "node_6", "name": "Boulevard Expressway", "distance": 1.6, "base_time": 3.1, "traffic": "light"},
    {"source": "node_5", "target": "node_7", "name": "East Tech Highway", "distance": 1.7, "base_time": 3.2, "traffic": "clear"},
    {"source": "node_3", "target": "node_6", "name": "Northern Connector Road", "distance": 1.5, "base_time": 2.9, "traffic": "clear"},
    {"source": "node_3", "target": "node_9", "name": "Highland West Junction", "distance": 1.4, "base_time": 2.6, "traffic": "clear"},
    {"source": "node_6", "target": "node_8", "name": "Civic North Avenue", "distance": 1.6, "base_time": 3.0, "traffic": "clear"},

    # Connections to Apex Trauma Hospital (hosp_apollo)
    {"source": "node_9", "target": "hosp_apollo", "name": "Apollo Emergency Ramp", "distance": 0.9, "base_time": 1.5, "traffic": "clear"},
    {"source": "node_2", "target": "hosp_apollo", "name": "Apollo West Access Road", "distance": 2.1, "base_time": 4.0, "traffic": "light"},
    {"source": "node_3", "target": "hosp_apollo", "name": "Apollo North Corridor", "distance": 1.8, "base_time": 3.2, "traffic": "clear"},

    # Connections to City General Medical Center (hosp_city)
    {"source": "node_6", "target": "hosp_city", "name": "City General Health Way", "distance": 0.9, "base_time": 1.6, "traffic": "clear"},
    {"source": "node_3", "target": "hosp_city", "name": "City Medical Link", "distance": 1.8, "base_time": 3.3, "traffic": "moderate"},
    {"source": "node_8", "target": "hosp_city", "name": "General Hospital Boulevard", "distance": 1.7, "base_time": 3.0, "traffic": "clear"},

    # Connections to St. Jude Emergency Care (hosp_care)
    {"source": "node_7", "target": "hosp_care", "name": "St. Jude Riverfront Road", "distance": 1.9, "base_time": 3.5, "traffic": "clear"},
    {"source": "node_5", "target": "hosp_care", "name": "St. Jude Emergency Express", "distance": 1.8, "base_time": 3.2, "traffic": "clear"},
    {"source": "node_8", "target": "hosp_care", "name": "East Peripheral Route", "distance": 2.1, "base_time": 3.8, "traffic": "clear"},

    # Connections to Metro Super Specialty (hosp_metro)
    {"source": "node_8", "target": "hosp_metro", "name": "Metro Super Specialty Parkway", "distance": 1.0, "base_time": 1.7, "traffic": "clear"},
    {"source": "node_6", "target": "hosp_metro", "name": "North Metro Skyway", "distance": 1.9, "base_time": 3.4, "traffic": "clear"},
    {"source": "hosp_city", "target": "hosp_metro", "name": "Inter-Hospital Emergency Transit", "distance": 1.5, "base_time": 2.5, "traffic": "clear"}
]

TRAFFIC_LEVELS = [
    {"level": "clear", "label": "Clear (1.0x)", "multiplier": 1.0, "color": "#10B981"},
    {"level": "light", "label": "Light (1.25x)", "multiplier": 1.25, "color": "#3B82F6"},
    {"level": "moderate", "label": "Moderate (1.6x)", "multiplier": 1.6, "color": "#F59E0B"},
    {"level": "heavy", "label": "Heavy (2.2x)", "multiplier": 2.2, "color": "#EF4444"},
    {"level": "severe", "label": "Severe (3.2x)", "multiplier": 3.2, "color": "#7F1D1D"}
]
