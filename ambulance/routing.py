"""
Graph Routing Engine with Dijkstra and K-Shortest Paths (Yen's algorithm).
Calculates travel time weighted by dynamic traffic levels and produces
turn-by-turn navigation instructions with bearings.
"""

import math
import heapq

TRAFFIC_MULTIPLIERS = {
    "clear": 1.0,
    "light": 1.25,
    "moderate": 1.6,
    "heavy": 2.2,
    "severe": 3.2
}

class RoutingEngine:
    def __init__(self, nodes, edges):
        self.nodes_dict = {n["id"]: n for n in nodes}
        self.raw_edges = edges
        self.adjacency = {}
        self.edge_details = {}
        self._build_graph()

    def _build_graph(self):
        self.adjacency = {nid: [] for nid in self.nodes_dict}
        self.edge_details = {}

        for edge in self.raw_edges:
            u = edge["source"]
            v = edge["target"]
            dist = float(edge.get("distance", 1.0))
            base_time = float(edge.get("base_time", 2.0))
            traffic = edge.get("traffic", "clear").lower()
            mult = TRAFFIC_MULTIPLIERS.get(traffic, 1.0)
            cost = base_time * mult
            name = edge.get("name", f"Road between {u} and {v}")

            edge_info = {
                "source": u,
                "target": v,
                "name": name,
                "distance": dist,
                "base_time": base_time,
                "traffic": traffic,
                "effective_time": cost
            }

            # Undirected road network (roads can be traveled both ways by emergency ambulances)
            self.edge_details[(u, v)] = edge_info
            self.edge_details[(v, u)] = {
                **edge_info,
                "source": v,
                "target": u
            }

            if u in self.adjacency and v in self.nodes_dict:
                self.adjacency[u].append(v)
            if v in self.adjacency and u in self.nodes_dict:
                self.adjacency[v].append(u)

    def update_traffic(self, source, target, level):
        level = level.lower()
        if level not in TRAFFIC_MULTIPLIERS:
            level = "moderate"
        
        found = False
        for edge in self.raw_edges:
            if (edge["source"] == source and edge["target"] == target) or \
               (edge["source"] == target and edge["target"] == source):
                edge["traffic"] = level
                found = True
        
        self._build_graph()
        return found

    def reset_traffic(self):
        for edge in self.raw_edges:
            edge["traffic"] = "clear"
        self._build_graph()

    def _dijkstra(self, source, target, excluded_edges=None, excluded_nodes=None):
        if excluded_edges is None:
            excluded_edges = set()
        if excluded_nodes is None:
            excluded_nodes = set()

        if source not in self.nodes_dict or target not in self.nodes_dict:
            return None, float("inf"), 0.0

        pq = [(0.0, source, [source])]
        min_cost = {source: 0.0}

        while pq:
            current_cost, u, path = heapq.heappop(pq)

            if current_cost > min_cost.get(u, float("inf")):
                continue

            if u == target:
                total_dist = sum(self.edge_details.get((path[i], path[i+1]), {}).get("distance", 1.0) for i in range(len(path) - 1))
                return path, current_cost, total_dist

            for v in self.adjacency.get(u, []):
                if v in excluded_nodes:
                    continue
                if (u, v) in excluded_edges or (v, u) in excluded_edges:
                    continue

                edge_info = self.edge_details.get((u, v))
                if not edge_info:
                    continue

                weight = edge_info["effective_time"]
                new_cost = current_cost + weight

                if new_cost < min_cost.get(v, float("inf")):
                    min_cost[v] = new_cost
                    heapq.heappush(pq, (new_cost, v, path + [v]))

        return None, float("inf"), 0.0

    def find_k_shortest_paths(self, source, target, k=3):
        """
        Yen's algorithm for finding top K loopless shortest paths.
        Considers traffic-weighted effective travel time.
        """
        if source not in self.nodes_dict or target not in self.nodes_dict:
            return []

        first_path, first_cost, first_dist = self._dijkstra(source, target)
        if not first_path:
            return []

        A = [{"path": first_path, "cost": first_cost, "dist": first_dist}]
        B = []  # Candidate paths heap: (cost, dist, path)

        for i in range(1, k):
            prev_path = A[i - 1]["path"]
            for j in range(len(prev_path) - 1):
                spur_node = prev_path[j]
                root_path = prev_path[:j + 1]

                excluded_edges = set()
                for a in A:
                    p = a["path"]
                    if len(p) > j and p[:j + 1] == root_path:
                        excluded_edges.add((p[j], p[j + 1]))
                        excluded_edges.add((p[j + 1], p[j]))

                excluded_nodes = set(root_path[:-1])

                spur_path, spur_cost, _ = self._dijkstra(spur_node, target, excluded_edges, excluded_nodes)

                if spur_path:
                    total_path = root_path[:-1] + spur_path
                    # Check loopless
                    if len(total_path) == len(set(total_path)):
                        cost = self._calculate_path_cost(total_path)
                        dist = self._calculate_path_distance(total_path)
                        candidate = {"path": total_path, "cost": cost, "dist": dist}
                        if candidate not in B and candidate not in A:
                            B.append(candidate)

            if not B:
                break

            B.sort(key=lambda x: x["cost"])
            A.append(B.pop(0))

        # Format and enrich route outputs
        routes = []
        for idx, route_data in enumerate(A):
            path_nodes = route_data["path"]
            route_dict = self._enrich_route(idx + 1, path_nodes)
            routes.append(route_dict)

        return routes

    def _calculate_path_cost(self, path):
        total = 0.0
        for i in range(len(path) - 1):
            u, v = path[i], path[i + 1]
            info = self.edge_details.get((u, v), {})
            total += info.get("effective_time", 2.0)
        return total

    def _calculate_path_distance(self, path):
        total = 0.0
        for i in range(len(path) - 1):
            u, v = path[i], path[i + 1]
            info = self.edge_details.get((u, v), {})
            total += info.get("distance", 1.0)
        return total

    def _enrich_route(self, route_num, path_nodes):
        nodes_info = [self.nodes_dict[nid] for nid in path_nodes if nid in self.nodes_dict]
        total_distance = 0.0
        total_time = 0.0
        base_time = 0.0
        traffic_breakdown = []
        segments = []

        for i in range(len(path_nodes) - 1):
            u, v = path_nodes[i], path_nodes[i + 1]
            edge = self.edge_details.get((u, v), {
                "name": f"{self.nodes_dict.get(u, {}).get('name', u)} to {self.nodes_dict.get(v, {}).get('name', v)}",
                "distance": 1.0,
                "base_time": 2.0,
                "effective_time": 2.0,
                "traffic": "clear"
            })
            d = edge.get("distance", 1.0)
            t = edge.get("effective_time", 2.0)
            bt = edge.get("base_time", 2.0)
            tr = edge.get("traffic", "clear")

            total_distance += d
            total_time += t
            base_time += bt
            traffic_breakdown.append(tr)

            segments.append({
                "from_node": u,
                "to_node": v,
                "road_name": edge.get("name", "Connecting Road"),
                "distance_km": round(d, 2),
                "time_min": round(t, 1),
                "traffic": tr
            })

        # Calculate high traffic segments count
        heavy_count = traffic_breakdown.count("heavy") + traffic_breakdown.count("severe")
        if heavy_count > 0:
            traffic_status = f"Heavy delay on {heavy_count} segment(s)"
        elif "moderate" in traffic_breakdown:
            traffic_status = "Moderate flow"
        else:
            traffic_status = "Optimal / Clear flow"

        # Generate step-by-step directions
        directions = self._generate_directions(nodes_info, segments)

        tag = "Fastest Route" if route_num == 1 else f"Alternative Route {route_num}"

        return {
            "id": f"route_{route_num}",
            "route_number": route_num,
            "title": f"Route {route_num} ({tag})",
            "tag": tag,
            "path": path_nodes,
            "nodes": nodes_info,
            "segments": segments,
            "total_distance_km": round(total_distance, 2),
            "total_time_min": round(total_time, 1),
            "base_time_min": round(base_time, 1),
            "traffic_delay_min": round(max(0.0, total_time - base_time), 1),
            "traffic_status": traffic_status,
            "directions": directions
        }

    def _generate_directions(self, nodes_info, segments):
        if not nodes_info or len(nodes_info) < 2:
            return []

        directions = []
        # Step 1: Departure
        start_name = nodes_info[0].get("name", "Ambulance Station")
        first_seg = segments[0] if segments else None
        first_road = first_seg.get("road_name", "the main road") if first_seg else "Main Street"
        first_dist = first_seg.get("distance_km", 0.5) if first_seg else 0.5

        directions.append({
            "step": 1,
            "action": "depart",
            "icon": "🚑",
            "instruction": f"Depart from {start_name} onto {first_road}",
            "distance_km": first_dist,
            "road_name": first_road
        })

        # Intermediary steps
        for i in range(1, len(nodes_info) - 1):
            prev_node = nodes_info[i - 1]
            curr_node = nodes_info[i]
            next_node = nodes_info[i + 1]
            seg = segments[i] if i < len(segments) else None
            road_name = seg.get("road_name", "Connecting Avenue") if seg else "Next Road"
            seg_dist = seg.get("distance_km", 0.8) if seg else 0.8

            turn_action, turn_icon = self._calculate_turn(prev_node, curr_node, next_node)

            directions.append({
                "step": len(directions) + 1,
                "action": turn_action,
                "icon": turn_icon,
                "instruction": f"{turn_action} at {curr_node.get('name', 'Junction')} onto {road_name} ({seg_dist} km)",
                "distance_km": seg_dist,
                "road_name": road_name
            })

        # Final step: Destination Arrival
        dest_name = nodes_info[-1].get("name", "Hospital")
        directions.append({
            "step": len(directions) + 1,
            "action": "arrive",
            "icon": "🏥",
            "instruction": f"Arrive at destination: {dest_name} (Emergency Bay)",
            "distance_km": 0.0,
            "road_name": dest_name
        })

        return directions

    def _calculate_turn(self, p1, p2, p3):
        # Calculate bearing from p1 to p2 and p2 to p3
        b1 = self._bearing(p1["lat"], p1["lng"], p2["lat"], p2["lng"])
        b2 = self._bearing(p2["lat"], p2["lng"], p3["lat"], p3["lng"])
        diff = (b2 - b1 + 360) % 360

        if diff <= 25 or diff >= 335:
            return "Continue straight", "⬆️"
        elif 25 < diff <= 65:
            return "Bear slightly right", "↗️"
        elif 65 < diff <= 135:
            return "Turn right", "➡️"
        elif 135 < diff <= 225:
            return "Sharp turn / U-turn", "🔄"
        elif 225 < diff <= 295:
            return "Turn left", "⬅️"
        else:
            return "Bear slightly left", "↖️"

    def _bearing(self, lat1, lng1, lat2, lng2):
        r1, c1 = math.radians(lat1), math.radians(lng1)
        r2, c2 = math.radians(lat2), math.radians(lng2)
        d_lng = c2 - c1
        y = math.sin(d_lng) * math.cos(r2)
        x = math.cos(r1) * math.sin(r2) - math.sin(r1) * math.cos(r2) * math.cos(d_lng)
        b = math.degrees(math.atan2(y, x))
        return (b + 360) % 360
