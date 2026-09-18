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
     * Initializes the Leaflet map with OpenStreetMap dark tiles & Hyderabad center
     */
    function initMap() {
        if (map) return;

        // Centered over Hyderabad metropolitan area
        map = L.map('map', {
            center: [17.405, 78.475],
            zoom: 12,
            zoomControl: true
        });

        // CartoDB Dark Matter / OSM Tile Layer
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
            subdomains: 'abcd',
            maxZoom: 19
        }).addTo(map);

        // Allow user to click anywhere on Hyderabad map to position the ambulance
        map.on('click', onMapClick);

        // Invalidate map size on window resize
        window.addEventListener('resize', function () {
            if (map) map.invalidateSize();
        });
    }

    /**
     * Handles map click to place the ambulance at custom coordinates and snap to nearest road node
     */
    function onMapClick(e) {
        if (isNavigating) {
            showNotification('Navigation is currently active. Please reset the route before changing origin.', 'warning');
            return;
        }

        const lat = e.latlng.lat;
        const lng = e.latlng.lng;

        const nearest = findLocalNearestNode(lat, lng);
        if (!nearest) return;

        setAmbulancePosition(nearest, lat, lng, true);
        showNotification(`Ambulance placed at [${lat.toFixed(4)}, ${lng.toFixed(4)}] snapped near ${nearest.name}. Ready to dispatch.`, 'info');
    }

    function findLocalNearestNode(lat, lng) {
        if (!graphData.nodes || !graphData.nodes.length) return null;
        let best = null;
        let minDist = Infinity;
        for (const n of graphData.nodes) {
            const d = calculateHaversineDistance(lat, lng, n.lat, n.lng);
            if (d < minDist) {
                minDist = d;
                best = n;
            }
        }
        return best;
    }

    function setAmbulancePosition(node, lat, lng, isCustomCoord = false) {
        startNode = {
            ...node,
            lat: lat !== undefined ? lat : node.lat,
            lng: lng !== undefined ? lng : node.lng,
            snappedNodeId: node.id
        };

        ensureAmbulanceMarker(startNode.lat, startNode.lng);

        const startNameElem = document.getElementById('startNodeName');
        const startCoordsElem = document.getElementById('startNodeCoords');
        const areaSelect = document.getElementById('originAreaSelect');

        if (startNameElem) {
            startNameElem.textContent = isCustomCoord ? `${node.name} (Custom Point)` : node.name;
        }
        if (startCoordsElem) {
            startCoordsElem.textContent = `Lat: ${startNode.lat.toFixed(4)}, Lng: ${startNode.lng.toFixed(4)}`;
        }

        if (areaSelect) {
            areaSelect.value = node.id;
        }

        // Update hospital preview direct distance if one is selected
        if (selectedHospital) {
            const straightDist = calculateHaversineDistance(startNode.lat, startNode.lng, selectedHospital.lat, selectedHospital.lng);
            const distElem = document.getElementById('hospDistanceDirect');
            if (distElem) distElem.textContent = `${straightDist.toFixed(1)} km`;
        }

        // Clear active route if origin shifted
        if (availableRoutes.length > 0 && !isNavigating) {
            activeRoutePolylines.forEach(pl => map.removeLayer(pl));
            activeRoutePolylines = [];
            availableRoutes = [];
            const routesCard = document.getElementById('routesListCard');
            if (routesCard) routesCard.style.display = 'none';
        }
    }

    // -------------------------------------------------------------------------
    // Fetch Graph & Setup Network
    // -------------------------------------------------------------------------
    async function fetchGraphData() {
        updateLoadingStatus('Connecting to Hyderabad emergency route server...');

        try {
            const response = await fetch('/api/graph');
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
            setAmbulancePosition(startNode, startNode.lat, startNode.lng, false);

            // Render road network and markers
            renderRoadNetwork(data.edges, data.nodes);
            renderHospitals(data.hospitals);
            ensureAmbulanceMarker(startNode.lat, startNode.lng);

            // Populate dropdowns
            populateOriginAreaDropdown(data.areas, startNode);
            populateHospitalDropdown(data.hospitals);
            populateTrafficRoadDropdown(data.edges);

            // Center map on starting ambulance node
            if (startNode) {
                map.setView([startNode.lat, startNode.lng], 12);
            }

            // Dismiss loading overlay completely
            hideLoadingOverlay();

            showNotification('Hyderabad city-wide road network loaded. Ambulance ready for dispatch.', 'info');

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
    function populateOriginAreaDropdown(areas, defaultNode) {
        const select = document.getElementById('originAreaSelect');
        if (!select) return;

        select.innerHTML = '<option value="" disabled selected>-- Select Ambulance Origin (Hyderabad) --</option>';

        if (areas && areas.length) {
            areas.forEach(item => {
                const opt = document.createElement('option');
                opt.value = item.id;
                opt.textContent = `${item.area} — ${item.name}`;
                if (defaultNode && (defaultNode.id === item.id || defaultNode.area === item.area)) {
                    opt.selected = true;
                }
                select.appendChild(opt);
            });
        } else if (graphData.nodes) {
            graphData.nodes.filter(n => n.type === 'intersection').forEach(n => {
                const opt = document.createElement('option');
                opt.value = n.id;
                opt.textContent = `${n.area || n.name} — ${n.name}`;
                if (defaultNode && defaultNode.id === n.id) {
                    opt.selected = true;
                }
                select.appendChild(opt);
            });
        }
    }

    window.onOriginAreaChanged = function () {
        const select = document.getElementById('originAreaSelect');
        if (!select || !select.value) return;

        const nodeId = select.value;
        const node = graphData.nodes.find(n => n.id === nodeId);
        if (!node) return;

        setAmbulancePosition(node, node.lat, node.lng, false);
        map.setView([node.lat, node.lng], 13);
        showNotification(`Ambulance relocated to ${node.name} (${node.area || 'Hyderabad'}).`, 'info');
    };

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

        const sourceId = (startNode && startNode.snappedNodeId) ? startNode.snappedNodeId : (startNode ? startNode.id : 'amb_central_hyderabad');
        const targetId = selectedHospital.id;

        showNotification(`Calculating best routes across Hyderabad using Dijkstra algorithm & live traffic...`, 'info');
        setAmbulanceStatus('Calculating Route...', 'enroute');

        try {
            let url = `/api/routes?source=${sourceId}&target=${targetId}&k=3`;
            if (startNode && startNode.lat !== undefined && startNode.lng !== undefined) {
                url += `&source_lat=${startNode.lat}&source_lng=${startNode.lng}`;
            }

            const response = await fetch(url);
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

            // Automatically start navigation
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
