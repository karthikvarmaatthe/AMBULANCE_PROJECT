"""
Builder script to generate the comprehensive, scalable Hyderabad city-wide road network.
Connects all major hubs, expressways, flyovers, ring roads, and 26 major hospitals.
Computes real Haversine distances and base emergency traversal times.
Verifies complete graph reachability (single connected component).
"""

import json
import math
import sys
import os

def haversine_km(lat1, lon1, lat2, lon2):
    R = 6371.0 # Earth radius in km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return round(R * c, 2)

# Major Hyderabad Hubs & Intersections
HUBS = [
    # West & IT Corridor
    {"id": "loc_gachibowli", "name": "Gachibowli Junction", "area": "Gachibowli", "lat": 17.4399, "lng": 78.3614, "type": "intersection", "details": "Bio-Diversity & Outer Ring Road Interchange"},
    {"id": "loc_financial_dist", "name": "Financial District", "area": "Financial District", "lat": 17.4180, "lng": 78.3420, "type": "intersection", "details": "WaveRock & IT SEZ Hub"},
    {"id": "loc_nallagandla", "name": "Nallagandla Flyover", "area": "Nallagandla", "lat": 17.4720, "lng": 78.3070, "type": "intersection", "details": "Tellapur & BHEL Corridor"},
    {"id": "loc_hitech_city", "name": "Hitech City Cyber Towers", "area": "Hitech City", "lat": 17.4504, "lng": 78.3808, "type": "intersection", "details": "Cyber Towers Core Intersection"},
    {"id": "loc_madhapur", "name": "Madhapur Mindspace", "area": "Madhapur", "lat": 17.4334, "lng": 78.3866, "type": "intersection", "details": "Mindspace IT Park & Inorbit Mall Corridor"},
    {"id": "loc_kondapur", "name": "Kondapur Kothaguda Junction", "area": "Kondapur", "lat": 17.4610, "lng": 78.3670, "type": "intersection", "details": "Botanical Garden & HITEC-Kondapur Junction"},
    {"id": "loc_kukatpally", "name": "Kukatpally KPHB Colony", "area": "Kukatpally", "lat": 17.4947, "lng": 78.3912, "type": "intersection", "details": "JNTU & KPHB Metro Arterial"},
    {"id": "loc_kukatpally_y", "name": "Kukatpally Y-Junction", "area": "Kukatpally", "lat": 17.4850, "lng": 78.4180, "type": "intersection", "details": "Balanagar-Moosapet Y-Junction"},
    {"id": "loc_miyapur", "name": "Miyapur Allwyn X Roads", "area": "Miyapur", "lat": 17.4968, "lng": 78.3546, "type": "intersection", "details": "Miyapur Metro Terminal & NH-65 Junction"},
    {"id": "loc_bachupally", "name": "Bachupally X Roads", "area": "Bachupally", "lat": 17.5270, "lng": 78.3680, "type": "intersection", "details": "Nizampet-Bachupally Medical Corridor"},

    # North-West & Central-North
    {"id": "loc_moosapet", "name": "Moosapet Metro Junction", "area": "Moosapet", "lat": 17.4640, "lng": 78.4320, "type": "intersection", "details": "NH-65 Commercial Corridor"},
    {"id": "loc_erragadda", "name": "Erragadda ESI Metro", "area": "Erragadda", "lat": 17.4530, "lng": 78.4390, "type": "intersection", "details": "ESI Hospital & Sanath Nagar Link"},
    {"id": "loc_sr_nagar", "name": "SR Nagar Junction", "area": "SR Nagar", "lat": 17.4440, "lng": 78.4430, "type": "intersection", "details": "Commercial Arterial Corridor"},
    {"id": "loc_balanagar", "name": "Balanagar Cross Roads", "area": "Balanagar", "lat": 17.4720, "lng": 78.4480, "type": "intersection", "details": "Industrial Area Main Interchange"},
    {"id": "loc_ameerpet", "name": "Ameerpet Metro Interchange", "area": "Ameerpet", "lat": 17.4375, "lng": 78.4483, "type": "intersection", "details": "Major Twin-Line Transit Hub"},
    {"id": "loc_punjagutta", "name": "Punjagutta Center", "area": "Punjagutta", "lat": 17.4260, "lng": 78.4530, "type": "intersection", "details": "Nagarjuna Circle & Central Mall Flyover"},
    {"id": "loc_somajiguda", "name": "Somajiguda Raj Bhavan Road", "area": "Somajiguda", "lat": 17.4210, "lng": 78.4580, "type": "intersection", "details": "Governor Residence & Healthcare Row"},

    # Central-West & Hills
    {"id": "loc_banjara_hills", "name": "Banjara Hills Road No. 1", "area": "Banjara Hills", "lat": 17.4156, "lng": 78.4352, "type": "intersection", "details": "Taj Krishna & Healthcare Corridor"},
    {"id": "loc_banjara_rd12", "name": "Banjara Hills Road No. 12", "area": "Banjara Hills", "lat": 17.4170, "lng": 78.4340, "type": "intersection", "details": "Cancer Institute & Masab Tank Link"},
    {"id": "loc_jubilee_hills", "name": "Jubilee Hills Checkpost", "area": "Jubilee Hills", "lat": 17.4300, "lng": 78.4110, "type": "intersection", "details": "Peddamma Temple & Road 36 Interchange"},
    {"id": "loc_jubilee_rd36", "name": "Jubilee Hills Road No. 36", "area": "Jubilee Hills", "lat": 17.4330, "lng": 78.3980, "type": "intersection", "details": "Madhapur-Jubilee Hills Boundary"},
    {"id": "loc_film_nagar", "name": "Film Nagar Cultural Center", "area": "Film Nagar", "lat": 17.4120, "lng": 78.4060, "type": "intersection", "details": "Apollo Hospital South Approach"},

    # South-West & Airport Corridor
    {"id": "loc_mehdipatnam", "name": "Mehdipatnam Rethi Bowli", "area": "Mehdipatnam", "lat": 17.3920, "lng": 78.4410, "type": "intersection", "details": "Bus Terminal & PVNR Expressway Entry"},
    {"id": "loc_tolichowki", "name": "Tolichowki Flyover", "area": "Tolichowki", "lat": 17.3990, "lng": 78.4120, "type": "intersection", "details": "Golconda & Shaikpet Transit Link"},
    {"id": "loc_shaikpet", "name": "Shaikpet Dargah Flyover", "area": "Shaikpet", "lat": 17.4080, "lng": 78.3880, "type": "intersection", "details": "Seven Tombs & Gachibowli Flyover"},
    {"id": "loc_raidurgam", "name": "Raidurgam Knowledge City", "area": "Raidurgam", "lat": 17.4250, "lng": 78.3770, "type": "intersection", "details": "T-Hub, IKEA & Durgam Cheruvu Cable Bridge"},
    {"id": "loc_attapur", "name": "Attapur Pillar 143", "area": "Attapur", "lat": 17.3680, "lng": 78.4380, "type": "intersection", "details": "PVNR Expressway & Hyderguda Link"},
    {"id": "loc_aramghar", "name": "Aramghar Junction", "area": "Aramghar", "lat": 17.3210, "lng": 78.4340, "type": "intersection", "details": "NH-44 & PVNR Expressway South Terminal"},
    {"id": "loc_rajendranagar", "name": "Rajendranagar Agriculture Campus", "area": "Rajendranagar", "lat": 17.3190, "lng": 78.4100, "type": "intersection", "details": "Outer Ring Road South Connector"},
    {"id": "loc_shamshabad", "name": "Shamshabad Airport Interchange", "area": "Shamshabad", "lat": 17.2450, "lng": 78.4320, "type": "intersection", "details": "Rajiv Gandhi International Airport (RGIA) Gateway"},

    # Central Core & Old City
    {"id": "loc_khairatabad", "name": "Khairatabad RTA Circle", "area": "Khairatabad", "lat": 17.4116, "lng": 78.4612, "type": "intersection", "details": "Lake Perimeter & Flyover"},
    {"id": "loc_lakdikapul", "name": "Lakdikapul Metro Junction", "area": "Lakdikapul", "lat": 17.4045, "lng": 78.4640, "type": "intersection", "details": "Collectorate & Assembly Corridor"},
    {"id": "loc_nampally", "name": "Nampally Station Road", "area": "Nampally", "lat": 17.3916, "lng": 78.4720, "type": "intersection", "details": "Railway Station & Exhibition Grounds"},
    {"id": "loc_abids", "name": "Abids GPO Circle", "area": "Abids", "lat": 17.3920, "lng": 78.4780, "type": "intersection", "details": "Historic Central Business District"},
    {"id": "loc_koti", "name": "Koti Women's College X Roads", "area": "Koti", "lat": 17.3850, "lng": 78.4867, "type": "intersection", "details": "Sultan Bazaar & Medical Row"},
    {"id": "loc_afzalgunj", "name": "Afzal Gunj Nayapul Bridge", "area": "Afzal Gunj", "lat": 17.3750, "lng": 78.4790, "type": "intersection", "details": "Osmania General Hospital Main Approach"},
    {"id": "loc_highcourt", "name": "High Court City College", "area": "High Court", "lat": 17.3680, "lng": 78.4710, "type": "intersection", "details": "Musi River South Bank"},
    {"id": "loc_charminar", "name": "Charminar Historic Plaza", "area": "Charminar", "lat": 17.3616, "lng": 78.4747, "type": "intersection", "details": "Old City Center & Mecca Masjid"},
    {"id": "loc_falaknuma", "name": "Falaknuma Palace Gate", "area": "Falaknuma", "lat": 17.3320, "lng": 78.4680, "type": "intersection", "details": "Engine Bowli & South City Link"},
    {"id": "loc_chandrayangutta", "name": "Chandrayangutta X Roads", "area": "Chandrayangutta", "lat": 17.3290, "lng": 78.4890, "type": "intersection", "details": "Inner Ring Road South Sector"},
    {"id": "loc_santoshnagar", "name": "Santoshnagar DRDO Junction", "area": "Santoshnagar", "lat": 17.3480, "lng": 78.5080, "type": "intersection", "details": "Defence Laboratories Corridor"},

    # East & South-East
    {"id": "loc_malakpet", "name": "Malakpet Super Bazaar", "area": "Malakpet", "lat": 17.3750, "lng": 78.5020, "type": "intersection", "details": "NH-65 & Yashoda Malakpet Link"},
    {"id": "loc_dilsukhnagar", "name": "Dilsukhnagar Bus Depot", "area": "Dilsukhnagar", "lat": 17.3688, "lng": 78.5247, "type": "intersection", "details": "Metro Station & High Density Commercial Street"},
    {"id": "loc_kothapet", "name": "Kothapet Fruit Market", "area": "Kothapet", "lat": 17.3610, "lng": 78.5420, "type": "intersection", "details": "Chaitanyapuri & Omni Hospital Cross"},
    {"id": "loc_lbnagar", "name": "LB Nagar Ring Road Junction", "area": "LB Nagar", "lat": 17.3480, "lng": 78.5520, "type": "intersection", "details": "Inner Ring Road & NH-65 Southern Gateway"},
    {"id": "loc_vanasthalipuram", "name": "Vanasthalipuram Complex", "area": "Vanasthalipuram", "lat": 17.3360, "lng": 78.5720, "type": "intersection", "details": "Sushma Cross Roads"},
    {"id": "loc_hayathnagar", "name": "Hayathnagar RTC Depot", "area": "Hayathnagar", "lat": 17.3240, "lng": 78.6080, "type": "intersection", "details": "NH-65 Vijayawada Highway Exit"},
    {"id": "loc_nagole", "name": "Nagole Metro Station", "area": "Nagole", "lat": 17.3750, "lng": 78.5600, "type": "intersection", "details": "Inner Ring Road & Musi River Bridge"},
    {"id": "loc_uppal", "name": "Uppal Cross Roads", "area": "Uppal", "lat": 17.4020, "lng": 78.5600, "type": "intersection", "details": "Rajiv Gandhi Stadium & Warangal Highway Entry"},
    {"id": "loc_ramanthapur", "name": "Ramanthapur Polytechnic", "area": "Ramanthapur", "lat": 17.3920, "lng": 78.5410, "type": "intersection", "details": "TV Studio & Amberpet Link Road"},
    {"id": "loc_amberpet", "name": "Amberpet Ali Cafe X Roads", "area": "Amberpet", "lat": 17.3880, "lng": 78.5140, "type": "intersection", "details": "Central-East Connector Road"},

    # Central-North & Cantonment / Secunderabad
    {"id": "loc_chikkadpally", "name": "RTC X Roads Chikkadpally", "area": "Chikkadpally", "lat": 17.4040, "lng": 78.4980, "type": "intersection", "details": "Theatres Hub & Indira Park Link"},
    {"id": "loc_kavadiguda", "name": "Kavadiguda Lower Tank Bund", "area": "Kavadiguda", "lat": 17.4160, "lng": 78.4900, "type": "intersection", "details": "CBR & Secretariat North Gate"},
    {"id": "loc_tankbund", "name": "Tank Bund PVNR Marg", "area": "Tank Bund", "lat": 17.4110, "lng": 78.4760, "type": "intersection", "details": "Hussain Sagar Lake Driveway"},
    {"id": "loc_begumpet", "name": "Begumpet Flyover", "area": "Begumpet", "lat": 17.4440, "lng": 78.4740, "type": "intersection", "details": "Old Airport Road & Lifestyle Building"},
    {"id": "loc_paradise", "name": "Paradise Circle", "area": "Paradise", "lat": 17.4425, "lng": 78.4870, "type": "intersection", "details": "MG Road & Sardar Patel Road Hub"},
    {"id": "loc_secunderabad", "name": "Secunderabad Clock Tower", "area": "Secunderabad", "lat": 17.4399, "lng": 78.5020, "type": "intersection", "details": "Secunderabad Railway Station Gateway"},
    {"id": "loc_sangeet", "name": "Sangeet X Roads", "area": "Secunderabad", "lat": 17.4410, "lng": 78.5100, "type": "intersection", "details": "Keyes High School & Mettuguda Link"},
    {"id": "loc_musheerabad", "name": "Musheerabad Gandhi Gate", "area": "Musheerabad", "lat": 17.4240, "lng": 78.5030, "type": "intersection", "details": "Gandhi Medical College & Hospital Entry"},
    {"id": "loc_mettuguda", "name": "Mettuguda Metro Rail Nilayam", "area": "Mettuguda", "lat": 17.4380, "lng": 78.5230, "type": "intersection", "details": "South Central Railway HQ"},
    {"id": "loc_tarnaka", "name": "Tarnaka Flyover Junction", "area": "Tarnaka", "lat": 17.4280, "lng": 78.5380, "type": "intersection", "details": "Nagarjuna Sagar & University Entrance"},
    {"id": "loc_osmania_univ", "name": "Osmania University Campus", "area": "Osmania University", "lat": 17.4120, "lng": 78.5280, "type": "intersection", "details": "Arts College & Vidyanagar Link"},
    {"id": "loc_habsiguda", "name": "Habsiguda Street No. 8", "area": "Habsiguda", "lat": 17.4150, "lng": 78.5550, "type": "intersection", "details": "CCMB & NGRI Research Institute Link"},

    # North & Cantonment / ECIL / Kompally
    {"id": "loc_nacharam", "name": "Nacharam Industrial Area", "area": "Nacharam", "lat": 17.4360, "lng": 78.5730, "type": "intersection", "details": "Mallapur & HMT Nagar Link"},
    {"id": "loc_moula_ali", "name": "Moula Ali Kaman", "area": "Moula Ali", "lat": 17.4580, "lng": 78.5600, "type": "intersection", "details": "Railway Goods Shed & Dargah"},
    {"id": "loc_ecil", "name": "ECIL Cross Roads", "area": "ECIL", "lat": 17.4680, "lng": 78.5680, "type": "intersection", "details": "Radhika Theatre & Electronics Complex"},
    {"id": "loc_sainikpuri", "name": "Sainikpuri Cross Roads", "area": "Sainikpuri", "lat": 17.4910, "lng": 78.5550, "type": "intersection", "details": "Defence Colony & Yapral Corridor"},
    {"id": "loc_neredmet", "name": "Neredmet Cross Roads", "area": "Neredmet", "lat": 17.4810, "lng": 78.5380, "type": "intersection", "details": "Safilguda Lake & Ramakrishnapuram Link"},
    {"id": "loc_malkajgiri", "name": "Malkajgiri Anandbagh", "area": "Malkajgiri", "lat": 17.4520, "lng": 78.5350, "type": "intersection", "details": "Malkajgiri Station & Vani Nagar Link"},
    {"id": "loc_marredpally", "name": "Marredpally East", "area": "Marredpally", "lat": 17.4520, "lng": 78.5120, "type": "intersection", "details": "Cantonment High-Speed Arterial"},
    {"id": "loc_bowenpally", "name": "Bowenpally Checkpost", "area": "Bowenpally", "lat": 17.4780, "lng": 78.4850, "type": "intersection", "details": "NH-44 Nagpur Highway Starting Point"},
    {"id": "loc_suchitra", "name": "Suchitra Circle", "area": "Suchitra", "lat": 17.5120, "lng": 78.4880, "type": "intersection", "details": "Quthbullapur & NH-44 Crossing"},
    {"id": "loc_kompally", "name": "Kompally Cineplanet", "area": "Kompally", "lat": 17.5380, "lng": 78.4870, "type": "intersection", "details": "North Hyderabad Highway Gateway"},
    {"id": "loc_jeedimetla", "name": "Jeedimetla Industrial Area", "area": "Jeedimetla", "lat": 17.5090, "lng": 78.4550, "type": "intersection", "details": "Subhash Nagar & Shapoor Nagar Link"},

    # Outer Ring Road (ORR) High Speed Perimeter Ring
    {"id": "orr_gachibowli", "name": "ORR Exit 1 - Gachibowli", "area": "Gachibowli", "lat": 17.4320, "lng": 78.3490, "type": "intersection", "details": "Outer Ring Road IT Hub Junction"},
    {"id": "orr_nanakramguda", "name": "ORR Exit 2 - Nanakramguda", "area": "Financial District", "lat": 17.4150, "lng": 78.3490, "type": "intersection", "details": "Outer Ring Road Financial Corridor"},
    {"id": "orr_appa", "name": "ORR Exit 17 - Appa Junction", "area": "Rajendranagar", "lat": 17.3480, "lng": 78.3820, "type": "intersection", "details": "Outer Ring Road Himayat Sagar Link"},
    {"id": "orr_shamshabad", "name": "ORR Exit 16 - Shamshabad", "area": "Shamshabad", "lat": 17.2580, "lng": 78.4210, "type": "intersection", "details": "Outer Ring Road Airport South Tollway"},
    {"id": "orr_bongloor", "name": "ORR Exit 12 - Bongloor", "area": "Bongloor", "lat": 17.2750, "lng": 78.5480, "type": "intersection", "details": "Outer Ring Road Nagarjuna Sagar Highway Exit"},
    {"id": "orr_pedda_amberpet", "name": "ORR Exit 11 - Pedda Amberpet", "area": "Pedda Amberpet", "lat": 17.3220, "lng": 78.6180, "type": "intersection", "details": "Outer Ring Road NH-65 Vijayawada Exit"},
    {"id": "orr_ghatkesar", "name": "ORR Exit 9 - Ghatkesar / Medipally", "area": "Ghatkesar", "lat": 17.4280, "lng": 78.6320, "type": "intersection", "details": "Outer Ring Road Warangal Highway Exit"},
    {"id": "orr_keesara", "name": "ORR Exit 8 - Keesara", "area": "Keesara", "lat": 17.5120, "lng": 78.6050, "type": "intersection", "details": "Outer Ring Road North-East Corridor"},
    {"id": "orr_medchal", "name": "ORR Exit 6 - Medchal / Kandlakoya", "area": "Medchal", "lat": 17.5850, "lng": 78.4890, "type": "intersection", "details": "Outer Ring Road NH-44 North Toll Plaza"},
    {"id": "orr_dundigal", "name": "ORR Exit 5 - Dundigal / Bachupally", "area": "Dundigal", "lat": 17.5520, "lng": 78.3880, "type": "intersection", "details": "Outer Ring Road Mallampet & Bachupally Exit"},
    {"id": "orr_patancheru", "name": "ORR Exit 3 - Patancheru", "area": "Patancheru", "lat": 17.5150, "lng": 78.2680, "type": "intersection", "details": "Outer Ring Road NH-65 Mumbai Tollway"},
    {"id": "orr_tellapur", "name": "ORR Exit 2B - Tellapur / Kollur", "area": "Tellapur", "lat": 17.4750, "lng": 78.2910, "type": "intersection", "details": "Outer Ring Road West Tech Residential Hub"}
]

# 26 Hyderabad City-Wide Hospitals Distributed Throughout All Regions
HOSPITALS = [
    {
        "id": "hosp_osmania",
        "name": "Osmania General Hospital",
        "area": "Afzal Gunj / Koti",
        "lat": 17.3762,
        "lng": 78.4795,
        "type": "hospital",
        "details": "Level 1 Apex Trauma Center, 1,168 beds, 24/7 Resuscitation & Emergency Surgery Unit",
        "connects_to": "loc_afzalgunj"
    },
    {
        "id": "hosp_gandhi",
        "name": "Gandhi Hospital",
        "area": "Musheerabad / Secunderabad",
        "lat": 17.4244,
        "lng": 78.5034,
        "type": "hospital",
        "details": "Apex Teaching Hospital, 1,200 beds, Dedicated Poison, Stroke & Emergency ICU Bay",
        "connects_to": "loc_musheerabad"
    },
    {
        "id": "hosp_nims",
        "name": "Nizam's Institute of Medical Sciences (NIMS)",
        "area": "Punjagutta",
        "lat": 17.4239,
        "lng": 78.4528,
        "type": "hospital",
        "details": "Autonomous State Medical Institute, 1,500 beds, Acute Cardiac & Neuro Trauma Care",
        "connects_to": "loc_punjagutta"
    },
    {
        "id": "hosp_apollo_jubilee",
        "name": "Apollo Hospitals Jubilee Hills",
        "area": "Jubilee Hills",
        "lat": 17.4165,
        "lng": 78.4116,
        "type": "hospital",
        "details": "JCI Accredited Emergency Center, 600 beds, Advanced Stroke, Trauma & Air Ambulance Bay",
        "connects_to": "loc_film_nagar"
    },
    {
        "id": "hosp_aig",
        "name": "AIG Hospitals Gachibowli",
        "area": "Gachibowli",
        "lat": 17.4428,
        "lng": 78.3662,
        "type": "hospital",
        "details": "800 beds, World-Class Acute Emergency, Gastro & Multidisciplinary Trauma Units",
        "connects_to": "loc_gachibowli"
    },
    {
        "id": "hosp_continental",
        "name": "Continental Hospitals",
        "area": "Financial District",
        "lat": 17.4182,
        "lng": 78.3444,
        "type": "hospital",
        "details": "JCI-Accredited 750-bed Tertiary Center, Cyberabad Rapid Emergency Trauma Bay",
        "connects_to": "loc_financial_dist"
    },
    {
        "id": "hosp_yashoda_sec",
        "name": "Yashoda Hospitals Secunderabad",
        "area": "Secunderabad",
        "lat": 17.4395,
        "lng": 78.4985,
        "type": "hospital",
        "details": "Alexander Road, 24/7 Interventional Cath Lab, High-Acuity Surgical ICU",
        "connects_to": "loc_secunderabad"
    },
    {
        "id": "hosp_yashoda_som",
        "name": "Yashoda Hospitals Somajiguda",
        "area": "Somajiguda",
        "lat": 17.4215,
        "lng": 78.4578,
        "type": "hospital",
        "details": "Raj Bhavan Road, Multi-Organ Transplant & Rapid Emergency Resuscitation Center",
        "connects_to": "loc_somajiguda"
    },
    {
        "id": "hosp_yashoda_malakpet",
        "name": "Yashoda Hospitals Malakpet",
        "area": "Malakpet",
        "lat": 17.3752,
        "lng": 78.5015,
        "type": "hospital",
        "details": "Nalgonda X Roads, Premier East-Zone Comprehensive Emergency Trauma Bay",
        "connects_to": "loc_malakpet"
    },
    {
        "id": "hosp_care_banjara",
        "name": "CARE Hospitals Banjara Hills",
        "area": "Banjara Hills",
        "lat": 17.4140,
        "lng": 78.4485,
        "type": "hospital",
        "details": "Road No. 1, 435 beds, Leading Cardiac Emergency, Vascular & Acute Resuscitation Unit",
        "connects_to": "loc_banjara_hills"
    },
    {
        "id": "hosp_care_hitech",
        "name": "CARE Hospitals Hitech City",
        "area": "Hitech City",
        "lat": 17.4385,
        "lng": 78.3712,
        "type": "hospital",
        "details": "Old Mumbai Highway, 200 beds, Cyberabad Rapid Emergency Trauma Unit",
        "connects_to": "loc_gachibowli"
    },
    {
        "id": "hosp_medicover_madhapur",
        "name": "Medicover Hospitals Madhapur",
        "area": "Madhapur",
        "lat": 17.4445,
        "lng": 78.3832,
        "type": "hospital",
        "details": "Mindspace Corridor, 400 beds, Advanced Neuro & Multi-Trauma Emergency Bay",
        "connects_to": "loc_madhapur"
    },
    {
        "id": "hosp_kims_sec",
        "name": "KIMS Hospitals Secunderabad",
        "area": "Secunderabad",
        "lat": 17.4338,
        "lng": 78.4872,
        "type": "hospital",
        "details": "Minister Road, 1,000 beds, Level 1 Emergency Complex, Cardiac, Pediatric & Neuro ICUs",
        "connects_to": "loc_paradise"
    },
    {
        "id": "hosp_sunshine_sec",
        "name": "Sunshine Hospitals Secunderabad",
        "area": "Secunderabad",
        "lat": 17.4435,
        "lng": 78.4895,
        "type": "hospital",
        "details": "PG Road, Paradise, 350 beds, Poly-Trauma, Orthopedic & Emergency Surgery Bay",
        "connects_to": "loc_paradise"
    },
    {
        "id": "hosp_slg_bachupally",
        "name": "SLG Hospitals Bachupally",
        "area": "Bachupally",
        "lat": 17.5265,
        "lng": 78.3705,
        "type": "hospital",
        "details": "999-bed Multi-Super Specialty Hospital, North-West Hyderabad Advanced Emergency Bay",
        "connects_to": "loc_bachupally"
    },
    {
        "id": "hosp_kamineni_lbnagar",
        "name": "Kamineni Hospitals LB Nagar",
        "area": "LB Nagar",
        "lat": 17.3485,
        "lng": 78.5535,
        "type": "hospital",
        "details": "Inner Ring Road, 450 beds, Dedicated South-East Highway Emergency Trauma Bay",
        "connects_to": "loc_lbnagar"
    },
    {
        "id": "hosp_omni_kothapet",
        "name": "Omni Hospitals Kothapet",
        "area": "Dilsukhnagar / Kothapet",
        "lat": 17.3645,
        "lng": 78.5410,
        "type": "hospital",
        "details": "Chaitanyapuri Main Road, 206 beds, Acute Cardiac & Trauma Resuscitation",
        "connects_to": "loc_kothapet"
    },
    {
        "id": "hosp_citizens_nallagandla",
        "name": "Citizens Specialty Hospital",
        "area": "Nallagandla",
        "lat": 17.4740,
        "lng": 78.3090,
        "type": "hospital",
        "details": "Nallagandla-Gachibowli, 300 beds, Advanced Oncology & Trauma Emergency Unit",
        "connects_to": "loc_nallagandla"
    },
    {
        "id": "hosp_aster_ameerpet",
        "name": "Aster Prime Hospital",
        "area": "Ameerpet",
        "lat": 17.4385,
        "lng": 78.4475,
        "type": "hospital",
        "details": "Mythrivanam Metro, 158 beds, Rapid Cardiac, Stroke & Trauma Emergency Response",
        "connects_to": "loc_ameerpet"
    },
    {
        "id": "hosp_olive_mehdipatnam",
        "name": "Olive Hospital Mehdipatnam",
        "area": "Mehdipatnam",
        "lat": 17.3912,
        "lng": 78.4355,
        "type": "hospital",
        "details": "Nanal Nagar, 200 beds, Acute Resuscitation & Emergency Critical Care Bay",
        "connects_to": "loc_mehdipatnam"
    },
    {
        "id": "hosp_princess_esra",
        "name": "Princess Esra Hospital",
        "area": "Charminar Old City",
        "lat": 17.3605,
        "lng": 78.4782,
        "type": "hospital",
        "details": "Moghalpura, Historic Old City 500-bed Tertiary Teaching & Emergency Care Center",
        "connects_to": "loc_charminar"
    },
    {
        "id": "hosp_gleneagles",
        "name": "Gleneagles Global Hospital",
        "area": "Lakdikapul",
        "lat": 17.4055,
        "lng": 78.4635,
        "type": "hospital",
        "details": "Lakdikapul Metro, Multi-Organ Transplant Center & 24/7 Resuscitation Facility",
        "connects_to": "loc_lakdikapul"
    },
    {
        "id": "hosp_fernandez",
        "name": "Fernandez Hospital",
        "area": "Abids / Bogulkunta",
        "lat": 17.3918,
        "lng": 78.4815,
        "type": "hospital",
        "details": "Bogulkunta, Premier High-Risk Maternal, Perinatal & Pediatric Emergency Bay",
        "connects_to": "loc_abids"
    },
    {
        "id": "hosp_apollo_drdo",
        "name": "Apollo DRDO Hospital",
        "area": "Chandrayangutta / Kanchanbagh",
        "lat": 17.3395,
        "lng": 78.5020,
        "type": "hospital",
        "details": "DMRL X Roads, 150 beds, South Hyderabad Emergency Resuscitation Unit",
        "connects_to": "loc_santoshnagar"
    },
    {
        "id": "hosp_tx_uppal",
        "name": "TX Hospitals Uppal",
        "area": "Uppal",
        "lat": 17.4015,
        "lng": 78.5585,
        "type": "hospital",
        "details": "Uppal Ring Road, 200 beds, Eastern Corridor Acute Emergency & ICU Unit",
        "connects_to": "loc_uppal"
    },
    {
        "id": "hosp_rush_kompally",
        "name": "Rush Hospitals Kompally",
        "area": "Kompally",
        "lat": 17.5185,
        "lng": 78.4875,
        "type": "hospital",
        "details": "Suchitra Circle, North Hyderabad Super Specialty Emergency Trauma Center",
        "connects_to": "loc_suchitra"
    }
]

# Strategic Road Arterials & Expressways linking all parts of Hyderabad
RAW_ROADS = [
    # 1. Outer Ring Road (ORR) Expressway Loop
    ("orr_gachibowli", "orr_nanakramguda", "Outer Ring Road (ORR) Expressway - Sector A", "clear", 75),
    ("orr_nanakramguda", "loc_financial_dist", "ORR Financial District Arterial", "clear", 60),
    ("orr_nanakramguda", "orr_appa", "Outer Ring Road (ORR) Expressway - Appa Sector", "clear", 80),
    ("orr_appa", "loc_rajendranagar", "Rajendranagar Link Road", "clear", 50),
    ("orr_appa", "orr_shamshabad", "Outer Ring Road (ORR) - Airport Sector", "clear", 80),
    ("orr_shamshabad", "loc_shamshabad", "Shamshabad Airport Approach Expressway", "clear", 70),
    ("orr_shamshabad", "orr_bongloor", "Outer Ring Road (ORR) - South Sector", "clear", 85),
    ("orr_bongloor", "orr_pedda_amberpet", "Outer Ring Road (ORR) - East Sector", "clear", 85),
    ("orr_pedda_amberpet", "loc_hayathnagar", "Hayathnagar Link Road", "clear", 55),
    ("orr_pedda_amberpet", "orr_ghatkesar", "Outer Ring Road (ORR) - Medipally Corridor", "clear", 85),
    ("orr_ghatkesar", "loc_uppal", "Warangal Highway - Uppal Link", "clear", 55),
    ("orr_ghatkesar", "orr_keesara", "Outer Ring Road (ORR) - Keesara Sector", "clear", 85),
    ("orr_keesara", "loc_ecil", "Keesara - ECIL Arterial", "clear", 50),
    ("orr_keesara", "orr_medchal", "Outer Ring Road (ORR) - North Sector", "clear", 85),
    ("orr_medchal", "loc_kompally", "Medchal - Kompally NH-44 Corridor", "clear", 65),
    ("orr_medchal", "orr_dundigal", "Outer Ring Road (ORR) - Dundigal Sector", "clear", 85),
    ("orr_dundigal", "loc_bachupally", "Bachupally - ORR Connector", "clear", 55),
    ("orr_dundigal", "orr_patancheru", "Outer Ring Road (ORR) - Patancheru Corridor", "clear", 85),
    ("orr_patancheru", "loc_miyapur", "NH-65 Patancheru - Miyapur Expressway", "clear", 65),
    ("orr_patancheru", "orr_tellapur", "Outer Ring Road (ORR) - Kollur Link", "clear", 80),
    ("orr_tellapur", "loc_nallagandla", "Tellapur - Nallagandla Road", "clear", 50),
    ("loc_nallagandla", "loc_gachibowli", "Nallagandla - Gachibowli Link Road", "clear", 50),
    ("orr_gachibowli", "loc_gachibowli", "Gachibowli Flyover & Interchange", "clear", 60),

    # 2. PVNR Elevated Expressway & Airport Corridor
    ("loc_mehdipatnam", "loc_attapur", "PVNR Elevated Expressway - Phase 1", "clear", 70),
    ("loc_attapur", "loc_aramghar", "PVNR Elevated Expressway - Phase 2", "clear", 75),
    ("loc_aramghar", "loc_shamshabad", "NH-44 Bangalore Highway - Airport Corridor", "clear", 70),
    ("loc_aramghar", "loc_rajendranagar", "Agriculture University Road", "clear", 45),
    ("loc_aramghar", "loc_chandrayangutta", "Inner Ring Road South - Aramghar to Chandrayangutta", "clear", 55),

    # 3. NH-65 Mumbai - Pune - Vijayawada Highway Corridor
    ("loc_miyapur", "loc_kukatpally", "NH-65 Miyapur - KPHB Metro Highway", "clear", 50),
    ("loc_kukatpally", "loc_kukatpally_y", "NH-65 KPHB to Y-Junction", "clear", 45),
    ("loc_kukatpally_y", "loc_moosapet", "NH-65 Moosapet Metro Corridor", "clear", 45),
    ("loc_moosapet", "loc_erragadda", "NH-65 Bharat Nagar to Erragadda", "clear", 45),
    ("loc_erragadda", "loc_sr_nagar", "NH-65 ESI Hospital to SR Nagar", "clear", 45),
    ("loc_sr_nagar", "loc_ameerpet", "NH-65 SR Nagar to Ameerpet Metro", "clear", 45),
    ("loc_ameerpet", "loc_punjagutta", "NH-65 Ameerpet - Punjagutta Flyover", "clear", 45),
    ("loc_punjagutta", "loc_somajiguda", "Somajiguda Raj Bhavan Highway", "clear", 45),
    ("loc_somajiguda", "loc_khairatabad", "Khairatabad Flyover Corridor", "clear", 45),
    ("loc_khairatabad", "loc_lakdikapul", "Lakdikapul Metro Arterial", "clear", 40),
    ("loc_lakdikapul", "loc_nampally", "Nampally Station Road", "clear", 40),
    ("loc_nampally", "loc_abids", "Mozamjahi Market to Abids Circle", "clear", 40),
    ("loc_abids", "loc_koti", "Bank Street Abids - Koti Commercial Road", "clear", 40),
    ("loc_koti", "loc_malakpet", "Chaderghat Bridge & Malakpet Arterial", "clear", 45),
    ("loc_malakpet", "loc_dilsukhnagar", "NH-65 Malakpet to Dilsukhnagar Metro Road", "clear", 45),
    ("loc_dilsukhnagar", "loc_kothapet", "NH-65 Dilsukhnagar to Kothapet Corridor", "clear", 45),
    ("loc_kothapet", "loc_lbnagar", "NH-65 Kothapet to LB Nagar Junction", "clear", 45),
    ("loc_lbnagar", "loc_vanasthalipuram", "NH-65 LB Nagar to Vanasthalipuram", "clear", 55),
    ("loc_vanasthalipuram", "loc_hayathnagar", "NH-65 Vanasthalipuram to Hayathnagar", "clear", 60),

    # 4. IT Corridor & Western Arterials
    ("loc_gachibowli", "loc_financial_dist", "Gachibowli - Financial District ISB Road", "clear", 50),
    ("loc_gachibowli", "loc_kondapur", "Botanical Garden Road - Gachibowli to Kondapur", "clear", 45),
    ("loc_kondapur", "loc_miyapur", "Kondapur - Hafeezpet - Miyapur Road", "clear", 45),
    ("loc_kondapur", "loc_hitech_city", "Kothaguda Flyover to Hitech City", "clear", 45),
    ("loc_gachibowli", "loc_hitech_city", "Bio-Diversity to Cyber Towers Arterial", "clear", 50),
    ("loc_hitech_city", "loc_madhapur", "Cyber Towers to Mindspace Main Road", "clear", 45),
    ("loc_madhapur", "loc_raidurgam", "Inorbit Mall to Durgam Cheruvu Link", "clear", 45),
    ("loc_raidurgam", "loc_gachibowli", "Knowledge City to Bio-Diversity Junction", "clear", 50),
    ("loc_hitech_city", "loc_kukatpally", "Hitech City - Malaysian Township - KPHB Bypass", "clear", 45),
    ("loc_kukatpally", "loc_bachupally", "KPHB to Nizampet & Bachupally Road", "clear", 45),

    # 5. Jubilee Hills & Banjara Hills Corridors
    ("loc_madhapur", "loc_jubilee_rd36", "Madhapur to Jubilee Hills Road No. 36", "clear", 45),
    ("loc_jubilee_rd36", "loc_jubilee_hills", "Jubilee Hills Road No. 36 Metro Corridor", "clear", 45),
    ("loc_jubilee_hills", "loc_film_nagar", "Jubilee Hills Checkpost to Film Nagar", "clear", 45),
    ("loc_film_nagar", "loc_banjara_rd12", "Film Nagar to Banjara Hills Road No. 12", "clear", 40),
    ("loc_jubilee_hills", "loc_banjara_hills", "Road No. 36 to Banjara Hills Road No. 1", "clear", 45),
    ("loc_banjara_rd12", "loc_banjara_hills", "Banjara Hills Road 12 to Road 1 Link", "clear", 40),
    ("loc_banjara_hills", "loc_punjagutta", "Banjara Hills Road No. 1 to Nagarjuna Circle", "clear", 45),
    ("loc_banjara_hills", "loc_mehdipatnam", "Banjara Hills Road No. 1 to Masab Tank & Mehdipatnam", "clear", 45),
    ("loc_jubilee_hills", "loc_ameerpet", "Jubilee Hills to Krishna Nagar & Ameerpet Road", "clear", 40),

    # 6. Mehdipatnam, Tolichowki & Gachibowli Corridor
    ("loc_mehdipatnam", "loc_tolichowki", "Mehdipatnam to Tolichowki Flyover", "clear", 50),
    ("loc_tolichowki", "loc_shaikpet", "Tolichowki to Shaikpet Dargah Flyover", "clear", 50),
    ("loc_shaikpet", "loc_raidurgam", "Shaikpet Flyover to Raidurgam T-Hub", "clear", 50),
    ("loc_shaikpet", "loc_film_nagar", "Shaikpet to Film Nagar Link Road", "clear", 40),
    ("loc_tolichowki", "loc_attapur", "Langar Houz & Ring Road to Attapur", "clear", 40),

    # 7. Old City & Musi River Expressway
    ("loc_lakdikapul", "loc_afzalgunj", "Moazzam Jahi to Afzal Gunj via City College", "clear", 40),
    ("loc_abids", "loc_afzalgunj", "Abids to Nayapul High Road", "clear", 40),
    ("loc_koti", "loc_afzalgunj", "Koti Sultan Bazaar to Osmania Gate", "clear", 40),
    ("loc_afzalgunj", "loc_highcourt", "Nayapul Bridge over Musi River", "clear", 40),
    ("loc_highcourt", "loc_charminar", "High Court to Charminar Historic Corridor", "clear", 35),
    ("loc_charminar", "loc_falaknuma", "Charminar to Engine Bowli & Falaknuma", "clear", 35),
    ("loc_falaknuma", "loc_chandrayangutta", "Falaknuma to Chandrayangutta Ring Road", "clear", 45),
    ("loc_chandrayangutta", "loc_santoshnagar", "Inner Ring Road - Chandrayangutta to Santoshnagar", "clear", 50),
    ("loc_santoshnagar", "loc_malakpet", "Santoshnagar to Saidabad & Malakpet", "clear", 45),
    ("loc_santoshnagar", "loc_lbnagar", "Inner Ring Road - Santoshnagar to LB Nagar", "clear", 55),
    ("loc_highcourt", "loc_attapur", "Puranapul to Attapur River Road", "clear", 45),

    # 8. Secunderabad Core & Cantonment Corridors
    ("loc_punjagutta", "loc_begumpet", "Punjagutta to Begumpet Flyover Road", "clear", 45),
    ("loc_begumpet", "loc_paradise", "Sardar Patel Road - Begumpet to Paradise Circle", "clear", 50),
    ("loc_paradise", "loc_secunderabad", "Sardar Patel Road - Paradise to Secunderabad Station", "clear", 45),
    ("loc_secunderabad", "loc_sangeet", "Secunderabad Station to Sangeet X Roads", "clear", 45),
    ("loc_sangeet", "loc_mettuguda", "Sangeet Junction to Mettuguda Metro", "clear", 45),
    ("loc_sangeet", "loc_marredpally", "Sangeet Junction to Marredpally Corridor", "clear", 45),
    ("loc_marredpally", "loc_malkajgiri", "Marredpally to Malkajgiri Link", "clear", 40),
    ("loc_paradise", "loc_bowenpally", "Bowenpally Road via Tadbund Junction", "clear", 45),
    ("loc_bowenpally", "loc_suchitra", "NH-44 Bowenpally to Suchitra Circle", "clear", 55),
    ("loc_suchitra", "loc_kompally", "NH-44 Suchitra Circle to Kompally Cineplanet", "clear", 60),
    ("loc_bowenpally", "loc_balanagar", "Bowenpally to Balanagar Ferozguda Link", "clear", 45),
    ("loc_balanagar", "loc_jeedimetla", "Balanagar to Jeedimetla Industrial Road", "clear", 45),
    ("loc_jeedimetla", "loc_suchitra", "Jeedimetla to Suchitra Circle", "clear", 45),
    ("loc_kukatpally_y", "loc_balanagar", "Kukatpally Y-Junction to Balanagar X Roads", "clear", 45),

    # 9. Hussain Sagar Lake Loop & Central-North Connectors
    ("loc_khairatabad", "loc_tankbund", "PVNR Marg (Necklace Road) Hussain Sagar West", "clear", 45),
    ("loc_tankbund", "loc_kavadiguda", "Lower Tank Bund Road", "clear", 45),
    ("loc_kavadiguda", "loc_chikkadpally", "Kavadiguda to RTC X Roads", "clear", 40),
    ("loc_chikkadpally", "loc_musheerabad", "RTC X Roads to Musheerabad Gandhi Hospital", "clear", 45),
    ("loc_musheerabad", "loc_secunderabad", "Musheerabad to Secunderabad Station Road", "clear", 45),
    ("loc_tankbund", "loc_begumpet", "Minister Road - Tank Bund to Begumpet", "clear", 45),
    ("loc_chikkadpally", "loc_koti", "Barkatpura to Koti Sultan Bazaar", "clear", 40),

    # 10. East Hyderabad, Tarnaka, Uppal & ECIL
    ("loc_mettuguda", "loc_tarnaka", "Mettuguda to Tarnaka Flyover Road", "clear", 50),
    ("loc_tarnaka", "loc_osmania_univ", "Tarnaka to Osmania University Campus Road", "clear", 40),
    ("loc_osmania_univ", "loc_amberpet", "Vidyanagar to Amberpet Main Road", "clear", 40),
    ("loc_amberpet", "loc_koti", "Amberpet to Nimboliadda & Koti", "clear", 40),
    ("loc_amberpet", "loc_ramanthapur", "Amberpet to Ramanthapur Road", "clear", 45),
    ("loc_ramanthapur", "loc_uppal", "Ramanthapur to Uppal Cross Roads", "clear", 45),
    ("loc_tarnaka", "loc_habsiguda", "Tarnaka to Habsiguda Metro Corridor", "clear", 50),
    ("loc_habsiguda", "loc_uppal", "Habsiguda to Uppal Ring Road", "clear", 50),
    ("loc_uppal", "loc_nagole", "Inner Ring Road - Uppal to Nagole Bridge", "clear", 55),
    ("loc_nagole", "loc_lbnagar", "Inner Ring Road - Nagole to LB Nagar Junction", "clear", 55),
    ("loc_nagole", "loc_dilsukhnagar", "Nagole to Kothapet & Dilsukhnagar Link", "clear", 45),
    ("loc_tarnaka", "loc_moula_ali", "Tarnaka to Lalaguda & Moula Ali", "clear", 45),
    ("loc_moula_ali", "loc_ecil", "Moula Ali to ECIL X Roads", "clear", 45),
    ("loc_ecil", "loc_sainikpuri", "ECIL to Sainikpuri Cross Roads", "clear", 45),
    ("loc_sainikpuri", "loc_neredmet", "Sainikpuri to Neredmet Cross Roads", "clear", 45),
    ("loc_neredmet", "loc_malkajgiri", "Neredmet to Malkajgiri Station Road", "clear", 45),
    ("loc_malkajgiri", "loc_mettuguda", "Malkajgiri to Mettuguda Link Road", "clear", 40),
    ("loc_habsiguda", "loc_nacharam", "Habsiguda to Nacharam Industrial Road", "clear", 45),
    ("loc_nacharam", "loc_ecil", "Nacharam to ECIL Industrial Corridor", "clear", 45),
]

def build_hyderabad_dataset():
    all_nodes = []
    node_coords = {}

    for hub in HUBS:
        all_nodes.append(hub)
        node_coords[hub["id"]] = (hub["lat"], hub["lng"])

    for hosp in HOSPITALS:
        all_nodes.append(hosp)
        node_coords[hosp["id"]] = (hosp["lat"], hosp["lng"])

    all_edges = []
    edge_id_counter = 1

    # Add main road network edges
    for src, dst, name, traffic, speed_kmh in RAW_ROADS:
        if src not in node_coords or dst not in node_coords:
            print(f"ERROR: Missing node for road {src} -> {dst}")
            sys.exit(1)
        lat1, lng1 = node_coords[src]
        lat2, lng2 = node_coords[dst]
        dist = haversine_km(lat1, lng1, lat2, lng2)
        base_time = round((dist / max(speed_kmh, 20)) * 60, 2)
        if base_time < 0.5:
            base_time = 0.5

        all_edges.append({
            "id": f"edge_{edge_id_counter}",
            "source": src,
            "target": dst,
            "name": name,
            "distance": dist,
            "base_time": base_time,
            "traffic": traffic
        })
        edge_id_counter += 1

    # Connect each hospital to its primary road intersection
    for hosp in HOSPITALS:
        target_node = hosp["connects_to"]
        lat1, lng1 = hosp["lat"], hosp["lng"]
        lat2, lng2 = node_coords[target_node]
        dist = haversine_km(lat1, lng1, lat2, lng2)
        if dist < 0.1:
            dist = 0.15
        base_time = round((dist / 35.0) * 60, 2)
        if base_time < 0.3:
            base_time = 0.3

        all_edges.append({
            "id": f"edge_hosp_{hosp['id']}",
            "source": hosp["id"],
            "target": target_node,
            "name": f"Access Road to {hosp['name']}",
            "distance": dist,
            "base_time": base_time,
            "traffic": "clear"
        })

    # Default starting ambulance station node (Central Emergency Depot at Nampally / Lakdikapul)
    amb_node = {
        "id": "amb_central_hyderabad",
        "name": "Central Emergency Ambulance Depot (Nampally / Lakdikapul)",
        "area": "Lakdikapul",
        "lat": 17.4045,
        "lng": 78.4640,
        "type": "ambulance",
        "details": "Telangana EMRI 108 Rapid Emergency Response Base 01"
    }

    # Verify Reachability & Graph Connectivity (BFS)
    adj = {n["id"]: set() for n in all_nodes}
    adj[amb_node["id"]] = set()
    for e in all_edges:
        adj[e["source"]].add(e["target"])
        adj[e["target"]].add(e["source"])
    # Connect amb_node to nearest intersection
    adj[amb_node["id"]].add("loc_lakdikapul")
    adj["loc_lakdikapul"].add(amb_node["id"])
    all_edges.append({
        "id": "edge_amb_central",
        "source": amb_node["id"],
        "target": "loc_lakdikapul",
        "name": "Emergency Depot Slip Road to Lakdikapul",
        "distance": 0.2,
        "base_time": 0.4,
        "traffic": "clear"
    })
    all_nodes.insert(0, amb_node)

    # Run BFS from ambulance node
    visited = set()
    queue = [amb_node["id"]]
    visited.add(amb_node["id"])
    while queue:
        curr = queue.pop(0)
        for neighbor in adj[curr]:
            if neighbor not in visited:
                visited.add(neighbor)
                queue.append(neighbor)

    unreachable = [n["id"] for n in all_nodes if n["id"] not in visited]
    if unreachable:
        print(f"CRITICAL ERROR: Graph has {len(unreachable)} unreachable nodes: {unreachable}")
        sys.exit(1)

    print(f"SUCCESS: Graph is 100% connected! All {len(all_nodes)} nodes ({len(HUBS)} hubs, {len(HOSPITALS)} hospitals, 1 ambulance depot) reachable via {len(all_edges)} road segments.")

    dataset = {
        "city": "Hyderabad",
        "center": {"lat": 17.405, "lng": 78.475},
        "default_zoom": 12,
        "ambulance": amb_node,
        "hospitals": HOSPITALS,
        "nodes": all_nodes,
        "edges": all_edges,
        "traffic_levels": ["clear", "light", "moderate", "heavy", "severe"]
    }

    output_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data")
    os.makedirs(output_dir, exist_ok=True)
    output_path = os.path.join(output_dir, "hyderabad_network.json")
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(dataset, f, indent=2)

    print(f"Wrote Hyderabad city-wide road network dataset to {output_path} (size: {len(json.dumps(dataset))} bytes)")

if __name__ == "__main__":
    build_hyderabad_dataset()
