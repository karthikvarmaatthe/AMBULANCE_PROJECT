# SMART AMBULANCE – Hyderabad City-Wide Intelligent Emergency Routing System

A full-stack emergency medical dispatch and intelligent navigation application that routes ambulances quickly to selected hospitals across the entire Hyderabad metropolitan area using graph algorithms (Dijkstra and Yen's K-Shortest Paths), real-time traffic weighting, turn-by-turn navigation instructions, and animated ambulance telemetry tracking.

---

## Tech Stack
- **Frontend**: HTML5, Modern CSS3 (High-contrast Medical Dark Theme), Vanilla JavaScript (Single IIFE, zero duplication)
- **Map Engine**: Leaflet.js with CartoDB Dark Matter & OpenStreetMap tiles
- **Backend**: Python Flask REST APIs
- **Database**: SQLite (`ambulance.db`) with Werkzeug password hashing
- **Routing Algorithm**: Graph-based Dijkstra + Yen's K-Shortest Loopless Paths with dynamic traffic congestion multipliers
- **Authentication**: Flask secure session management
- **City-Wide Network**: Static pre-compiled Hyderabad graph with 113+ hubs & intersections and 149 bidirectional primary arterial roads

---

## Project Structure

```
ambulance/
│
├── data/
│   └── hyderabad_network.json  # Pre-compiled Hyderabad city-wide road network
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
├── build_hyderabad_network.py
├── graph_data.py
├── routing.py
├── requirements.txt
└── README.md
```

---

## How to Run the Application

### 1. Open Terminal and Navigate to Project Directory
```bash
cd "C:\Users\karth\OneDrive\Desktop\AMBULANCE_PROJECT\ambulance"
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

## Hyderabad City-Wide Coverage

### Supported Areas & Hubs:
- **IT & Cyberabad Corridor**: Gachibowli, Hitech City, Madhapur, Kondapur, Raidurg, Financial District, Nanakramguda, Knowledge City, Mindspace
- **North & Northwest**: Kukatpally, KPHB Colony, Miyapur, Nizampet, Moosapet, Balanagar, Kompally, Medchal, Alwal, Suchitra Circle
- **Central & Commercial**: Banjara Hills, Jubilee Hills, Panjagutta, Somajiguda, Ameerpet, SR Nagar, Begumpet, Lakdikapul, Khairatabad, Tank Bund, Secretariat
- **Twin Cities & Secunderabad**: Secunderabad Station, Paradise, Clock Tower, Patny, Trimulgherry, Marredpally, Bowenpally, Begumpet Airport
- **East & Academic Corridor**: Tarnaka, Osmania University, Habsiguda, Uppal, Nagole, Ramanthapur, ECIL, AS Rao Nagar, Moula Ali
- **South & Historic Old City**: Charminar, Koti, Abids, Moazzam Jahi Market, Afzal Gunj, Salar Jung, Chandrayangutta, Falaknuma, Bahadurpura, Shamshabad Airport
- **Southwest Corridor**: Mehdipatnam, Masab Tank, Tolichowki, Shaikpet, Attapur, Langer Houz, Rajendranagar, Gandipet

### Hyderabad Emergency Hospitals (Destinations):
1. **Osmania General Hospital** (Afzal Gunj) — Apex State Level 1 Trauma Care Center
2. **Gandhi Hospital** (Secunderabad / Musheerabad) — Premier Tertiary Referral Center
3. **Nizam's Institute of Medical Sciences (NIMS)** (Panjagutta) — Autonomous Super-Specialty Medical Institute
4. **Apollo Hospitals** (Jubilee Hills, Road No. 72) — 24/7 International Level 1 Emergency & Trauma Unit
5. **Yashoda Hospital** (Secunderabad, Alexander Rd) — Comprehensive 24/7 Stroke & Cardiac Care
6. **Yashoda Hospital** (Somajiguda, Raj Bhavan Rd) — Emergency & Critical Care Center
7. **Yashoda Hospital** (Malakpet, Nalgonda X Roads) — Advanced Multispecialty Emergency Center
8. **CARE Hospital** (Banjara Hills, Road No. 1) — Premier Cardiac & Emergency Care Institute
9. **CARE Hospital** (Hitech City, Jayabheri Pine Valley) — Emergency Trauma Center
10. **Continental Hospitals** (Gachibowli, Financial District) — JCI-Accredited Level 1 Comprehensive Trauma Center
11. **Sunshine Hospitals** (Secunderabad, PG Road) — Polytrauma & Joint Replacement Emergency Care
12. **Medicover Hospitals** (Hitech City, Madhapur) — Advanced 24/7 Emergency & Critical Care Center
13. **KIMS Hospitals** (Secunderabad, Minister Road) — Super-Specialty Emergency & Transplant Care
14. **Omni Hospitals** (Kothapet, Dilsukhnagar) — Acute Emergency & Critical Care
15. **AIG Hospitals** (Gachibowli, Mindspace Rd) — Comprehensive Emergency Center

---

## Key Features Checklist

1. **Flexible Ambulance Positioning (Origin Selection)**:
   - **Map Click**: Click anywhere on the Hyderabad map canvas to position the ambulance 🚑 with automatic snapping to the nearest road network node.
   - **Area Dropdown**: Select any of the 78+ Hyderabad areas directly from the dispatch panel.
2. **Ambulance Movement**: Smooth `requestAnimationFrame` interpolation along road nodes with live coordinate tracking and pulsing visual beacon (🚑).
3. **Dynamic Live ETA & Distance**: Calculated immediately and continuously decreases as the ambulance moves towards the destination.
4. **Turn-by-Turn Navigation**: Step-by-step instructions generated with relative bearings (straight, turn right, turn left, U-turn) and Hyderabad road names (e.g. Outer Ring Road, PVNR Expressway, Hitech City Main Road, Inner Ring Road).
5. **Instant Loading Handshake**: The initial overlay cleanly dismisses as soon as `/api/graph` is loaded without page freeze.
6. **Auto-Commencing Navigation**: Finding the best route draws the route, updates telemetry, and starts the ambulance moving automatically.
7. **Zero JavaScript Duplication**: `main.js` is clean, unified, and strictly declared once.
8. **Emergency Mode (🚨)**: Priority siren, highlighted pulsing interface, and expedited transit parameters.
9. **Real-time Traffic Simulation**: Adjust traffic on individual roads to Clear, Moderate, Heavy, or Severe; routes recalculate dynamically.
10. **K-Shortest Routes**: Switch between Route 1, Route 2, and Route 3 to compare distances and travel times across Hyderabad.
11. **Hospital Arrival Event**: Arrival modal, statistics summary, and Web Audio API synthesized chime on destination arrival.

---

## REST API Endpoints

- `GET /api/graph`: Returns Hyderabad nodes, edges, hospitals, traffic levels, areas, and default ambulance node.
- `GET /api/routes?source=<id>&target=<id>&k=3`: Computes K-shortest paths considering traffic (also accepts `source_lat` and `source_lng` for map clicks).
- `GET /api/nearest_node?lat=<lat>&lng=<lng>`: Returns the closest Hyderabad road node to any latitude/longitude coordinate.
- `POST /api/ambulance/location`: Sets the current ambulance position by node ID or custom coordinates.
- `POST /api/traffic`: Updates traffic level of a road segment.
- `POST /api/traffic/reset`: Resets all road network traffic to clear.

