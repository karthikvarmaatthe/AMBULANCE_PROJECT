# SMART AMBULANCE – Intelligent Emergency Route & Hospital Management System

A full-stack emergency medical dispatch and intelligent navigation application that routes ambulances quickly to selected hospitals using graph algorithms (Dijkstra and Yen's K-Shortest Paths), real-time traffic weighting, turn-by-turn navigation instructions, and animated ambulance telemetry tracking.

---

## Tech Stack
- **Frontend**: HTML5, Modern CSS3 (High-contrast Medical Dark Theme), Vanilla JavaScript (Single IIFE, zero duplication)
- **Map Engine**: Leaflet.js with CartoDB Dark Matter & OpenStreetMap tiles
- **Backend**: Python Flask REST APIs
- **Database**: SQLite (`ambulance.db`) with Werkzeug password hashing
- **Routing Algorithm**: Graph-based Dijkstra + Yen's K-Shortest Loopless Paths with traffic multipliers
- **Authentication**: Flask secure session management

---

## Project Structure

```
ambulance/
│
├── static/
│   ├── css/
│   │   └── style.css
│   └── js/
│       └── main.js
│
├── templates/
│   ├── index.html
│   ├── login.html
│   └── register.html
│
├── ambulance.db
├── app.py
├── graph_data.py
├── routing.py
├── requirements.txt
└── README.md
```

---

## How to Run the Application

### 1. Open Terminal and Navigate to Project Directory
```bash
cd "C:\Users\karth\OneDrive\Desktop\ambulance"
```

### 2. Install Required Packages
```bash
pip install -r requirements.txt
```

### 3. Run the Flask Application
```bash
python app.py
```

### 4. Open in Browser
Visit:
```
http://127.0.0.1:5000
```

---

## Default Responder Credentials

You can use the pre-seeded demo paramedic account or register a new responder:

- **Email**: `paramedic@emergency.org`
- **Password**: `Password123`

---

## Key Features & Solved Problem Checklist

1. **Ambulance Movement**: Smooth `requestAnimationFrame` interpolation along road nodes with live coordinate tracking.
2. **Dynamic Live ETA & Distance**: Calculated immediately and continuously decreases as the ambulance moves towards the destination.
3. **Turn-by-Turn Navigation**: Step-by-step instructions generated with relative bearings (straight, turn right, turn left, U-turn) and road names.
4. **Instant Loading Handshake**: The initial "Loading city road network..." overlay cleanly dismisses as soon as `/api/graph` is loaded.
5. **Auto-Commencing Navigation**: Finding the best route draws the route, updates telemetry, and starts the ambulance moving automatically.
6. **Zero JavaScript Duplication**: `main.js` is clean, unified, and strictly declared once.
7. **Emergency Mode (🚨)**: Priority siren, highlighted pulsing interface, and faster transit speeds.
8. **Real-time Traffic Simulation**: Adjust traffic on individual roads to Clear, Moderate, Heavy, or Severe; routes recalculate dynamically.
9. **K-Shortest Routes**: Switch between Route 1, Route 2, and Route 3 to compare distances and travel times.
10. **Hospital Arrival Event**: Arrival modal, statistics summary, and Web Audio API synthesized chime on destination arrival.

---

## REST API Endpoints

- `GET /api/graph`: Returns nodes, edges, hospitals, traffic levels, and starting ambulance node.
- `GET /api/routes?source=<id>&target=<id>&k=3`: Computes K-shortest paths considering traffic.
- `POST /api/traffic`: Updates traffic level of a road segment.
- `POST /api/traffic/reset`: Resets all road network traffic to clear.
