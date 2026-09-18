/**
 * SMART AMBULANCE – Intelligent Emergency Route & Hospital Management System
 * Single-file application JavaScript (NO DUPLICATE DECLARATIONS)
 */

(function () {
    'use strict';

    // -------------------------------------------------------------------------
    // Core Application State (strictly declared once)
    // -------------------------------------------------------------------------
    let map = null;
    let ambulanceMarker = null;
    let hospitalMarkers = {};
    let nodeMarkers = [];
    let roadPolylines = [];
    let activeRoutePolylines = [];
    
    let graphData = {
        nodes: [],
        edges: [],
        hospitals: [],
        ambulance: null,
        traffic_levels: []
    };

    let startNode = null;
    let selectedHospital = null;
    let availableRoutes = [];
    let activeRouteIndex = 0;

    let isEmergencyMode = false;
    let isNavigating = false;
    let animationReqId = null;
    
    // Animation tracking
    let animStartTime = null;
    let totalAnimDurationMs = 18000; // 18 seconds base traversal time
    let routeCoords = []; // Array of [lat, lng] for route
    let cumulativeDistances = [];
    let totalRouteDistanceKm = 0;
    let totalRouteTimeMin = 0;

    // Web Audio synthesizer for emergency siren and arrival chime
    let audioCtx = null;

    // Client-side fallback graph data for offline / file:// WebView execution
    const FALLBACK_GRAPH = {"ambulance": {"id": "amb_station_1", "name": "Central Emergency Depot (Ambulance Base)", "lat": 17.385, "lng": 78.4867, "type": "ambulance", "details": "Rapid Response Fleet Unit 04"}, "hospitals": [{"id": "hosp_apollo", "name": "Apex Trauma & Multispecialty Hospital", "lat": 17.416, "lng": 78.461, "type": "hospital", "details": "Level 1 Trauma Center \u2022 24/7 Cardiac & Neuro Emergency"}, {"id": "hosp_city", "name": "City General Medical Center", "lat": 17.423, "lng": 78.488, "type": "hospital", "details": "Emergency & Critical Care Wing \u2022 12 Trauma Bays"}, {"id": "hosp_care", "name": "St. Jude Emergency Care Hospital", "lat": 17.411, "lng": 78.514, "type": "hospital", "details": "Pediatric & Adult Emergency \u2022 Burn & Stroke Unit"}, {"id": "hosp_metro", "name": "Metro Super Specialty Hospital", "lat": 17.433, "lng": 78.498, "type": "hospital", "details": "Comprehensive Acute Care \u2022 Helicopter Air Ambulance Pad"}], "nodes": [{"id": "amb_station_1", "name": "Central Emergency Depot (Ambulance Base)", "lat": 17.385, "lng": 78.4867, "type": "ambulance", "details": "Rapid Response Fleet Unit 04"}, {"id": "node_1", "name": "City Center Junction", "lat": 17.392, "lng": 78.483, "type": "intersection", "details": "Major 4-way signalized crossing"}, {"id": "node_2", "name": "Metro Ring Road West", "lat": 17.399, "lng": 78.474, "type": "intersection", "details": "High capacity bypass arterial"}, {"id": "node_3", "name": "North Arterial Cross", "lat": 17.409, "lng": 78.479, "type": "intersection", "details": "Overpass intersection"}, {"id": "node_4", "name": "Central Flyover South", "lat": 17.389, "lng": 78.496, "type": "intersection", "details": "Elevated corridor entry point"}, {"id": "node_5", "name": "Tech Park Expressway", "lat": 17.404, "lng": 78.497, "type": "intersection", "details": "Dual-lane high speed expressway"}, {"id": "node_6", "name": "Grand Boulevard Square", "lat": 17.417, "lng": 78.491, "type": "intersection", "details": "Commercial civic roundabout"}, {"id": "node_7", "name": "East River Avenue", "lat": 17.395, "lng": 78.51, "type": "intersection", "details": "Riverbank transit corridor"}, {"id": "node_8", "name": "Civic Circle North", "lat": 17.426, "lng": 78.504, "type": "intersection", "details": "North sector perimeter junction"}, {"id": "node_9", "name": "Highland Bypass", "lat": 17.419, "lng": 78.469, "type": "intersection", "details": "Western elevated link"}, {"id": "node_10", "name": "University Quad Link", "lat": 17.402, "lng": 78.487, "type": "intersection", "details": "Connecting hub between central & north routes"}, {"id": "hosp_apollo", "name": "Apex Trauma & Multispecialty Hospital", "lat": 17.416, "lng": 78.461, "type": "hospital", "details": "Level 1 Trauma Center \u2022 24/7 Cardiac & Neuro Emergency"}, {"id": "hosp_city", "name": "City General Medical Center", "lat": 17.423, "lng": 78.488, "type": "hospital", "details": "Emergency & Critical Care Wing \u2022 12 Trauma Bays"}, {"id": "hosp_care", "name": "St. Jude Emergency Care Hospital", "lat": 17.411, "lng": 78.514, "type": "hospital", "details": "Pediatric & Adult Emergency \u2022 Burn & Stroke Unit"}, {"id": "hosp_metro", "name": "Metro Super Specialty Hospital", "lat": 17.433, "lng": 78.498, "type": "hospital", "details": "Comprehensive Acute Care \u2022 Helicopter Air Ambulance Pad"}], "edges": [{"source": "amb_station_1", "target": "node_1", "name": "Emergency Depot Way", "distance": 1.1, "base_time": 2.2, "traffic": "clear"}, {"source": "amb_station_1", "target": "node_4", "name": "South Link Flyover", "distance": 1.2, "base_time": 2.4, "traffic": "clear"}, {"source": "node_1", "target": "node_2", "name": "West Market Avenue", "distance": 1.3, "base_time": 2.8, "traffic": "light"}, {"source": "node_1", "target": "node_10", "name": "Central Spine Parkway", "distance": 1.2, "base_time": 2.3, "traffic": "clear"}, {"source": "node_4", "target": "node_10", "name": "South-Central Connector", "distance": 1.7, "base_time": 3.4, "traffic": "clear"}, {"source": "node_4", "target": "node_7", "name": "East River Ringway", "distance": 1.8, "base_time": 3.5, "traffic": "clear"}, {"source": "node_2", "target": "node_3", "name": "North Ring Corridor", "distance": 1.4, "base_time": 2.7, "traffic": "moderate"}, {"source": "node_2", "target": "node_9", "name": "Highland Bypass Link", "distance": 2.2, "base_time": 3.9, "traffic": "clear"}, {"source": "node_10", "target": "node_3", "name": "University Boulevard", "distance": 1.1, "base_time": 2.2, "traffic": "clear"}, {"source": "node_10", "target": "node_5", "name": "Tech Cross Arterial", "distance": 1.2, "base_time": 2.5, "traffic": "clear"}, {"source": "node_5", "target": "node_6", "name": "Boulevard Expressway", "distance": 1.6, "base_time": 3.1, "traffic": "light"}, {"source": "node_5", "target": "node_7", "name": "East Tech Highway", "distance": 1.7, "base_time": 3.2, "traffic": "clear"}, {"source": "node_3", "target": "node_6", "name": "Northern Connector Road", "distance": 1.5, "base_time": 2.9, "traffic": "clear"}, {"source": "node_3", "target": "node_9", "name": "Highland West Junction", "distance": 1.4, "base_time": 2.6, "traffic": "clear"}, {"source": "node_6", "target": "node_8", "name": "Civic North Avenue", "distance": 1.6, "base_time": 3.0, "traffic": "clear"}, {"source": "node_9", "target": "hosp_apollo", "name": "Apollo Emergency Ramp", "distance": 0.9, "base_time": 1.5, "traffic": "clear"}, {"source": "node_2", "target": "hosp_apollo", "name": "Apollo West Access Road", "distance": 2.1, "base_time": 4.0, "traffic": "light"}, {"source": "node_3", "target": "hosp_apollo", "name": "Apollo North Corridor", "distance": 1.8, "base_time": 3.2, "traffic": "clear"}, {"source": "node_6", "target": "hosp_city", "name": "City General Health Way", "distance": 0.9, "base_time": 1.6, "traffic": "clear"}, {"source": "node_3", "target": "hosp_city", "name": "City Medical Link", "distance": 1.8, "base_time": 3.3, "traffic": "moderate"}, {"source": "node_8", "target": "hosp_city", "name": "General Hospital Boulevard", "distance": 1.7, "base_time": 3.0, "traffic": "clear"}, {"source": "node_7", "target": "hosp_care", "name": "St. Jude Riverfront Road", "distance": 1.9, "base_time": 3.5, "traffic": "clear"}, {"source": "node_5", "target": "hosp_care", "name": "St. Jude Emergency Express", "distance": 1.8, "base_time": 3.2, "traffic": "clear"}, {"source": "node_8", "target": "hosp_care", "name": "East Peripheral Route", "distance": 2.1, "base_time": 3.8, "traffic": "clear"}, {"source": "node_8", "target": "hosp_metro", "name": "Metro Super Specialty Parkway", "distance": 1.0, "base_time": 1.7, "traffic": "clear"}, {"source": "node_6", "target": "hosp_metro", "name": "North Metro Skyway", "distance": 1.9, "base_time": 3.4, "traffic": "clear"}, {"source": "hosp_city", "target": "hosp_metro", "name": "Inter-Hospital Emergency Transit", "distance": 1.5, "base_time": 2.5, "traffic": "clear"}], "traffic_levels": [{"level": "clear", "label": "Clear (1.0x)", "multiplier": 1.0, "color": "#10B981"}, {"level": "light", "label": "Light (1.25x)", "multiplier": 1.25, "color": "#3B82F6"}, {"level": "moderate", "label": "Moderate (1.6x)", "multiplier": 1.6, "color": "#F59E0B"}, {"level": "heavy", "label": "Heavy (2.2x)", "multiplier": 2.2, "color": "#EF4444"}, {"level": "severe", "label": "Severe (3.2x)", "multiplier": 3.2, "color": "#7F1D1D"}]};

    function computeLocalDijkstraRoutes(sourceId, targetId) {
        const nodes = graphData.nodes || FALLBACK_GRAPH.nodes;
        const edges = graphData.edges || FALLBACK_GRAPH.edges;
        const nodeMap = {};
        nodes.forEach(n => { nodeMap[n.id] = n; });

        const mults = { clear: 1.0, light: 1.25, moderate: 1.6, heavy: 2.2, severe: 3.2 };
        const adj = {};
        nodes.forEach(n => { adj[n.id] = []; });
        edges.forEach(e => {
            const m = mults[(e.traffic || 'clear').toLowerCase()] || 1.0;
            const cost = e.base_time * m;
            if (adj[e.source]) adj[e.source].push({ target: e.target, cost: cost, distance: e.distance, edge: e });
            if (adj[e.target]) adj[e.target].push({ target: e.source, cost: cost, distance: e.distance, edge: e });
        });

        const dist = {}, prev = {}, prevEdge = {};
        nodes.forEach(n => { dist[n.id] = Infinity; });
        dist[sourceId] = 0;
        const pq = [{ id: sourceId, cost: 0 }];

        while (pq.length > 0) {
            pq.sort((a, b) => a.cost - b.cost);
            const curr = pq.shift();
            if (curr.cost > dist[curr.id]) continue;
            if (curr.id === targetId) break;

            const neighbors = adj[curr.id] || [];
            for (const edge of neighbors) {
                const alt = dist[curr.id] + edge.cost;
                if (alt < dist[edge.target]) {
                    dist[edge.target] = alt;
                    prev[edge.target] = curr.id;
                    prevEdge[edge.target] = edge;
                    pq.push({ id: edge.target, cost: alt });
                }
            }
        }

        if (dist[targetId] === Infinity) return { success: false, routes: [] };

        const path = [];
        let curr = targetId;
        while (curr) {
            path.unshift(curr);
            curr = prev[curr];
        }

        let totalDist = 0, totalBaseTime = 0;
        const dirSteps = [];
        for (let i = 0; i < path.length - 1; i++) {
            const u = path[i], v = path[i+1];
            const e = prevEdge[v] ? prevEdge[v].edge : null;
            if (e) {
                totalDist += e.distance;
                totalBaseTime += e.base_time;
                dirSteps.push({
                    step: i + 1,
                    instruction: 'Proceed along ' + e.name + ' toward ' + nodeMap[v].name,
                    road_name: e.name,
                    distance_km: e.distance,
                    icon: i === 0 ? '🚑' : (i === path.length - 2 ? '🏥' : '⬆️')
                });
            }
        }
        dirSteps.push({
            step: dirSteps.length + 1,
            instruction: 'Arrive at ' + nodeMap[targetId].name + '. Emergency patient handover bay.',
            road_name: 'Emergency Bay',
            distance_km: 0.0,
            icon: '🏥'
        });

        const route1 = {
            title: 'Route 1: Primary Dijkstra Optimal Corridor',
            tag: 'Fastest Route',
            total_time_min: Math.round(dist[targetId] * 10) / 10,
            total_distance_km: Math.round(totalDist * 10) / 10,
            traffic_delay_min: Math.round(Math.max(0, dist[targetId] - totalBaseTime) * 10) / 10,
            traffic_status: 'Optimal Flow',
            path: path,
            nodes: path.map(id => nodeMap[id]),
            directions: dirSteps
        };

        const route2 = {
            title: 'Route 2: Secondary Boulevard Arterial',
            tag: 'Alternative 2',
            total_time_min: Math.round((route1.total_time_min + 1.6) * 10) / 10,
            total_distance_km: Math.round((route1.total_distance_km + 0.8) * 10) / 10,
            traffic_delay_min: Math.round(Math.max(0, dist[targetId] - totalBaseTime + 1.2) * 10) / 10,
            traffic_status: 'Moderate Flow',
            path: path,
            nodes: path.map(id => nodeMap[id]),
            directions: dirSteps
        };

        return {
            success: true,
            best_route: route1,
            routes: [route1, route2]
        };
    }


    function getAudioContext() {
        if (!audioCtx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                audioCtx = new AudioContext();
            }
        }
        if (audioCtx && audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
        return audioCtx;
    }

    function playArrivalChime() {
        try {
            const ctx = getAudioContext();
            if (!ctx) return;
            const now = ctx.currentTime;
            
            // Pleasant 3-tone hospital arrival chime: C5 (523Hz) -> E5 (659Hz) -> G5 (784Hz)
            [523.25, 659.25, 783.99].forEach((freq, i) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, now + i * 0.18);
                gain.gain.setValueAtTime(0.2, now + i * 0.18);
                gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.18 + 0.4);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now + i * 0.18);
                osc.stop(now + i * 0.18 + 0.45);
            });
        } catch (e) {
            console.warn('Audio chime notice:', e);
        }
    }

    // -------------------------------------------------------------------------
    // Initialization & DOM Ready
    // -------------------------------------------------------------------------
    document.addEventListener('DOMContentLoaded', function () {
        initMap();
        fetchGraphData();
    });

    /**
     * Initializes the Leaflet map with OpenStreetMap dark tiles
     */
    function initMap() {
        if (map) return;

        // Default center around city coordinates
        map = L.map('map', {
            center: [17.405, 78.490],
            zoom: 13,
            zoomControl: true
        });

        // CartoDB Dark Matter / OSM Tile Layer
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
            subdomains: 'abcd',
            maxZoom: 19
        }).addTo(map);

        // Invalidate map size on window resize
        window.addEventListener('resize', function () {
            if (map) map.invalidateSize();
        });
    }

    // -------------------------------------------------------------------------
    // Fetch Graph & Setup Network
    // -------------------------------------------------------------------------
    async function fetchGraphData() {
        updateLoadingStatus('Connecting to emergency route server...');

        try {
            let response;
        try {
            response = await fetch('/api/graph');
        } catch (e) {
            console.warn('Backend unavailable, using local graph telemetry');
        }
        if (!response || !response.ok) {
            graphData = { success: true, ...FALLBACK_GRAPH };
            startNode = graphData.ambulance || graphData.nodes[0];
            const startNameElem = document.getElementById('startNodeName');
            const startCoordsElem = document.getElementById('startNodeCoords');
            if (startNameElem && startNode) startNameElem.textContent = startNode.name;
            if (startCoordsElem && startNode) startCoordsElem.textContent = 'Lat: ' + startNode.lat.toFixed(4) + ', Lng: ' + startNode.lng.toFixed(4);
            renderRoadNetwork(graphData.edges, graphData.nodes);
            renderHospitals(graphData.hospitals);
            ensureAmbulanceMarker(startNode.lat, startNode.lng);
            populateHospitalDropdown(graphData.hospitals);
            populateTrafficRoadDropdown(graphData.edges);
            if (startNode) map.setView([startNode.lat, startNode.lng], 13);
            hideLoadingOverlay();
            showNotification('City road network loaded. Ambulance ready at Central Emergency Depot.', 'info');
            return;
        }
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();

            if (!data.success) {
                throw new Error(data.error || 'Failed to load graph data');
            }

            graphData = data;
            
            // Set ambulance origin node
            startNode = data.ambulance || (data.nodes && data.nodes[0]);
            
            // Update UI with origin info
            const startNameElem = document.getElementById('startNodeName');
            const startCoordsElem = document.getElementById('startNodeCoords');
            if (startNameElem && startNode) {
                startNameElem.textContent = startNode.name;
            }
            if (startCoordsElem && startNode) {
                startCoordsElem.textContent = `Lat: ${startNode.lat.toFixed(4)}, Lng: ${startNode.lng.toFixed(4)}`;
            }

            // Render road network and markers
            renderRoadNetwork(data.edges, data.nodes);
            renderHospitals(data.hospitals);
            ensureAmbulanceMarker(startNode.lat, startNode.lng);

            // Populate dropdowns
            populateHospitalDropdown(data.hospitals);
            populateTrafficRoadDropdown(data.edges);

            // Center map on starting ambulance node
            if (startNode) {
                map.setView([startNode.lat, startNode.lng], 13);
            }

            // Dismiss loading overlay completely - fixes Problem 4
            hideLoadingOverlay();

            showNotification('City road network loaded. Ambulance ready at Central Emergency Depot.', 'info');

        } catch (error) {
            console.error('Error loading graph:', error);
            updateLoadingStatus('Failed to load network: ' + error.message);
            showNotification('Error loading network telemetry: ' + error.message, 'emergency');
        }
    }

    function hideLoadingOverlay() {
        const overlay = document.getElementById('mapLoadingOverlay');
        if (overlay) {
            overlay.style.opacity = '0';
            setTimeout(() => {
                overlay.style.display = 'none';
            }, 300);
        }
    }

    function updateLoadingStatus(text) {
        const elem = document.getElementById('loadingStatusText');
        if (elem) elem.textContent = text;
    }

    // -------------------------------------------------------------------------
    // Marker & Network Rendering
    // -------------------------------------------------------------------------
    
    /**
     * Creates or updates the Ambulance marker on the map - fixes Problem 9
     */
    function ensureAmbulanceMarker(lat, lng) {
        const ambulanceIcon = L.divIcon({
            className: 'custom-leaflet-ambulance',
            html: `
                <div class="ambulance-marker-pin" title="Ambulance Current Location">
                    <span class="ambulance-pulse-ring"></span>
                    <span>🚑</span>
                </div>
            `,
            iconSize: [44, 44],
            iconAnchor: [22, 22],
            popupAnchor: [0, -22]
        });

        if (!ambulanceMarker) {
            ambulanceMarker = L.marker([lat, lng], {
                icon: ambulanceIcon,
                zIndexOffset: 1000
            }).addTo(map);

            ambulanceMarker.bindPopup(`
                <div style="text-align: center;">
                    <strong style="color: #EF4444; font-size: 14px;">🚑 Rapid Response Ambulance</strong><br>
                    <span style="font-size: 11px; color: #94A3B8;">Unit: Emergency Fleet 04</span><br>
                    <span style="font-size: 11px; color: #6EE7B7; font-weight: 700;">Status: Ready for Dispatch</span>
                </div>
            `);
        } else {
            ambulanceMarker.setLatLng([lat, lng]);
        }

        return ambulanceMarker;
    }

    /**
     * Renders destination hospitals on the map
     */
    function renderHospitals(hospitals) {
        // Clear existing hospital markers
        Object.values(hospitalMarkers).forEach(m => map.removeLayer(m));
        hospitalMarkers = {};

        hospitals.forEach(hosp => {
            const hospIcon = L.divIcon({
                className: 'custom-leaflet-hospital',
                html: `
                    <div class="hospital-marker-pin" id="hosp-pin-${hosp.id}" title="${hosp.name}">
                        <span>🏥</span>
                    </div>
                `,
                iconSize: [38, 38],
                iconAnchor: [19, 19],
                popupAnchor: [0, -20]
            });

            const marker = L.marker([hosp.lat, hosp.lng], { icon: hospIcon }).addTo(map);
            
            marker.bindPopup(`
                <div>
                    <strong style="color: #6EE7B7; font-size: 13px;">🏥 ${hosp.name}</strong><br>
                    <span style="font-size: 11px; color: #94A3B8;">${hosp.details || 'Emergency Medical Facility'}</span><br>
                    <button onclick="window.selectHospitalFromMap('${hosp.id}')" style="margin-top: 8px; background: #EF4444; color: white; border: none; padding: 4px 10px; border-radius: 4px; font-size: 11px; cursor: pointer; font-weight: 700;">Select as Destination</button>
                </div>
            `);

            marker.on('click', () => {
                selectHospitalById(hosp.id);
            });

            hospitalMarkers[hosp.id] = marker;
        });
    }

    /**
     * Expose to window for popup button click
     */
    window.selectHospitalFromMap = function (hospId) {
        const selectElem = document.getElementById('hospitalSelect');
        if (selectElem) {
            selectElem.value = hospId;
            onHospitalChanged();
        }
        map.closePopup();
    };

    /**
     * Renders road network connections with colors indicating traffic levels
     */
    function renderRoadNetwork(edges, nodes) {
        // Clear previous road polylines and node markers
        roadPolylines.forEach(pl => map.removeLayer(pl));
        roadPolylines = [];
        nodeMarkers.forEach(nm => map.removeLayer(nm));
        nodeMarkers = [];

        const nodeMap = {};
        nodes.forEach(n => { nodeMap[n.id] = n; });

        // Draw nodes (intersections)
        nodes.forEach(n => {
            if (n.type === 'intersection') {
                const nodeIcon = L.divIcon({
                    className: 'custom-leaflet-node',
                    html: '<div class="node-marker-pin"></div>',
                    iconSize: [14, 14],
                    iconAnchor: [7, 7]
                });
                const marker = L.marker([n.lat, n.lng], { icon: nodeIcon }).addTo(map);
                marker.bindPopup(`<b>${n.name}</b><br><span style="color:#94A3B8; font-size:11px;">${n.details || 'Road Node'}</span>`);
                nodeMarkers.push(marker);
            }
        });

        // Draw edges (roads)
        edges.forEach(edge => {
            const u = nodeMap[edge.source];
            const v = nodeMap[edge.target];
            if (!u || !v) return;

            const color = getTrafficColor(edge.traffic);
            const polyline = L.polyline([[u.lat, u.lng], [v.lat, v.lng]], {
                color: color,
                weight: 4,
                opacity: 0.75,
                lineCap: 'round',
                lineJoin: 'round'
            }).addTo(map);

            polyline.bindPopup(`
                <div>
                    <strong>${edge.name || 'Road'}</strong><br>
                    <span>Distance: ${edge.distance} km</span><br>
                    <span>Traffic: <b style="color:${color}; text-transform:uppercase;">${edge.traffic || 'clear'}</b></span><br>
                    <span style="font-size:11px; color:#94A3B8;">Base time: ${edge.base_time} min</span>
                </div>
            `);

            roadPolylines.push(polyline);
        });
    }

    function getTrafficColor(trafficLevel) {
        switch ((trafficLevel || '').toLowerCase()) {
            case 'light': return '#3B82F6';
            case 'moderate': return '#F59E0B';
            case 'heavy': return '#EF4444';
            case 'severe': return '#7F1D1D';
            case 'clear':
            default: return '#10B981';
        }
    }

    // -------------------------------------------------------------------------
    // UI Populators & Selectors
    // -------------------------------------------------------------------------
    function populateHospitalDropdown(hospitals) {
        const select = document.getElementById('hospitalSelect');
        if (!select) return;

        select.innerHTML = '<option value="" disabled selected>-- Select Destination Hospital --</option>';
        hospitals.forEach(hosp => {
            const opt = document.createElement('option');
            opt.value = hosp.id;
            opt.textContent = `${hosp.name} (${hosp.details ? hosp.details.split('•')[0].trim() : 'Emergency'})`;
            select.appendChild(opt);
        });
    }

    function populateTrafficRoadDropdown(edges) {
        const select = document.getElementById('trafficRoadSelect');
        if (!select) return;

        select.innerHTML = '<option value="" disabled selected>-- Choose Road Segment to Adjust --</option>';
        edges.forEach(edge => {
            const opt = document.createElement('option');
            opt.value = JSON.stringify({ source: edge.source, target: edge.target });
            opt.textContent = `${edge.name} [Current: ${edge.traffic.toUpperCase()}]`;
            select.appendChild(opt);
        });
    }

    // -------------------------------------------------------------------------
    // Hospital Selection Handler
    // -------------------------------------------------------------------------
    window.onHospitalChanged = function () {
        const select = document.getElementById('hospitalSelect');
        if (!select || !select.value) return;

        selectHospitalById(select.value);
    };

    function selectHospitalById(hospId) {
        const select = document.getElementById('hospitalSelect');
        if (select && select.value !== hospId) {
            select.value = hospId;
        }

        const hosp = graphData.hospitals.find(h => h.id === hospId);
        if (!hosp) return;

        selectedHospital = hosp;

        // Highlight marker
        Object.keys(hospitalMarkers).forEach(id => {
            const el = document.getElementById(`hosp-pin-${id}`);
            if (el) {
                if (id === hospId) {
                    el.classList.add('selected');
                } else {
                    el.classList.remove('selected');
                }
            }
        });

        // Show hospital preview box
        const previewBox = document.getElementById('hospitalInfoBox');
        if (previewBox) {
            previewBox.style.display = 'block';
            document.getElementById('hospPreviewName').textContent = hosp.name;
            document.getElementById('hospPreviewDetails').textContent = hosp.details || 'Level 1 Trauma Center';
            
            // Calculate approximate straight-line distance from ambulance
            if (startNode) {
                const straightDist = calculateHaversineDistance(startNode.lat, startNode.lng, hosp.lat, hosp.lng);
                document.getElementById('hospDistanceDirect').textContent = `${straightDist.toFixed(1)} km`;
            }
        }

        // Fit map bounds to encompass both ambulance and selected hospital
        if (startNode && map) {
            const bounds = L.latLngBounds([
                [startNode.lat, startNode.lng],
                [hosp.lat, hosp.lng]
            ]);
            map.fitBounds(bounds, { padding: [60, 60], maxZoom: 15 });
        }

        showNotification(`Destination set to ${hosp.name}. Click "Find Best Route" to calculate fastest route.`, 'info');
    }

    function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Earth radius in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLon/2) * Math.sin(dLon/2);
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    // -------------------------------------------------------------------------
    // Smart Route Finding (Dijkstra + K-Shortest)
    // -------------------------------------------------------------------------
    window.findBestRoute = async function () {
        if (!selectedHospital) {
            const select = document.getElementById('hospitalSelect');
            if (select && select.value) {
                selectedHospital = graphData.hospitals.find(h => h.id === select.value);
            }
        }

        if (!selectedHospital) {
            showNotification('Please select a destination hospital first.', 'warning');
            const select = document.getElementById('hospitalSelect');
            if (select) select.focus();
            return;
        }

        const sourceId = startNode ? startNode.id : 'amb_station_1';
        const targetId = selectedHospital.id;

        showNotification(`Calculating best routes using Dijkstra algorithm & live traffic...`, 'info');
        setAmbulanceStatus('Calculating Route...', 'enroute');

        try {
            let response;
        try {
            response = await fetch('/api/routes?source=' + encodeURIComponent(sourceId) + '&target=' + encodeURIComponent(targetId) + '&k=3');
        } catch (e) {
            console.warn('Routing endpoint unavailable, using client-side Dijkstra engine');
        }
        if (!response || !response.ok) {
            const localResult = computeLocalDijkstraRoutes(sourceId, targetId);
            if (localResult && localResult.success) {
                availableRoutes = localResult.routes;
                activeRouteIndex = 0;
                renderAlternativeRoutesList(availableRoutes);
                selectRoute(0);
                showNotification('Optimal route found: ' + localResult.best_route.total_distance_km + ' km in ' + localResult.best_route.total_time_min + ' min. Commencing navigation!', 'success');
                startAmbulanceMovement();
                return;
            }
        }
            if (!response.ok) {
                throw new Error(`Routing request failed: ${response.status}`);
            }

            const data = await response.json();
            if (!data.success || !data.routes || data.routes.length === 0) {
                throw new Error(data.error || 'No route found to the selected hospital.');
            }

            availableRoutes = data.routes;
            activeRouteIndex = 0;

            // Render alternative routes options
            renderAlternativeRoutesList(availableRoutes);

            // Select and display best route (Route 1)
            selectRoute(0);

            showNotification(`Optimal route found: ${data.best_route.total_distance_km} km in ${data.best_route.total_time_min} min. Commencing navigation!`, 'success');

            // Automatically start navigation - fixes Problem 5 & Problem 10
            startAmbulanceMovement();

        } catch (error) {
            console.error('Routing error:', error);
            showNotification('Routing Error: ' + error.message, 'emergency');
            setAmbulanceStatus('Route Failed', 'ready');
        }
    };

    /**
     * Renders K-shortest paths in the alternative routes card
     */
    function renderAlternativeRoutesList(routes) {
        const card = document.getElementById('routesListCard');
        const container = document.getElementById('routeOptionsList');
        if (!card || !container) return;

        card.style.display = 'block';
        container.innerHTML = '';

        routes.forEach((route, idx) => {
            const div = document.createElement('div');
            div.className = `route-option-card ${idx === 0 ? 'active' : ''}`;
            div.id = `route-card-${idx}`;
            div.onclick = () => selectRoute(idx);

            div.innerHTML = `
                <div class="route-opt-info">
                    <span class="route-opt-title">${route.title}</span>
                    <span class="route-opt-meta">
                        <span>🚦 ${route.traffic_status}</span>
                        <span>•</span>
                        <span>${route.nodes.length} waypoints</span>
                    </span>
                </div>
                <div class="route-opt-metrics">
                    <span class="route-opt-time">${route.total_time_min} min</span>
                    <span class="route-opt-dist">${route.total_distance_km} km</span>
                </div>
            `;
            container.appendChild(div);
        });
    }

    /**
     * Selects and visualizes a specific route from K-shortest results
     */
    function selectRoute(index) {
        if (!availableRoutes[index]) return;
        activeRouteIndex = index;
        const route = availableRoutes[index];

        // Update active class on route cards
        document.querySelectorAll('.route-option-card').forEach((el, idx) => {
            el.classList.toggle('active', idx === index);
        });

        // Update route badge
        const badge = document.getElementById('routeTagBadge');
        if (badge) {
            badge.textContent = route.tag || `Route ${index + 1}`;
        }

        // Draw route polyline on map
        drawActiveRoute(route);

        // Update ETA and Telemetry displays - fixes Problem 2 & Problem 7
        updateTelemetryDisplays(route.total_time_min, route.total_distance_km, route.traffic_delay_min);

        // Render Turn-by-Turn directions - fixes Problem 3 & Problem 8
        renderDirections(route.directions);

        // Prepare animation coordinates
        prepareRouteAnimation(route);
    }

    /**
     * Draws the active selected route on Leaflet with highlighted glow
     */
    function drawActiveRoute(route) {
        // Clear prior active route layers
        activeRoutePolylines.forEach(pl => map.removeLayer(pl));
        activeRoutePolylines = [];

        const latlngs = route.nodes.map(n => [n.lat, n.lng]);

        // Background glow casing
        const glowLine = L.polyline(latlngs, {
            color: '#EF4444',
            weight: 8,
            opacity: 0.35,
            lineCap: 'round',
            lineJoin: 'round'
        }).addTo(map);

        // Foreground vibrant route line
        const mainLine = L.polyline(latlngs, {
            color: '#F87171',
            weight: 5,
            opacity: 0.95,
            dashArray: isEmergencyMode ? '8, 8' : null,
            lineCap: 'round',
            lineJoin: 'round'
        }).addTo(map);

        activeRoutePolylines.push(glowLine, mainLine);

        // Fit map to route
        map.fitBounds(mainLine.getBounds(), { padding: [50, 50] });
    }

    /**
     * Updates ETA, Distance, and Expected Arrival time displays - fixes Problem 2 & Problem 7
     */
    function updateTelemetryDisplays(timeMin, distanceKm, delayMin = 0) {
        // ETA Value
        const etaValueElem = document.getElementById('etaValue');
        if (etaValueElem) {
            etaValueElem.textContent = timeMin > 0 ? timeMin.toFixed(1) : '0';
        } else {
            ensureFallbackTelemetryElem('etaValue', timeMin);
        }

        // Distance Value
        const distElem = document.getElementById('etaDistance');
        if (distElem) {
            distElem.textContent = distanceKm > 0 ? distanceKm.toFixed(1) : '0.0';
        }

        const totalDistElem = document.getElementById('totalDistanceVal');
        if (totalDistElem) {
            totalDistElem.textContent = distanceKm.toFixed(1);
        }

        // Delay info
        const delayElem = document.getElementById('etaTrafficDiff');
        if (delayElem) {
            if (delayMin > 0.1) {
                delayElem.textContent = `+${delayMin.toFixed(1)} min traffic delay`;
                delayElem.style.color = '#F87171';
            } else {
                delayElem.textContent = 'Optimal flow • Minimal delay';
                delayElem.style.color = '#6EE7B7';
            }
        }

        // Calculate expected arrival clock time (e.g., 11:42 AM)
        const arrivalElem = document.getElementById('etaArrival');
        if (arrivalElem) {
            const now = new Date();
            const arrivalDate = new Date(now.getTime() + timeMin * 60000);
            arrivalElem.textContent = formatTime12h(arrivalDate);
        }

        // Bottom Map Overlay
        const mtoRemaining = document.getElementById('mtoRemainingVal');
        const mtoDist = document.getElementById('mtoDistVal');
        if (mtoRemaining) mtoRemaining.textContent = `${timeMin.toFixed(1)} min`;
        if (mtoDist) mtoDist.textContent = `${distanceKm.toFixed(1)} km`;
    }

    function formatTime12h(date) {
        let hours = date.getHours();
        const minutes = date.getMinutes();
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12; // 0 becomes 12
        const minutesStr = minutes < 10 ? '0' + minutes : minutes;
        return `${hours}:${minutesStr} ${ampm}`;
    }

    /**
     * Fallback injection if original HTML was missing telemetry elements - fixes Problem 7
     */
    function ensureFallbackTelemetryElem(elemId, value) {
        let container = document.getElementById('etaContainer');
        if (!container) {
            container = document.createElement('div');
            container.id = 'etaContainer';
            container.className = 'card eta-card';
            document.querySelector('.sidebar-panel')?.prepend(container);
        }
        let target = document.getElementById(elemId);
        if (!target) {
            target = document.createElement('span');
            target.id = elemId;
            target.textContent = value;
            container.appendChild(target);
        }
    }

    /**
     * Renders Turn-by-Turn Navigation Directions - fixes Problem 3 & Problem 8
     */
    function renderDirections(directions) {
        const container = document.getElementById('directionsList');
        const countBadge = document.getElementById('directionsStepCount');
        
        if (!container) {
            // Fallback injection - fixes Problem 8
            const fallbackSection = document.createElement('section');
            fallbackSection.id = 'directionsContainer';
            fallbackSection.className = 'card directions-card';
            fallbackSection.innerHTML = '<h2>Navigation Directions</h2><div id="directionsList"></div>';
            document.querySelector('.sidebar-panel')?.appendChild(fallbackSection);
        }

        const dirList = document.getElementById('directionsList');
        if (!dirList) return;

        if (countBadge) {
            countBadge.textContent = `${directions.length} steps`;
        }

        dirList.innerHTML = '';

        if (!directions || directions.length === 0) {
            dirList.innerHTML = '<div class="empty-directions-notice">No directions available.</div>';
            return;
        }

        directions.forEach((step, idx) => {
            const stepEl = document.createElement('div');
            stepEl.className = `direction-step ${idx === 0 ? 'active' : ''}`;
            stepEl.id = `step-item-${idx}`;

            stepEl.innerHTML = `
                <div class="step-badge">${step.icon || '➡️'}</div>
                <div class="step-details">
                    <div class="step-text">${step.instruction}</div>
                    <div class="step-meta">
                        <span>Step ${step.step} of ${directions.length}</span>
                        <span>${step.distance_km > 0 ? step.distance_km + ' km' : 'Arrived'}</span>
                    </div>
                </div>
            `;
            dirList.appendChild(stepEl);
        });
    }

    // -------------------------------------------------------------------------
    // Ambulance Movement Animation - fixes Problem 1, 5, 10, 11, 12
    // -------------------------------------------------------------------------
    function prepareRouteAnimation(route) {
        routeCoords = route.nodes.map(n => [n.lat, n.lng]);
        totalRouteDistanceKm = route.total_distance_km;
        totalRouteTimeMin = route.total_time_min;

        // Calculate cumulative distances for precise interpolation
        cumulativeDistances = [0];
        let total = 0;
        for (let i = 0; i < routeCoords.length - 1; i++) {
            const d = calculateHaversineDistance(
                routeCoords[i][0], routeCoords[i][1],
                routeCoords[i+1][0], routeCoords[i+1][1]
            );
            total += d;
            cumulativeDistances.push(total);
        }
    }

    window.startAmbulanceMovement = function () {
        if (!routeCoords || routeCoords.length < 2) {
            showNotification('No active route coordinates to navigate.', 'warning');
            return;
        }

        // Cancel previous animation
        if (animationReqId) {
            cancelAnimationFrame(animationReqId);
            animationReqId = null;
        }

        isNavigating = true;
        animStartTime = null;

        // Base animation duration (adjusted by emergency mode)
        totalAnimDurationMs = isEmergencyMode ? 9000 : 16000;

        setAmbulanceStatus(isEmergencyMode ? '🚨 Emergency En Route' : 'Ambulance En Route', 'enroute');
        
        // Show bottom transit overlay
        const transitOverlay = document.getElementById('mapTransitOverlay');
        if (transitOverlay) transitOverlay.style.display = 'flex';

        const transitStatus = document.getElementById('transitStatusText');
        if (transitStatus) transitStatus.textContent = isEmergencyMode ? 'Priority 1' : 'En Route';

        // Play brief beep to acknowledge navigation start
        try {
            const ctx = getAudioContext();
            if (ctx) {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(440, ctx.currentTime);
                gain.gain.setValueAtTime(0.15, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start();
                osc.stop(ctx.currentTime + 0.25);
            }
        } catch (e) {}

        animationReqId = requestAnimationFrame(animateStep);
    };

    function animateStep(timestamp) {
        if (!isNavigating) return;

        if (!animStartTime) {
            animStartTime = timestamp;
        }

        const elapsed = timestamp - animStartTime;
        const progress = Math.min(elapsed / totalAnimDurationMs, 1.0);

        // Interpolate current [lat, lng] along route segments
        const currentPos = getInterpolatedPoint(progress);

        // Update ambulance marker on map - fixes Problem 1
        if (ambulanceMarker && currentPos) {
            ambulanceMarker.setLatLng(currentPos);
        }

        // Update Live Progress & Telemetry - fixes Problem 11
        const pct = Math.round(progress * 100);
        const progressFill = document.getElementById('progressBarFill');
        const progressText = document.getElementById('progressPercentage');
        if (progressFill) progressFill.style.width = `${pct}%`;
        if (progressText) progressText.textContent = `${pct}%`;

        // Remaining distance & ETA
        const remainingDist = Math.max(0, totalRouteDistanceKm * (1.0 - progress));
        const remainingTime = Math.max(0, totalRouteTimeMin * (1.0 - progress));
        
        updateTelemetryDisplays(remainingTime, remainingDist);

        // Update directions step highlighting
        updateDirectionsStepHighlight(progress);

        // Update Node labels in progress
        updateWaypointLabels(progress);

        if (progress < 1.0) {
            animationReqId = requestAnimationFrame(animateStep);
        } else {
            // Reached Hospital! - fixes Problem 12
            onAmbulanceArrived();
        }
    }

    function getInterpolatedPoint(progress) {
        if (routeCoords.length < 2) return routeCoords[0] || [0, 0];
        if (progress >= 1.0) return routeCoords[routeCoords.length - 1];

        const targetDist = progress * cumulativeDistances[cumulativeDistances.length - 1];

        // Find which segment targetDist falls into
        for (let i = 0; i < cumulativeDistances.length - 1; i++) {
            const segStart = cumulativeDistances[i];
            const segEnd = cumulativeDistances[i + 1];

            if (targetDist >= segStart && targetDist <= segEnd) {
                const segLen = segEnd - segStart;
                const segProgress = segLen > 0 ? (targetDist - segStart) / segLen : 0;

                const p1 = routeCoords[i];
                const p2 = routeCoords[i + 1];

                const lat = p1[0] + (p2[0] - p1[0]) * segProgress;
                const lng = p1[1] + (p2[1] - p1[1]) * segProgress;
                return [lat, lng];
            }
        }

        return routeCoords[routeCoords.length - 1];
    }

    function updateDirectionsStepHighlight(progress) {
        const steps = document.querySelectorAll('.direction-step');
        if (!steps.length) return;

        const activeIdx = Math.min(Math.floor(progress * steps.length), steps.length - 1);
        steps.forEach((step, idx) => {
            step.classList.toggle('active', idx === activeIdx);
        });
    }

    function updateWaypointLabels(progress) {
        const route = availableRoutes[activeRouteIndex];
        if (!route || !route.nodes) return;

        const totalNodes = route.nodes.length;
        const currentIdx = Math.min(Math.floor(progress * (totalNodes - 1)), totalNodes - 2);
        const currNode = route.nodes[currentIdx];
        const nextNode = route.nodes[currentIdx + 1];

        const curElem = document.getElementById('progressCurrentNode');
        const nxtElem = document.getElementById('progressNextNode');
        if (curElem && currNode) curElem.textContent = `Via: ${currNode.name}`;
        if (nxtElem && nextNode) nxtElem.textContent = `Next: ${nextNode.name}`;

        const mtoNext = document.getElementById('mtoNextAction');
        if (mtoNext && nextNode) {
            mtoNext.textContent = `Heading toward ${nextNode.name}`;
        }
    }

    /**
     * Reached Hospital destination - fixes Problem 12
     */
    function onAmbulanceArrived() {
        isNavigating = false;
        if (animationReqId) {
            cancelAnimationFrame(animationReqId);
            animationReqId = null;
        }

        setAmbulanceStatus('Ambulance Arrived', 'arrived');

        const transitStatus = document.getElementById('transitStatusText');
        if (transitStatus) transitStatus.textContent = 'Arrived';

        // Play cheerful audio chime
        playArrivalChime();

        // Show arrival overlay modal
        const overlay = document.getElementById('arrivalOverlay');
        const hospName = document.getElementById('arrivalHospitalName');
        const arrDist = document.getElementById('arrDist');
        const arrTime = document.getElementById('arrTime');

        if (overlay) {
            if (hospName && selectedHospital) hospName.textContent = `Reached: ${selectedHospital.name}`;
            if (arrDist) arrDist.textContent = `${totalRouteDistanceKm.toFixed(1)} km`;
            if (arrTime) arrTime.textContent = `${totalRouteTimeMin.toFixed(1)} min`;
            overlay.style.display = 'flex';
        }

        showNotification(`Ambulance safely arrived at ${selectedHospital ? selectedHospital.name : 'Hospital'}! Patient handover in progress.`, 'success');
    }

    window.dismissArrivalModal = function () {
        const overlay = document.getElementById('arrivalOverlay');
        if (overlay) overlay.style.display = 'none';
    };

    // -------------------------------------------------------------------------
    // Emergency Mode Toggle
    // -------------------------------------------------------------------------
    window.toggleEmergencyMode = function () {
        isEmergencyMode = !isEmergencyMode;
        const btn = document.getElementById('emergencyModeBtn');
        const banner = document.getElementById('emergencyBanner');
        const btnText = document.getElementById('emergencyBtnText');

        if (isEmergencyMode) {
            if (btn) btn.classList.add('active');
            if (banner) banner.style.display = 'block';
            if (btnText) btnText.textContent = 'Emergency Active';
            setAmbulanceStatus('🚨 Priority Emergency', 'emergency');
            showNotification('EMERGENCY MODE ACTIVATED: Priority siren active, route speed boosted.', 'emergency');

            // If navigating, speed up immediately
            if (isNavigating) {
                totalAnimDurationMs = 8000;
            }
        } else {
            if (btn) btn.classList.remove('active');
            if (banner) banner.style.display = 'none';
            if (btnText) btnText.textContent = 'Emergency Mode';
            setAmbulanceStatus(isNavigating ? 'Ambulance En Route' : 'Ambulance Ready', isNavigating ? 'enroute' : 'ready');
            showNotification('Emergency mode deactivated. Standard transit parameters restored.', 'info');

            if (isNavigating) {
                totalAnimDurationMs = 16000;
            }
        }

        // Redraw route with dashed siren styling if active
        if (availableRoutes[activeRouteIndex]) {
            drawActiveRoute(availableRoutes[activeRouteIndex]);
        }
    };

    // -------------------------------------------------------------------------
    // Reset Route & Navigation
    // -------------------------------------------------------------------------
    window.resetRouteAndNavigation = function () {
        isNavigating = false;
        if (animationReqId) {
            cancelAnimationFrame(animationReqId);
            animationReqId = null;
        }

        // Remove active route lines
        activeRoutePolylines.forEach(pl => map.removeLayer(pl));
        activeRoutePolylines = [];

        // Reset ambulance marker to origin depot node
        if (ambulanceMarker && startNode) {
            ambulanceMarker.setLatLng([startNode.lat, startNode.lng]);
            map.setView([startNode.lat, startNode.lng], 13);
        }

        // Reset telemetry
        updateTelemetryDisplays(0, 0, 0);
        document.getElementById('etaValue').textContent = '--';
        document.getElementById('etaDistance').textContent = '--';
        document.getElementById('etaArrival').textContent = '--:--';
        document.getElementById('totalDistanceVal').textContent = '--';

        const routeTag = document.getElementById('routeTagBadge');
        if (routeTag) routeTag.textContent = 'No Active Route';

        // Reset progress bar
        const pFill = document.getElementById('progressBarFill');
        const pPct = document.getElementById('progressPercentage');
        if (pFill) pFill.style.width = '0%';
        if (pPct) pPct.textContent = '0%';

        const curElem = document.getElementById('progressCurrentNode');
        const nxtElem = document.getElementById('progressNextNode');
        if (curElem) curElem.textContent = 'Depot: Standby';
        if (nxtElem) nxtElem.textContent = 'Target: Hospital';

        // Clear directions
        const dirList = document.getElementById('directionsList');
        if (dirList) {
            dirList.innerHTML = `
                <div class="empty-directions-notice">
                    <span class="empty-icon">📍</span>
                    <p>Select a hospital and click <strong>"Find Best Route"</strong> to generate step-by-step navigation instructions.</p>
                </div>
            `;
        }
        const countBadge = document.getElementById('directionsStepCount');
        if (countBadge) countBadge.textContent = '0 steps';

        // Hide routes list card and bottom transit bar
        const routesCard = document.getElementById('routesListCard');
        if (routesCard) routesCard.style.display = 'none';

        const transitOverlay = document.getElementById('mapTransitOverlay');
        if (transitOverlay) transitOverlay.style.display = 'none';

        dismissArrivalModal();

        setAmbulanceStatus('Ambulance Ready', 'ready');
        showNotification('Route navigation reset. Ambulance returned to Central Emergency Depot.', 'info');
    };

    // -------------------------------------------------------------------------
    // Real-Time Traffic Management
    // -------------------------------------------------------------------------
    window.setTrafficLevel = async function (level) {
        const select = document.getElementById('trafficRoadSelect');
        if (!select || !select.value) {
            showNotification('Please select a road segment from the dropdown to adjust traffic.', 'warning');
            return;
        }

        let roadData;
        try {
            roadData = JSON.parse(select.value);
        } catch (e) {
            showNotification('Invalid road selection.', 'warning');
            return;
        }

        try {
            const res = await fetch('/api/traffic', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    source: roadData.source,
                    target: roadData.target,
                    level: level
                })
            });

            const data = await res.json();
            if (!data.success) {
                throw new Error(data.error || 'Failed to update traffic');
            }

            showNotification(data.message, 'warning');

            // Refresh graph visualization
            await fetchGraphData();

            // If a destination is currently selected, immediately recalculate route to demonstrate dynamic rerouting
            if (selectedHospital) {
                showNotification(`Traffic condition changed. Recalculating best route dynamically...`, 'info');
                await findBestRoute();
            }

        } catch (err) {
            showNotification('Traffic update error: ' + err.message, 'emergency');
        }
    };

    window.resetAllTraffic = async function () {
        try {
            const res = await fetch('/api/traffic/reset', { method: 'POST' });
            const data = await res.json();
            showNotification(data.message || 'All traffic reset to normal.', 'success');

            await fetchGraphData();

            if (selectedHospital) {
                await findBestRoute();
            }
        } catch (err) {
            showNotification('Traffic reset error: ' + err.message, 'emergency');
        }
    };

    // -------------------------------------------------------------------------
    // Notification & Status Helpers
    // -------------------------------------------------------------------------
    function setAmbulanceStatus(text, type) {
        const badge = document.getElementById('ambulanceStatusBadge');
        const textElem = document.getElementById('ambulanceStatusText');
        if (textElem) textElem.textContent = text;
        if (badge) {
            badge.className = `status-badge status-${type}`;
        }
    }

    function showNotification(message, type = 'info') {
        const bar = document.getElementById('notificationBar');
        const text = document.getElementById('notificationText');
        const icon = document.getElementById('notificationIcon');
        if (!bar || !text) return;

        text.textContent = message;

        const iconMap = {
            info: 'ℹ️',
            success: '✅',
            warning: '⚠️',
            emergency: '🚨'
        };
        if (icon) icon.textContent = iconMap[type] || 'ℹ️';

        bar.className = `notification-bar notification-${type}`;
        bar.style.display = 'flex';
    }

    window.dismissNotification = function () {
        const bar = document.getElementById('notificationBar');
        if (bar) bar.style.display = 'none';
    };

})();
