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
    const FALLBACK_GRAPH = {"city":"Hyderabad","center":{"lat":17.405,"lng":78.475},"default_zoom":12,"ambulance":{"id":"amb_central_hyderabad","name":"Central Emergency Ambulance Depot (Nampally / Lakdikapul)","area":"Lakdikapul","lat":17.4045,"lng":78.464,"type":"ambulance","details":"Telangana EMRI 108 Rapid Emergency Response Base 01"},"hospitals":[{"id":"hosp_osmania","name":"Osmania General Hospital","area":"Afzal Gunj / Koti","lat":17.3762,"lng":78.4795,"type":"hospital","details":"Level 1 Apex Trauma Center, 1,168 beds, 24/7 Resuscitation & Emergency Surgery Unit","connects_to":"loc_afzalgunj"},{"id":"hosp_gandhi","name":"Gandhi Hospital","area":"Musheerabad / Secunderabad","lat":17.4244,"lng":78.5034,"type":"hospital","details":"Apex Teaching Hospital, 1,200 beds, Dedicated Poison, Stroke & Emergency ICU Bay","connects_to":"loc_musheerabad"},{"id":"hosp_nims","name":"Nizam's Institute of Medical Sciences (NIMS)","area":"Punjagutta","lat":17.4239,"lng":78.4528,"type":"hospital","details":"Autonomous State Medical Institute, 1,500 beds, Acute Cardiac & Neuro Trauma Care","connects_to":"loc_punjagutta"},{"id":"hosp_apollo_jubilee","name":"Apollo Hospitals Jubilee Hills","area":"Jubilee Hills","lat":17.4165,"lng":78.4116,"type":"hospital","details":"JCI Accredited Emergency Center, 600 beds, Advanced Stroke, Trauma & Air Ambulance Bay","connects_to":"loc_film_nagar"},{"id":"hosp_aig","name":"AIG Hospitals Gachibowli","area":"Gachibowli","lat":17.4428,"lng":78.3662,"type":"hospital","details":"800 beds, World-Class Acute Emergency, Gastro & Multidisciplinary Trauma Units","connects_to":"loc_gachibowli"},{"id":"hosp_continental","name":"Continental Hospitals","area":"Financial District","lat":17.4182,"lng":78.3444,"type":"hospital","details":"JCI-Accredited 750-bed Tertiary Center, Cyberabad Rapid Emergency Trauma Bay","connects_to":"loc_financial_dist"},{"id":"hosp_yashoda_sec","name":"Yashoda Hospitals Secunderabad","area":"Secunderabad","lat":17.4395,"lng":78.4985,"type":"hospital","details":"Alexander Road, 24/7 Interventional Cath Lab, High-Acuity Surgical ICU","connects_to":"loc_secunderabad"},{"id":"hosp_yashoda_som","name":"Yashoda Hospitals Somajiguda","area":"Somajiguda","lat":17.4215,"lng":78.4578,"type":"hospital","details":"Raj Bhavan Road, Multi-Organ Transplant & Rapid Emergency Resuscitation Center","connects_to":"loc_somajiguda"},{"id":"hosp_yashoda_malakpet","name":"Yashoda Hospitals Malakpet","area":"Malakpet","lat":17.3752,"lng":78.5015,"type":"hospital","details":"Nalgonda X Roads, Premier East-Zone Comprehensive Emergency Trauma Bay","connects_to":"loc_malakpet"},{"id":"hosp_care_banjara","name":"CARE Hospitals Banjara Hills","area":"Banjara Hills","lat":17.414,"lng":78.4485,"type":"hospital","details":"Road No. 1, 435 beds, Leading Cardiac Emergency, Vascular & Acute Resuscitation Unit","connects_to":"loc_banjara_hills"},{"id":"hosp_care_hitech","name":"CARE Hospitals Hitech City","area":"Hitech City","lat":17.4385,"lng":78.3712,"type":"hospital","details":"Old Mumbai Highway, 200 beds, Cyberabad Rapid Emergency Trauma Unit","connects_to":"loc_gachibowli"},{"id":"hosp_medicover_madhapur","name":"Medicover Hospitals Madhapur","area":"Madhapur","lat":17.4445,"lng":78.3832,"type":"hospital","details":"Mindspace Corridor, 400 beds, Advanced Neuro & Multi-Trauma Emergency Bay","connects_to":"loc_madhapur"},{"id":"hosp_kims_sec","name":"KIMS Hospitals Secunderabad","area":"Secunderabad","lat":17.4338,"lng":78.4872,"type":"hospital","details":"Minister Road, 1,000 beds, Level 1 Emergency Complex, Cardiac, Pediatric & Neuro ICUs","connects_to":"loc_paradise"},{"id":"hosp_sunshine_sec","name":"Sunshine Hospitals Secunderabad","area":"Secunderabad","lat":17.4435,"lng":78.4895,"type":"hospital","details":"PG Road, Paradise, 350 beds, Poly-Trauma, Orthopedic & Emergency Surgery Bay","connects_to":"loc_paradise"},{"id":"hosp_slg_bachupally","name":"SLG Hospitals Bachupally","area":"Bachupally","lat":17.5265,"lng":78.3705,"type":"hospital","details":"999-bed Multi-Super Specialty Hospital, North-West Hyderabad Advanced Emergency Bay","connects_to":"loc_bachupally"},{"id":"hosp_kamineni_lbnagar","name":"Kamineni Hospitals LB Nagar","area":"LB Nagar","lat":17.3485,"lng":78.5535,"type":"hospital","details":"Inner Ring Road, 450 beds, Dedicated South-East Highway Emergency Trauma Bay","connects_to":"loc_lbnagar"},{"id":"hosp_omni_kothapet","name":"Omni Hospitals Kothapet","area":"Dilsukhnagar / Kothapet","lat":17.3645,"lng":78.541,"type":"hospital","details":"Chaitanyapuri Main Road, 206 beds, Acute Cardiac & Trauma Resuscitation","connects_to":"loc_kothapet"},{"id":"hosp_citizens_nallagandla","name":"Citizens Specialty Hospital","area":"Nallagandla","lat":17.474,"lng":78.309,"type":"hospital","details":"Nallagandla-Gachibowli, 300 beds, Advanced Oncology & Trauma Emergency Unit","connects_to":"loc_nallagandla"},{"id":"hosp_aster_ameerpet","name":"Aster Prime Hospital","area":"Ameerpet","lat":17.4385,"lng":78.4475,"type":"hospital","details":"Mythrivanam Metro, 158 beds, Rapid Cardiac, Stroke & Trauma Emergency Response","connects_to":"loc_ameerpet"},{"id":"hosp_olive_mehdipatnam","name":"Olive Hospital Mehdipatnam","area":"Mehdipatnam","lat":17.3912,"lng":78.4355,"type":"hospital","details":"Nanal Nagar, 200 beds, Acute Resuscitation & Emergency Critical Care Bay","connects_to":"loc_mehdipatnam"},{"id":"hosp_princess_esra","name":"Princess Esra Hospital","area":"Charminar Old City","lat":17.3605,"lng":78.4782,"type":"hospital","details":"Moghalpura, Historic Old City 500-bed Tertiary Teaching & Emergency Care Center","connects_to":"loc_charminar"},{"id":"hosp_gleneagles","name":"Gleneagles Global Hospital","area":"Lakdikapul","lat":17.4055,"lng":78.4635,"type":"hospital","details":"Lakdikapul Metro, Multi-Organ Transplant Center & 24/7 Resuscitation Facility","connects_to":"loc_lakdikapul"},{"id":"hosp_fernandez","name":"Fernandez Hospital","area":"Abids / Bogulkunta","lat":17.3918,"lng":78.4815,"type":"hospital","details":"Bogulkunta, Premier High-Risk Maternal, Perinatal & Pediatric Emergency Bay","connects_to":"loc_abids"},{"id":"hosp_apollo_drdo","name":"Apollo DRDO Hospital","area":"Chandrayangutta / Kanchanbagh","lat":17.3395,"lng":78.502,"type":"hospital","details":"DMRL X Roads, 150 beds, South Hyderabad Emergency Resuscitation Unit","connects_to":"loc_santoshnagar"},{"id":"hosp_tx_uppal","name":"TX Hospitals Uppal","area":"Uppal","lat":17.4015,"lng":78.5585,"type":"hospital","details":"Uppal Ring Road, 200 beds, Eastern Corridor Acute Emergency & ICU Unit","connects_to":"loc_uppal"},{"id":"hosp_rush_kompally","name":"Rush Hospitals Kompally","area":"Kompally","lat":17.5185,"lng":78.4875,"type":"hospital","details":"Suchitra Circle, North Hyderabad Super Specialty Emergency Trauma Center","connects_to":"loc_suchitra"}],"nodes":[{"id":"amb_central_hyderabad","name":"Central Emergency Ambulance Depot (Nampally / Lakdikapul)","area":"Lakdikapul","lat":17.4045,"lng":78.464,"type":"ambulance","details":"Telangana EMRI 108 Rapid Emergency Response Base 01"},{"id":"loc_gachibowli","name":"Gachibowli Junction","area":"Gachibowli","lat":17.4399,"lng":78.3614,"type":"intersection","details":"Bio-Diversity & Outer Ring Road Interchange"},{"id":"loc_financial_dist","name":"Financial District","area":"Financial District","lat":17.418,"lng":78.342,"type":"intersection","details":"WaveRock & IT SEZ Hub"},{"id":"loc_nallagandla","name":"Nallagandla Flyover","area":"Nallagandla","lat":17.472,"lng":78.307,"type":"intersection","details":"Tellapur & BHEL Corridor"},{"id":"loc_hitech_city","name":"Hitech City Cyber Towers","area":"Hitech City","lat":17.4504,"lng":78.3808,"type":"intersection","details":"Cyber Towers Core Intersection"},{"id":"loc_madhapur","name":"Madhapur Mindspace","area":"Madhapur","lat":17.4334,"lng":78.3866,"type":"intersection","details":"Mindspace IT Park & Inorbit Mall Corridor"},{"id":"loc_kondapur","name":"Kondapur Kothaguda Junction","area":"Kondapur","lat":17.461,"lng":78.367,"type":"intersection","details":"Botanical Garden & HITEC-Kondapur Junction"},{"id":"loc_kukatpally","name":"Kukatpally KPHB Colony","area":"Kukatpally","lat":17.4947,"lng":78.3912,"type":"intersection","details":"JNTU & KPHB Metro Arterial"},{"id":"loc_kukatpally_y","name":"Kukatpally Y-Junction","area":"Kukatpally","lat":17.485,"lng":78.418,"type":"intersection","details":"Balanagar-Moosapet Y-Junction"},{"id":"loc_miyapur","name":"Miyapur Allwyn X Roads","area":"Miyapur","lat":17.4968,"lng":78.3546,"type":"intersection","details":"Miyapur Metro Terminal & NH-65 Junction"},{"id":"loc_bachupally","name":"Bachupally X Roads","area":"Bachupally","lat":17.527,"lng":78.368,"type":"intersection","details":"Nizampet-Bachupally Medical Corridor"},{"id":"loc_moosapet","name":"Moosapet Metro Junction","area":"Moosapet","lat":17.464,"lng":78.432,"type":"intersection","details":"NH-65 Commercial Corridor"},{"id":"loc_erragadda","name":"Erragadda ESI Metro","area":"Erragadda","lat":17.453,"lng":78.439,"type":"intersection","details":"ESI Hospital & Sanath Nagar Link"},{"id":"loc_sr_nagar","name":"SR Nagar Junction","area":"SR Nagar","lat":17.444,"lng":78.443,"type":"intersection","details":"Commercial Arterial Corridor"},{"id":"loc_balanagar","name":"Balanagar Cross Roads","area":"Balanagar","lat":17.472,"lng":78.448,"type":"intersection","details":"Industrial Area Main Interchange"},{"id":"loc_ameerpet","name":"Ameerpet Metro Interchange","area":"Ameerpet","lat":17.4375,"lng":78.4483,"type":"intersection","details":"Major Twin-Line Transit Hub"},{"id":"loc_punjagutta","name":"Punjagutta Center","area":"Punjagutta","lat":17.426,"lng":78.453,"type":"intersection","details":"Nagarjuna Circle & Central Mall Flyover"},{"id":"loc_somajiguda","name":"Somajiguda Raj Bhavan Road","area":"Somajiguda","lat":17.421,"lng":78.458,"type":"intersection","details":"Governor Residence & Healthcare Row"},{"id":"loc_banjara_hills","name":"Banjara Hills Road No. 1","area":"Banjara Hills","lat":17.4156,"lng":78.4352,"type":"intersection","details":"Taj Krishna & Healthcare Corridor"},{"id":"loc_banjara_rd12","name":"Banjara Hills Road No. 12","area":"Banjara Hills","lat":17.417,"lng":78.434,"type":"intersection","details":"Cancer Institute & Masab Tank Link"},{"id":"loc_jubilee_hills","name":"Jubilee Hills Checkpost","area":"Jubilee Hills","lat":17.43,"lng":78.411,"type":"intersection","details":"Peddamma Temple & Road 36 Interchange"},{"id":"loc_jubilee_rd36","name":"Jubilee Hills Road No. 36","area":"Jubilee Hills","lat":17.433,"lng":78.398,"type":"intersection","details":"Madhapur-Jubilee Hills Boundary"},{"id":"loc_film_nagar","name":"Film Nagar Cultural Center","area":"Film Nagar","lat":17.412,"lng":78.406,"type":"intersection","details":"Apollo Hospital South Approach"},{"id":"loc_mehdipatnam","name":"Mehdipatnam Rethi Bowli","area":"Mehdipatnam","lat":17.392,"lng":78.441,"type":"intersection","details":"Bus Terminal & PVNR Expressway Entry"},{"id":"loc_tolichowki","name":"Tolichowki Flyover","area":"Tolichowki","lat":17.399,"lng":78.412,"type":"intersection","details":"Golconda & Shaikpet Transit Link"},{"id":"loc_shaikpet","name":"Shaikpet Dargah Flyover","area":"Shaikpet","lat":17.408,"lng":78.388,"type":"intersection","details":"Seven Tombs & Gachibowli Flyover"},{"id":"loc_raidurgam","name":"Raidurgam Knowledge City","area":"Raidurgam","lat":17.425,"lng":78.377,"type":"intersection","details":"T-Hub, IKEA & Durgam Cheruvu Cable Bridge"},{"id":"loc_attapur","name":"Attapur Pillar 143","area":"Attapur","lat":17.368,"lng":78.438,"type":"intersection","details":"PVNR Expressway & Hyderguda Link"},{"id":"loc_aramghar","name":"Aramghar Junction","area":"Aramghar","lat":17.321,"lng":78.434,"type":"intersection","details":"NH-44 & PVNR Expressway South Terminal"},{"id":"loc_rajendranagar","name":"Rajendranagar Agriculture Campus","area":"Rajendranagar","lat":17.319,"lng":78.41,"type":"intersection","details":"Outer Ring Road South Connector"},{"id":"loc_shamshabad","name":"Shamshabad Airport Interchange","area":"Shamshabad","lat":17.245,"lng":78.432,"type":"intersection","details":"Rajiv Gandhi International Airport (RGIA) Gateway"},{"id":"loc_khairatabad","name":"Khairatabad RTA Circle","area":"Khairatabad","lat":17.4116,"lng":78.4612,"type":"intersection","details":"Lake Perimeter & Flyover"},{"id":"loc_lakdikapul","name":"Lakdikapul Metro Junction","area":"Lakdikapul","lat":17.4045,"lng":78.464,"type":"intersection","details":"Collectorate & Assembly Corridor"},{"id":"loc_nampally","name":"Nampally Station Road","area":"Nampally","lat":17.3916,"lng":78.472,"type":"intersection","details":"Railway Station & Exhibition Grounds"},{"id":"loc_abids","name":"Abids GPO Circle","area":"Abids","lat":17.392,"lng":78.478,"type":"intersection","details":"Historic Central Business District"},{"id":"loc_koti","name":"Koti Women's College X Roads","area":"Koti","lat":17.385,"lng":78.4867,"type":"intersection","details":"Sultan Bazaar & Medical Row"},{"id":"loc_afzalgunj","name":"Afzal Gunj Nayapul Bridge","area":"Afzal Gunj","lat":17.375,"lng":78.479,"type":"intersection","details":"Osmania General Hospital Main Approach"},{"id":"loc_highcourt","name":"High Court City College","area":"High Court","lat":17.368,"lng":78.471,"type":"intersection","details":"Musi River South Bank"},{"id":"loc_charminar","name":"Charminar Historic Plaza","area":"Charminar","lat":17.3616,"lng":78.4747,"type":"intersection","details":"Old City Center & Mecca Masjid"},{"id":"loc_falaknuma","name":"Falaknuma Palace Gate","area":"Falaknuma","lat":17.332,"lng":78.468,"type":"intersection","details":"Engine Bowli & South City Link"},{"id":"loc_chandrayangutta","name":"Chandrayangutta X Roads","area":"Chandrayangutta","lat":17.329,"lng":78.489,"type":"intersection","details":"Inner Ring Road South Sector"},{"id":"loc_santoshnagar","name":"Santoshnagar DRDO Junction","area":"Santoshnagar","lat":17.348,"lng":78.508,"type":"intersection","details":"Defence Laboratories Corridor"},{"id":"loc_malakpet","name":"Malakpet Super Bazaar","area":"Malakpet","lat":17.375,"lng":78.502,"type":"intersection","details":"NH-65 & Yashoda Malakpet Link"},{"id":"loc_dilsukhnagar","name":"Dilsukhnagar Bus Depot","area":"Dilsukhnagar","lat":17.3688,"lng":78.5247,"type":"intersection","details":"Metro Station & High Density Commercial Street"},{"id":"loc_kothapet","name":"Kothapet Fruit Market","area":"Kothapet","lat":17.361,"lng":78.542,"type":"intersection","details":"Chaitanyapuri & Omni Hospital Cross"},{"id":"loc_lbnagar","name":"LB Nagar Ring Road Junction","area":"LB Nagar","lat":17.348,"lng":78.552,"type":"intersection","details":"Inner Ring Road & NH-65 Southern Gateway"},{"id":"loc_vanasthalipuram","name":"Vanasthalipuram Complex","area":"Vanasthalipuram","lat":17.336,"lng":78.572,"type":"intersection","details":"Sushma Cross Roads"},{"id":"loc_hayathnagar","name":"Hayathnagar RTC Depot","area":"Hayathnagar","lat":17.324,"lng":78.608,"type":"intersection","details":"NH-65 Vijayawada Highway Exit"},{"id":"loc_nagole","name":"Nagole Metro Station","area":"Nagole","lat":17.375,"lng":78.56,"type":"intersection","details":"Inner Ring Road & Musi River Bridge"},{"id":"loc_uppal","name":"Uppal Cross Roads","area":"Uppal","lat":17.402,"lng":78.56,"type":"intersection","details":"Rajiv Gandhi Stadium & Warangal Highway Entry"},{"id":"loc_ramanthapur","name":"Ramanthapur Polytechnic","area":"Ramanthapur","lat":17.392,"lng":78.541,"type":"intersection","details":"TV Studio & Amberpet Link Road"},{"id":"loc_amberpet","name":"Amberpet Ali Cafe X Roads","area":"Amberpet","lat":17.388,"lng":78.514,"type":"intersection","details":"Central-East Connector Road"},{"id":"loc_chikkadpally","name":"RTC X Roads Chikkadpally","area":"Chikkadpally","lat":17.404,"lng":78.498,"type":"intersection","details":"Theatres Hub & Indira Park Link"},{"id":"loc_kavadiguda","name":"Kavadiguda Lower Tank Bund","area":"Kavadiguda","lat":17.416,"lng":78.49,"type":"intersection","details":"CBR & Secretariat North Gate"},{"id":"loc_tankbund","name":"Tank Bund PVNR Marg","area":"Tank Bund","lat":17.411,"lng":78.476,"type":"intersection","details":"Hussain Sagar Lake Driveway"},{"id":"loc_begumpet","name":"Begumpet Flyover","area":"Begumpet","lat":17.444,"lng":78.474,"type":"intersection","details":"Old Airport Road & Lifestyle Building"},{"id":"loc_paradise","name":"Paradise Circle","area":"Paradise","lat":17.4425,"lng":78.487,"type":"intersection","details":"MG Road & Sardar Patel Road Hub"},{"id":"loc_secunderabad","name":"Secunderabad Clock Tower","area":"Secunderabad","lat":17.4399,"lng":78.502,"type":"intersection","details":"Secunderabad Railway Station Gateway"},{"id":"loc_sangeet","name":"Sangeet X Roads","area":"Secunderabad","lat":17.441,"lng":78.51,"type":"intersection","details":"Keyes High School & Mettuguda Link"},{"id":"loc_musheerabad","name":"Musheerabad Gandhi Gate","area":"Musheerabad","lat":17.424,"lng":78.503,"type":"intersection","details":"Gandhi Medical College & Hospital Entry"},{"id":"loc_mettuguda","name":"Mettuguda Metro Rail Nilayam","area":"Mettuguda","lat":17.438,"lng":78.523,"type":"intersection","details":"South Central Railway HQ"},{"id":"loc_tarnaka","name":"Tarnaka Flyover Junction","area":"Tarnaka","lat":17.428,"lng":78.538,"type":"intersection","details":"Nagarjuna Sagar & University Entrance"},{"id":"loc_osmania_univ","name":"Osmania University Campus","area":"Osmania University","lat":17.412,"lng":78.528,"type":"intersection","details":"Arts College & Vidyanagar Link"},{"id":"loc_habsiguda","name":"Habsiguda Street No. 8","area":"Habsiguda","lat":17.415,"lng":78.555,"type":"intersection","details":"CCMB & NGRI Research Institute Link"},{"id":"loc_nacharam","name":"Nacharam Industrial Area","area":"Nacharam","lat":17.436,"lng":78.573,"type":"intersection","details":"Mallapur & HMT Nagar Link"},{"id":"loc_moula_ali","name":"Moula Ali Kaman","area":"Moula Ali","lat":17.458,"lng":78.56,"type":"intersection","details":"Railway Goods Shed & Dargah"},{"id":"loc_ecil","name":"ECIL Cross Roads","area":"ECIL","lat":17.468,"lng":78.568,"type":"intersection","details":"Radhika Theatre & Electronics Complex"},{"id":"loc_sainikpuri","name":"Sainikpuri Cross Roads","area":"Sainikpuri","lat":17.491,"lng":78.555,"type":"intersection","details":"Defence Colony & Yapral Corridor"},{"id":"loc_neredmet","name":"Neredmet Cross Roads","area":"Neredmet","lat":17.481,"lng":78.538,"type":"intersection","details":"Safilguda Lake & Ramakrishnapuram Link"},{"id":"loc_malkajgiri","name":"Malkajgiri Anandbagh","area":"Malkajgiri","lat":17.452,"lng":78.535,"type":"intersection","details":"Malkajgiri Station & Vani Nagar Link"},{"id":"loc_marredpally","name":"Marredpally East","area":"Marredpally","lat":17.452,"lng":78.512,"type":"intersection","details":"Cantonment High-Speed Arterial"},{"id":"loc_bowenpally","name":"Bowenpally Checkpost","area":"Bowenpally","lat":17.478,"lng":78.485,"type":"intersection","details":"NH-44 Nagpur Highway Starting Point"},{"id":"loc_suchitra","name":"Suchitra Circle","area":"Suchitra","lat":17.512,"lng":78.488,"type":"intersection","details":"Quthbullapur & NH-44 Crossing"},{"id":"loc_kompally","name":"Kompally Cineplanet","area":"Kompally","lat":17.538,"lng":78.487,"type":"intersection","details":"North Hyderabad Highway Gateway"},{"id":"loc_jeedimetla","name":"Jeedimetla Industrial Area","area":"Jeedimetla","lat":17.509,"lng":78.455,"type":"intersection","details":"Subhash Nagar & Shapoor Nagar Link"},{"id":"orr_gachibowli","name":"ORR Exit 1 - Gachibowli","area":"Gachibowli","lat":17.432,"lng":78.349,"type":"intersection","details":"Outer Ring Road IT Hub Junction"},{"id":"orr_nanakramguda","name":"ORR Exit 2 - Nanakramguda","area":"Financial District","lat":17.415,"lng":78.349,"type":"intersection","details":"Outer Ring Road Financial Corridor"},{"id":"orr_appa","name":"ORR Exit 17 - Appa Junction","area":"Rajendranagar","lat":17.348,"lng":78.382,"type":"intersection","details":"Outer Ring Road Himayat Sagar Link"},{"id":"orr_shamshabad","name":"ORR Exit 16 - Shamshabad","area":"Shamshabad","lat":17.258,"lng":78.421,"type":"intersection","details":"Outer Ring Road Airport South Tollway"},{"id":"orr_bongloor","name":"ORR Exit 12 - Bongloor","area":"Bongloor","lat":17.275,"lng":78.548,"type":"intersection","details":"Outer Ring Road Nagarjuna Sagar Highway Exit"},{"id":"orr_pedda_amberpet","name":"ORR Exit 11 - Pedda Amberpet","area":"Pedda Amberpet","lat":17.322,"lng":78.618,"type":"intersection","details":"Outer Ring Road NH-65 Vijayawada Exit"},{"id":"orr_ghatkesar","name":"ORR Exit 9 - Ghatkesar / Medipally","area":"Ghatkesar","lat":17.428,"lng":78.632,"type":"intersection","details":"Outer Ring Road Warangal Highway Exit"},{"id":"orr_keesara","name":"ORR Exit 8 - Keesara","area":"Keesara","lat":17.512,"lng":78.605,"type":"intersection","details":"Outer Ring Road North-East Corridor"},{"id":"orr_medchal","name":"ORR Exit 6 - Medchal / Kandlakoya","area":"Medchal","lat":17.585,"lng":78.489,"type":"intersection","details":"Outer Ring Road NH-44 North Toll Plaza"},{"id":"orr_dundigal","name":"ORR Exit 5 - Dundigal / Bachupally","area":"Dundigal","lat":17.552,"lng":78.388,"type":"intersection","details":"Outer Ring Road Mallampet & Bachupally Exit"},{"id":"orr_patancheru","name":"ORR Exit 3 - Patancheru","area":"Patancheru","lat":17.515,"lng":78.268,"type":"intersection","details":"Outer Ring Road NH-65 Mumbai Tollway"},{"id":"orr_tellapur","name":"ORR Exit 2B - Tellapur / Kollur","area":"Tellapur","lat":17.475,"lng":78.291,"type":"intersection","details":"Outer Ring Road West Tech Residential Hub"},{"id":"hosp_osmania","name":"Osmania General Hospital","area":"Afzal Gunj / Koti","lat":17.3762,"lng":78.4795,"type":"hospital","details":"Level 1 Apex Trauma Center, 1,168 beds, 24/7 Resuscitation & Emergency Surgery Unit","connects_to":"loc_afzalgunj"},{"id":"hosp_gandhi","name":"Gandhi Hospital","area":"Musheerabad / Secunderabad","lat":17.4244,"lng":78.5034,"type":"hospital","details":"Apex Teaching Hospital, 1,200 beds, Dedicated Poison, Stroke & Emergency ICU Bay","connects_to":"loc_musheerabad"},{"id":"hosp_nims","name":"Nizam's Institute of Medical Sciences (NIMS)","area":"Punjagutta","lat":17.4239,"lng":78.4528,"type":"hospital","details":"Autonomous State Medical Institute, 1,500 beds, Acute Cardiac & Neuro Trauma Care","connects_to":"loc_punjagutta"},{"id":"hosp_apollo_jubilee","name":"Apollo Hospitals Jubilee Hills","area":"Jubilee Hills","lat":17.4165,"lng":78.4116,"type":"hospital","details":"JCI Accredited Emergency Center, 600 beds, Advanced Stroke, Trauma & Air Ambulance Bay","connects_to":"loc_film_nagar"},{"id":"hosp_aig","name":"AIG Hospitals Gachibowli","area":"Gachibowli","lat":17.4428,"lng":78.3662,"type":"hospital","details":"800 beds, World-Class Acute Emergency, Gastro & Multidisciplinary Trauma Units","connects_to":"loc_gachibowli"},{"id":"hosp_continental","name":"Continental Hospitals","area":"Financial District","lat":17.4182,"lng":78.3444,"type":"hospital","details":"JCI-Accredited 750-bed Tertiary Center, Cyberabad Rapid Emergency Trauma Bay","connects_to":"loc_financial_dist"},{"id":"hosp_yashoda_sec","name":"Yashoda Hospitals Secunderabad","area":"Secunderabad","lat":17.4395,"lng":78.4985,"type":"hospital","details":"Alexander Road, 24/7 Interventional Cath Lab, High-Acuity Surgical ICU","connects_to":"loc_secunderabad"},{"id":"hosp_yashoda_som","name":"Yashoda Hospitals Somajiguda","area":"Somajiguda","lat":17.4215,"lng":78.4578,"type":"hospital","details":"Raj Bhavan Road, Multi-Organ Transplant & Rapid Emergency Resuscitation Center","connects_to":"loc_somajiguda"},{"id":"hosp_yashoda_malakpet","name":"Yashoda Hospitals Malakpet","area":"Malakpet","lat":17.3752,"lng":78.5015,"type":"hospital","details":"Nalgonda X Roads, Premier East-Zone Comprehensive Emergency Trauma Bay","connects_to":"loc_malakpet"},{"id":"hosp_care_banjara","name":"CARE Hospitals Banjara Hills","area":"Banjara Hills","lat":17.414,"lng":78.4485,"type":"hospital","details":"Road No. 1, 435 beds, Leading Cardiac Emergency, Vascular & Acute Resuscitation Unit","connects_to":"loc_banjara_hills"},{"id":"hosp_care_hitech","name":"CARE Hospitals Hitech City","area":"Hitech City","lat":17.4385,"lng":78.3712,"type":"hospital","details":"Old Mumbai Highway, 200 beds, Cyberabad Rapid Emergency Trauma Unit","connects_to":"loc_gachibowli"},{"id":"hosp_medicover_madhapur","name":"Medicover Hospitals Madhapur","area":"Madhapur","lat":17.4445,"lng":78.3832,"type":"hospital","details":"Mindspace Corridor, 400 beds, Advanced Neuro & Multi-Trauma Emergency Bay","connects_to":"loc_madhapur"},{"id":"hosp_kims_sec","name":"KIMS Hospitals Secunderabad","area":"Secunderabad","lat":17.4338,"lng":78.4872,"type":"hospital","details":"Minister Road, 1,000 beds, Level 1 Emergency Complex, Cardiac, Pediatric & Neuro ICUs","connects_to":"loc_paradise"},{"id":"hosp_sunshine_sec","name":"Sunshine Hospitals Secunderabad","area":"Secunderabad","lat":17.4435,"lng":78.4895,"type":"hospital","details":"PG Road, Paradise, 350 beds, Poly-Trauma, Orthopedic & Emergency Surgery Bay","connects_to":"loc_paradise"},{"id":"hosp_slg_bachupally","name":"SLG Hospitals Bachupally","area":"Bachupally","lat":17.5265,"lng":78.3705,"type":"hospital","details":"999-bed Multi-Super Specialty Hospital, North-West Hyderabad Advanced Emergency Bay","connects_to":"loc_bachupally"},{"id":"hosp_kamineni_lbnagar","name":"Kamineni Hospitals LB Nagar","area":"LB Nagar","lat":17.3485,"lng":78.5535,"type":"hospital","details":"Inner Ring Road, 450 beds, Dedicated South-East Highway Emergency Trauma Bay","connects_to":"loc_lbnagar"},{"id":"hosp_omni_kothapet","name":"Omni Hospitals Kothapet","area":"Dilsukhnagar / Kothapet","lat":17.3645,"lng":78.541,"type":"hospital","details":"Chaitanyapuri Main Road, 206 beds, Acute Cardiac & Trauma Resuscitation","connects_to":"loc_kothapet"},{"id":"hosp_citizens_nallagandla","name":"Citizens Specialty Hospital","area":"Nallagandla","lat":17.474,"lng":78.309,"type":"hospital","details":"Nallagandla-Gachibowli, 300 beds, Advanced Oncology & Trauma Emergency Unit","connects_to":"loc_nallagandla"},{"id":"hosp_aster_ameerpet","name":"Aster Prime Hospital","area":"Ameerpet","lat":17.4385,"lng":78.4475,"type":"hospital","details":"Mythrivanam Metro, 158 beds, Rapid Cardiac, Stroke & Trauma Emergency Response","connects_to":"loc_ameerpet"},{"id":"hosp_olive_mehdipatnam","name":"Olive Hospital Mehdipatnam","area":"Mehdipatnam","lat":17.3912,"lng":78.4355,"type":"hospital","details":"Nanal Nagar, 200 beds, Acute Resuscitation & Emergency Critical Care Bay","connects_to":"loc_mehdipatnam"},{"id":"hosp_princess_esra","name":"Princess Esra Hospital","area":"Charminar Old City","lat":17.3605,"lng":78.4782,"type":"hospital","details":"Moghalpura, Historic Old City 500-bed Tertiary Teaching & Emergency Care Center","connects_to":"loc_charminar"},{"id":"hosp_gleneagles","name":"Gleneagles Global Hospital","area":"Lakdikapul","lat":17.4055,"lng":78.4635,"type":"hospital","details":"Lakdikapul Metro, Multi-Organ Transplant Center & 24/7 Resuscitation Facility","connects_to":"loc_lakdikapul"},{"id":"hosp_fernandez","name":"Fernandez Hospital","area":"Abids / Bogulkunta","lat":17.3918,"lng":78.4815,"type":"hospital","details":"Bogulkunta, Premier High-Risk Maternal, Perinatal & Pediatric Emergency Bay","connects_to":"loc_abids"},{"id":"hosp_apollo_drdo","name":"Apollo DRDO Hospital","area":"Chandrayangutta / Kanchanbagh","lat":17.3395,"lng":78.502,"type":"hospital","details":"DMRL X Roads, 150 beds, South Hyderabad Emergency Resuscitation Unit","connects_to":"loc_santoshnagar"},{"id":"hosp_tx_uppal","name":"TX Hospitals Uppal","area":"Uppal","lat":17.4015,"lng":78.5585,"type":"hospital","details":"Uppal Ring Road, 200 beds, Eastern Corridor Acute Emergency & ICU Unit","connects_to":"loc_uppal"},{"id":"hosp_rush_kompally","name":"Rush Hospitals Kompally","area":"Kompally","lat":17.5185,"lng":78.4875,"type":"hospital","details":"Suchitra Circle, North Hyderabad Super Specialty Emergency Trauma Center","connects_to":"loc_suchitra"}],"edges":[{"id":"edge_1","source":"orr_gachibowli","target":"orr_nanakramguda","name":"Outer Ring Road (ORR) Expressway - Sector A","distance":1.89,"base_time":1.51,"traffic":"clear"},{"id":"edge_2","source":"orr_nanakramguda","target":"loc_financial_dist","name":"ORR Financial District Arterial","distance":0.81,"base_time":0.81,"traffic":"clear"},{"id":"edge_3","source":"orr_nanakramguda","target":"orr_appa","name":"Outer Ring Road (ORR) Expressway - Appa Sector","distance":8.23,"base_time":6.17,"traffic":"clear"},{"id":"edge_4","source":"orr_appa","target":"loc_rajendranagar","name":"Rajendranagar Link Road","distance":4.39,"base_time":5.27,"traffic":"clear"},{"id":"edge_5","source":"orr_appa","target":"orr_shamshabad","name":"Outer Ring Road (ORR) - Airport Sector","distance":10.83,"base_time":8.12,"traffic":"clear"},{"id":"edge_6","source":"orr_shamshabad","target":"loc_shamshabad","name":"Shamshabad Airport Approach Expressway","distance":1.86,"base_time":1.59,"traffic":"clear"},{"id":"edge_7","source":"orr_shamshabad","target":"orr_bongloor","name":"Outer Ring Road (ORR) - South Sector","distance":13.62,"base_time":9.61,"traffic":"clear"},{"id":"edge_8","source":"orr_bongloor","target":"orr_pedda_amberpet","name":"Outer Ring Road (ORR) - East Sector","distance":9.09,"base_time":6.42,"traffic":"clear"},{"id":"edge_9","source":"orr_pedda_amberpet","target":"loc_hayathnagar","name":"Hayathnagar Link Road","distance":1.08,"base_time":1.18,"traffic":"clear"},{"id":"edge_10","source":"orr_pedda_amberpet","target":"orr_ghatkesar","name":"Outer Ring Road (ORR) - Medipally Corridor","distance":11.88,"base_time":8.39,"traffic":"clear"},{"id":"edge_11","source":"orr_ghatkesar","target":"loc_uppal","name":"Warangal Highway - Uppal Link","distance":8.17,"base_time":8.91,"traffic":"clear"},{"id":"edge_12","source":"orr_ghatkesar","target":"orr_keesara","name":"Outer Ring Road (ORR) - Keesara Sector","distance":9.77,"base_time":6.9,"traffic":"clear"},{"id":"edge_13","source":"orr_keesara","target":"loc_ecil","name":"Keesara - ECIL Arterial","distance":6.27,"base_time":7.52,"traffic":"clear"},{"id":"edge_14","source":"orr_keesara","target":"orr_medchal","name":"Outer Ring Road (ORR) - North Sector","distance":14.74,"base_time":10.4,"traffic":"clear"},{"id":"edge_15","source":"orr_medchal","target":"loc_kompally","name":"Medchal - Kompally NH-44 Corridor","distance":5.23,"base_time":4.83,"traffic":"clear"},{"id":"edge_16","source":"orr_medchal","target":"orr_dundigal","name":"Outer Ring Road (ORR) - Dundigal Sector","distance":11.32,"base_time":7.99,"traffic":"clear"},{"id":"edge_17","source":"orr_dundigal","target":"loc_bachupally","name":"Bachupally - ORR Connector","distance":3.5,"base_time":3.82,"traffic":"clear"},{"id":"edge_18","source":"orr_dundigal","target":"orr_patancheru","name":"Outer Ring Road (ORR) - Patancheru Corridor","distance":13.37,"base_time":9.44,"traffic":"clear"},{"id":"edge_19","source":"orr_patancheru","target":"loc_miyapur","name":"NH-65 Patancheru - Miyapur Expressway","distance":9.4,"base_time":8.68,"traffic":"clear"},{"id":"edge_20","source":"orr_patancheru","target":"orr_tellapur","name":"Outer Ring Road (ORR) - Kollur Link","distance":5.07,"base_time":3.8,"traffic":"clear"},{"id":"edge_21","source":"orr_tellapur","target":"loc_nallagandla","name":"Tellapur - Nallagandla Road","distance":1.73,"base_time":2.08,"traffic":"clear"},{"id":"edge_22","source":"loc_nallagandla","target":"loc_gachibowli","name":"Nallagandla - Gachibowli Link Road","distance":6.79,"base_time":8.15,"traffic":"clear"},{"id":"edge_23","source":"orr_gachibowli","target":"loc_gachibowli","name":"Gachibowli Flyover & Interchange","distance":1.58,"base_time":1.58,"traffic":"clear"},{"id":"edge_24","source":"loc_mehdipatnam","target":"loc_attapur","name":"PVNR Elevated Expressway - Phase 1","distance":2.69,"base_time":2.31,"traffic":"clear"},{"id":"edge_25","source":"loc_attapur","target":"loc_aramghar","name":"PVNR Elevated Expressway - Phase 2","distance":5.24,"base_time":4.19,"traffic":"clear"},{"id":"edge_26","source":"loc_aramghar","target":"loc_shamshabad","name":"NH-44 Bangalore Highway - Airport Corridor","distance":8.45,"base_time":7.24,"traffic":"clear"},{"id":"edge_27","source":"loc_aramghar","target":"loc_rajendranagar","name":"Agriculture University Road","distance":2.56,"base_time":3.41,"traffic":"clear"},{"id":"edge_28","source":"loc_aramghar","target":"loc_chandrayangutta","name":"Inner Ring Road South - Aramghar to Chandrayangutta","distance":5.91,"base_time":6.45,"traffic":"clear"},{"id":"edge_29","source":"loc_miyapur","target":"loc_kukatpally","name":"NH-65 Miyapur - KPHB Metro Highway","distance":3.89,"base_time":4.67,"traffic":"clear"},{"id":"edge_30","source":"loc_kukatpally","target":"loc_kukatpally_y","name":"NH-65 KPHB to Y-Junction","distance":3.04,"base_time":4.05,"traffic":"clear"},{"id":"edge_31","source":"loc_kukatpally_y","target":"loc_moosapet","name":"NH-65 Moosapet Metro Corridor","distance":2.77,"base_time":3.69,"traffic":"clear"},{"id":"edge_32","source":"loc_moosapet","target":"loc_erragadda","name":"NH-65 Bharat Nagar to Erragadda","distance":1.43,"base_time":1.91,"traffic":"clear"},{"id":"edge_33","source":"loc_erragadda","target":"loc_sr_nagar","name":"NH-65 ESI Hospital to SR Nagar","distance":1.09,"base_time":1.45,"traffic":"clear"},{"id":"edge_34","source":"loc_sr_nagar","target":"loc_ameerpet","name":"NH-65 SR Nagar to Ameerpet Metro","distance":0.92,"base_time":1.23,"traffic":"clear"},{"id":"edge_35","source":"loc_ameerpet","target":"loc_punjagutta","name":"NH-65 Ameerpet - Punjagutta Flyover","distance":1.37,"base_time":1.83,"traffic":"clear"},{"id":"edge_36","source":"loc_punjagutta","target":"loc_somajiguda","name":"Somajiguda Raj Bhavan Highway","distance":0.77,"base_time":1.03,"traffic":"clear"},{"id":"edge_37","source":"loc_somajiguda","target":"loc_khairatabad","name":"Khairatabad Flyover Corridor","distance":1.1,"base_time":1.47,"traffic":"clear"},{"id":"edge_38","source":"loc_khairatabad","target":"loc_lakdikapul","name":"Lakdikapul Metro Arterial","distance":0.84,"base_time":1.26,"traffic":"clear"},{"id":"edge_39","source":"loc_lakdikapul","target":"loc_nampally","name":"Nampally Station Road","distance":1.67,"base_time":2.5,"traffic":"clear"},{"id":"edge_40","source":"loc_nampally","target":"loc_abids","name":"Mozamjahi Market to Abids Circle","distance":0.64,"base_time":0.96,"traffic":"clear"},{"id":"edge_41","source":"loc_abids","target":"loc_koti","name":"Bank Street Abids - Koti Commercial Road","distance":1.21,"base_time":1.81,"traffic":"clear"},{"id":"edge_42","source":"loc_koti","target":"loc_malakpet","name":"Chaderghat Bridge & Malakpet Arterial","distance":1.97,"base_time":2.63,"traffic":"clear"},{"id":"edge_43","source":"loc_malakpet","target":"loc_dilsukhnagar","name":"NH-65 Malakpet to Dilsukhnagar Metro Road","distance":2.51,"base_time":3.35,"traffic":"clear"},{"id":"edge_44","source":"loc_dilsukhnagar","target":"loc_kothapet","name":"NH-65 Dilsukhnagar to Kothapet Corridor","distance":2.03,"base_time":2.71,"traffic":"clear"},{"id":"edge_45","source":"loc_kothapet","target":"loc_lbnagar","name":"NH-65 Kothapet to LB Nagar Junction","distance":1.79,"base_time":2.39,"traffic":"clear"},{"id":"edge_46","source":"loc_lbnagar","target":"loc_vanasthalipuram","name":"NH-65 LB Nagar to Vanasthalipuram","distance":2.51,"base_time":2.74,"traffic":"clear"},{"id":"edge_47","source":"loc_vanasthalipuram","target":"loc_hayathnagar","name":"NH-65 Vanasthalipuram to Hayathnagar","distance":4.05,"base_time":4.05,"traffic":"clear"},{"id":"edge_48","source":"loc_gachibowli","target":"loc_financial_dist","name":"Gachibowli - Financial District ISB Road","distance":3.19,"base_time":3.83,"traffic":"clear"},{"id":"edge_49","source":"loc_gachibowli","target":"loc_kondapur","name":"Botanical Garden Road - Gachibowli to Kondapur","distance":2.42,"base_time":3.23,"traffic":"clear"},{"id":"edge_50","source":"loc_kondapur","target":"loc_miyapur","name":"Kondapur - Hafeezpet - Miyapur Road","distance":4.19,"base_time":5.59,"traffic":"clear"},{"id":"edge_51","source":"loc_kondapur","target":"loc_hitech_city","name":"Kothaguda Flyover to Hitech City","distance":1.88,"base_time":2.51,"traffic":"clear"},{"id":"edge_52","source":"loc_gachibowli","target":"loc_hitech_city","name":"Bio-Diversity to Cyber Towers Arterial","distance":2.37,"base_time":2.84,"traffic":"clear"},{"id":"edge_53","source":"loc_hitech_city","target":"loc_madhapur","name":"Cyber Towers to Mindspace Main Road","distance":1.99,"base_time":2.65,"traffic":"clear"},{"id":"edge_54","source":"loc_madhapur","target":"loc_raidurgam","name":"Inorbit Mall to Durgam Cheruvu Link","distance":1.38,"base_time":1.84,"traffic":"clear"},{"id":"edge_55","source":"loc_raidurgam","target":"loc_gachibowli","name":"Knowledge City to Bio-Diversity Junction","distance":2.34,"base_time":2.81,"traffic":"clear"},{"id":"edge_56","source":"loc_hitech_city","target":"loc_kukatpally","name":"Hitech City - Malaysian Township - KPHB Bypass","distance":5.05,"base_time":6.73,"traffic":"clear"},{"id":"edge_57","source":"loc_kukatpally","target":"loc_bachupally","name":"KPHB to Nizampet & Bachupally Road","distance":4.35,"base_time":5.8,"traffic":"clear"},{"id":"edge_58","source":"loc_madhapur","target":"loc_jubilee_rd36","name":"Madhapur to Jubilee Hills Road No. 36","distance":1.21,"base_time":1.61,"traffic":"clear"},{"id":"edge_59","source":"loc_jubilee_rd36","target":"loc_jubilee_hills","name":"Jubilee Hills Road No. 36 Metro Corridor","distance":1.42,"base_time":1.89,"traffic":"clear"},{"id":"edge_60","source":"loc_jubilee_hills","target":"loc_film_nagar","name":"Jubilee Hills Checkpost to Film Nagar","distance":2.07,"base_time":2.76,"traffic":"clear"},{"id":"edge_61","source":"loc_film_nagar","target":"loc_banjara_rd12","name":"Film Nagar to Banjara Hills Road No. 12","distance":3.02,"base_time":4.53,"traffic":"clear"},{"id":"edge_62","source":"loc_jubilee_hills","target":"loc_banjara_hills","name":"Road No. 36 to Banjara Hills Road No. 1","distance":3.03,"base_time":4.04,"traffic":"clear"},{"id":"edge_63","source":"loc_banjara_rd12","target":"loc_banjara_hills","name":"Banjara Hills Road 12 to Road 1 Link","distance":0.2,"base_time":0.5,"traffic":"clear"},{"id":"edge_64","source":"loc_banjara_hills","target":"loc_punjagutta","name":"Banjara Hills Road No. 1 to Nagarjuna Circle","distance":2.21,"base_time":2.95,"traffic":"clear"},{"id":"edge_65","source":"loc_banjara_hills","target":"loc_mehdipatnam","name":"Banjara Hills Road No. 1 to Masab Tank & Mehdipatnam","distance":2.7,"base_time":3.6,"traffic":"clear"},{"id":"edge_66","source":"loc_jubilee_hills","target":"loc_ameerpet","name":"Jubilee Hills to Krishna Nagar & Ameerpet Road","distance":4.04,"base_time":6.06,"traffic":"clear"},{"id":"edge_67","source":"loc_mehdipatnam","target":"loc_tolichowki","name":"Mehdipatnam to Tolichowki Flyover","distance":3.17,"base_time":3.8,"traffic":"clear"},{"id":"edge_68","source":"loc_tolichowki","target":"loc_shaikpet","name":"Tolichowki to Shaikpet Dargah Flyover","distance":2.74,"base_time":3.29,"traffic":"clear"},{"id":"edge_69","source":"loc_shaikpet","target":"loc_raidurgam","name":"Shaikpet Flyover to Raidurgam T-Hub","distance":2.22,"base_time":2.66,"traffic":"clear"},{"id":"edge_70","source":"loc_shaikpet","target":"loc_film_nagar","name":"Shaikpet to Film Nagar Link Road","distance":1.96,"base_time":2.94,"traffic":"clear"},{"id":"edge_71","source":"loc_tolichowki","target":"loc_attapur","name":"Langar Houz & Ring Road to Attapur","distance":4.42,"base_time":6.63,"traffic":"clear"},{"id":"edge_72","source":"loc_lakdikapul","target":"loc_afzalgunj","name":"Moazzam Jahi to Afzal Gunj via City College","distance":3.65,"base_time":5.47,"traffic":"clear"},{"id":"edge_73","source":"loc_abids","target":"loc_afzalgunj","name":"Abids to Nayapul High Road","distance":1.89,"base_time":2.83,"traffic":"clear"},{"id":"edge_74","source":"loc_koti","target":"loc_afzalgunj","name":"Koti Sultan Bazaar to Osmania Gate","distance":1.38,"base_time":2.07,"traffic":"clear"},{"id":"edge_75","source":"loc_afzalgunj","target":"loc_highcourt","name":"Nayapul Bridge over Musi River","distance":1.15,"base_time":1.72,"traffic":"clear"},{"id":"edge_76","source":"loc_highcourt","target":"loc_charminar","name":"High Court to Charminar Historic Corridor","distance":0.81,"base_time":1.39,"traffic":"clear"},{"id":"edge_77","source":"loc_charminar","target":"loc_falaknuma","name":"Charminar to Engine Bowli & Falaknuma","distance":3.37,"base_time":5.78,"traffic":"clear"},{"id":"edge_78","source":"loc_falaknuma","target":"loc_chandrayangutta","name":"Falaknuma to Chandrayangutta Ring Road","distance":2.25,"base_time":3.0,"traffic":"clear"},{"id":"edge_79","source":"loc_chandrayangutta","target":"loc_santoshnagar","name":"Inner Ring Road - Chandrayangutta to Santoshnagar","distance":2.92,"base_time":3.5,"traffic":"clear"},{"id":"edge_80","source":"loc_santoshnagar","target":"loc_malakpet","name":"Santoshnagar to Saidabad & Malakpet","distance":3.07,"base_time":4.09,"traffic":"clear"},{"id":"edge_81","source":"loc_santoshnagar","target":"loc_lbnagar","name":"Inner Ring Road - Santoshnagar to LB Nagar","distance":4.67,"base_time":5.09,"traffic":"clear"},{"id":"edge_82","source":"loc_highcourt","target":"loc_attapur","name":"Puranapul to Attapur River Road","distance":3.5,"base_time":4.67,"traffic":"clear"},{"id":"edge_83","source":"loc_punjagutta","target":"loc_begumpet","name":"Punjagutta to Begumpet Flyover Road","distance":2.99,"base_time":3.99,"traffic":"clear"},{"id":"edge_84","source":"loc_begumpet","target":"loc_paradise","name":"Sardar Patel Road - Begumpet to Paradise Circle","distance":1.39,"base_time":1.67,"traffic":"clear"},{"id":"edge_85","source":"loc_paradise","target":"loc_secunderabad","name":"Sardar Patel Road - Paradise to Secunderabad Station","distance":1.62,"base_time":2.16,"traffic":"clear"},{"id":"edge_86","source":"loc_secunderabad","target":"loc_sangeet","name":"Secunderabad Station to Sangeet X Roads","distance":0.86,"base_time":1.15,"traffic":"clear"},{"id":"edge_87","source":"loc_sangeet","target":"loc_mettuguda","name":"Sangeet Junction to Mettuguda Metro","distance":1.42,"base_time":1.89,"traffic":"clear"},{"id":"edge_88","source":"loc_sangeet","target":"loc_marredpally","name":"Sangeet Junction to Marredpally Corridor","distance":1.24,"base_time":1.65,"traffic":"clear"},{"id":"edge_89","source":"loc_marredpally","target":"loc_malkajgiri","name":"Marredpally to Malkajgiri Link","distance":2.44,"base_time":3.66,"traffic":"clear"},{"id":"edge_90","source":"loc_paradise","target":"loc_bowenpally","name":"Bowenpally Road via Tadbund Junction","distance":3.95,"base_time":5.27,"traffic":"clear"},{"id":"edge_91","source":"loc_bowenpally","target":"loc_suchitra","name":"NH-44 Bowenpally to Suchitra Circle","distance":3.79,"base_time":4.13,"traffic":"clear"},{"id":"edge_92","source":"loc_suchitra","target":"loc_kompally","name":"NH-44 Suchitra Circle to Kompally Cineplanet","distance":2.89,"base_time":2.89,"traffic":"clear"},{"id":"edge_93","source":"loc_bowenpally","target":"loc_balanagar","name":"Bowenpally to Balanagar Ferozguda Link","distance":3.98,"base_time":5.31,"traffic":"clear"},{"id":"edge_94","source":"loc_balanagar","target":"loc_jeedimetla","name":"Balanagar to Jeedimetla Industrial Road","distance":4.18,"base_time":5.57,"traffic":"clear"},{"id":"edge_95","source":"loc_jeedimetla","target":"loc_suchitra","name":"Jeedimetla to Suchitra Circle","distance":3.52,"base_time":4.69,"traffic":"clear"},{"id":"edge_96","source":"loc_kukatpally_y","target":"loc_balanagar","name":"Kukatpally Y-Junction to Balanagar X Roads","distance":3.49,"base_time":4.65,"traffic":"clear"},{"id":"edge_97","source":"loc_khairatabad","target":"loc_tankbund","name":"PVNR Marg (Necklace Road) Hussain Sagar West","distance":1.57,"base_time":2.09,"traffic":"clear"},{"id":"edge_98","source":"loc_tankbund","target":"loc_kavadiguda","name":"Lower Tank Bund Road","distance":1.59,"base_time":2.12,"traffic":"clear"},{"id":"edge_99","source":"loc_kavadiguda","target":"loc_chikkadpally","name":"Kavadiguda to RTC X Roads","distance":1.58,"base_time":2.37,"traffic":"clear"},{"id":"edge_100","source":"loc_chikkadpally","target":"loc_musheerabad","name":"RTC X Roads to Musheerabad Gandhi Hospital","distance":2.29,"base_time":3.05,"traffic":"clear"},{"id":"edge_101","source":"loc_musheerabad","target":"loc_secunderabad","name":"Musheerabad to Secunderabad Station Road","distance":1.77,"base_time":2.36,"traffic":"clear"},{"id":"edge_102","source":"loc_tankbund","target":"loc_begumpet","name":"Minister Road - Tank Bund to Begumpet","distance":3.68,"base_time":4.91,"traffic":"clear"},{"id":"edge_103","source":"loc_chikkadpally","target":"loc_koti","name":"Barkatpura to Koti Sultan Bazaar","distance":2.43,"base_time":3.65,"traffic":"clear"},{"id":"edge_104","source":"loc_mettuguda","target":"loc_tarnaka","name":"Mettuguda to Tarnaka Flyover Road","distance":1.94,"base_time":2.33,"traffic":"clear"},{"id":"edge_105","source":"loc_tarnaka","target":"loc_osmania_univ","name":"Tarnaka to Osmania University Campus Road","distance":2.07,"base_time":3.1,"traffic":"clear"},{"id":"edge_106","source":"loc_osmania_univ","target":"loc_amberpet","name":"Vidyanagar to Amberpet Main Road","distance":3.05,"base_time":4.58,"traffic":"clear"},{"id":"edge_107","source":"loc_amberpet","target":"loc_koti","name":"Amberpet to Nimboliadda & Koti","distance":2.92,"base_time":4.38,"traffic":"clear"},{"id":"edge_108","source":"loc_amberpet","target":"loc_ramanthapur","name":"Amberpet to Ramanthapur Road","distance":2.9,"base_time":3.87,"traffic":"clear"},{"id":"edge_109","source":"loc_ramanthapur","target":"loc_uppal","name":"Ramanthapur to Uppal Cross Roads","distance":2.3,"base_time":3.07,"traffic":"clear"},{"id":"edge_110","source":"loc_tarnaka","target":"loc_habsiguda","name":"Tarnaka to Habsiguda Metro Corridor","distance":2.31,"base_time":2.77,"traffic":"clear"},{"id":"edge_111","source":"loc_habsiguda","target":"loc_uppal","name":"Habsiguda to Uppal Ring Road","distance":1.54,"base_time":1.85,"traffic":"clear"},{"id":"edge_112","source":"loc_uppal","target":"loc_nagole","name":"Inner Ring Road - Uppal to Nagole Bridge","distance":3.0,"base_time":3.27,"traffic":"clear"},{"id":"edge_113","source":"loc_nagole","target":"loc_lbnagar","name":"Inner Ring Road - Nagole to LB Nagar Junction","distance":3.12,"base_time":3.4,"traffic":"clear"},{"id":"edge_114","source":"loc_nagole","target":"loc_dilsukhnagar","name":"Nagole to Kothapet & Dilsukhnagar Link","distance":3.81,"base_time":5.08,"traffic":"clear"},{"id":"edge_115","source":"loc_tarnaka","target":"loc_moula_ali","name":"Tarnaka to Lalaguda & Moula Ali","distance":4.07,"base_time":5.43,"traffic":"clear"},{"id":"edge_116","source":"loc_moula_ali","target":"loc_ecil","name":"Moula Ali to ECIL X Roads","distance":1.4,"base_time":1.87,"traffic":"clear"},{"id":"edge_117","source":"loc_ecil","target":"loc_sainikpuri","name":"ECIL to Sainikpuri Cross Roads","distance":2.91,"base_time":3.88,"traffic":"clear"},{"id":"edge_118","source":"loc_sainikpuri","target":"loc_neredmet","name":"Sainikpuri to Neredmet Cross Roads","distance":2.12,"base_time":2.83,"traffic":"clear"},{"id":"edge_119","source":"loc_neredmet","target":"loc_malkajgiri","name":"Neredmet to Malkajgiri Station Road","distance":3.24,"base_time":4.32,"traffic":"clear"},{"id":"edge_120","source":"loc_malkajgiri","target":"loc_mettuguda","name":"Malkajgiri to Mettuguda Link Road","distance":2.01,"base_time":3.01,"traffic":"clear"},{"id":"edge_121","source":"loc_habsiguda","target":"loc_nacharam","name":"Habsiguda to Nacharam Industrial Road","distance":3.02,"base_time":4.03,"traffic":"clear"},{"id":"edge_122","source":"loc_nacharam","target":"loc_ecil","name":"Nacharam to ECIL Industrial Corridor","distance":3.6,"base_time":4.8,"traffic":"clear"},{"id":"edge_hosp_hosp_osmania","source":"hosp_osmania","target":"loc_afzalgunj","name":"Access Road to Osmania General Hospital","distance":0.14,"base_time":0.3,"traffic":"clear"},{"id":"edge_hosp_hosp_gandhi","source":"hosp_gandhi","target":"loc_musheerabad","name":"Access Road to Gandhi Hospital","distance":0.15,"base_time":0.3,"traffic":"clear"},{"id":"edge_hosp_hosp_nims","source":"hosp_nims","target":"loc_punjagutta","name":"Access Road to Nizam's Institute of Medical Sciences (NIMS)","distance":0.23,"base_time":0.39,"traffic":"clear"},{"id":"edge_hosp_hosp_apollo_jubilee","source":"hosp_apollo_jubilee","target":"loc_film_nagar","name":"Access Road to Apollo Hospitals Jubilee Hills","distance":0.78,"base_time":1.34,"traffic":"clear"},{"id":"edge_hosp_hosp_aig","source":"hosp_aig","target":"loc_gachibowli","name":"Access Road to AIG Hospitals Gachibowli","distance":0.6,"base_time":1.03,"traffic":"clear"},{"id":"edge_hosp_hosp_continental","source":"hosp_continental","target":"loc_financial_dist","name":"Access Road to Continental Hospitals","distance":0.26,"base_time":0.45,"traffic":"clear"},{"id":"edge_hosp_hosp_yashoda_sec","source":"hosp_yashoda_sec","target":"loc_secunderabad","name":"Access Road to Yashoda Hospitals Secunderabad","distance":0.37,"base_time":0.63,"traffic":"clear"},{"id":"edge_hosp_hosp_yashoda_som","source":"hosp_yashoda_som","target":"loc_somajiguda","name":"Access Road to Yashoda Hospitals Somajiguda","distance":0.15,"base_time":0.3,"traffic":"clear"},{"id":"edge_hosp_hosp_yashoda_malakpet","source":"hosp_yashoda_malakpet","target":"loc_malakpet","name":"Access Road to Yashoda Hospitals Malakpet","distance":0.15,"base_time":0.3,"traffic":"clear"},{"id":"edge_hosp_hosp_care_banjara","source":"hosp_care_banjara","target":"loc_banjara_hills","name":"Access Road to CARE Hospitals Banjara Hills","distance":1.42,"base_time":2.43,"traffic":"clear"},{"id":"edge_hosp_hosp_care_hitech","source":"hosp_care_hitech","target":"loc_gachibowli","name":"Access Road to CARE Hospitals Hitech City","distance":1.05,"base_time":1.8,"traffic":"clear"},{"id":"edge_hosp_hosp_medicover_madhapur","source":"hosp_medicover_madhapur","target":"loc_madhapur","name":"Access Road to Medicover Hospitals Madhapur","distance":1.29,"base_time":2.21,"traffic":"clear"},{"id":"edge_hosp_hosp_kims_sec","source":"hosp_kims_sec","target":"loc_paradise","name":"Access Road to KIMS Hospitals Secunderabad","distance":0.97,"base_time":1.66,"traffic":"clear"},{"id":"edge_hosp_hosp_sunshine_sec","source":"hosp_sunshine_sec","target":"loc_paradise","name":"Access Road to Sunshine Hospitals Secunderabad","distance":0.29,"base_time":0.5,"traffic":"clear"},{"id":"edge_hosp_hosp_slg_bachupally","source":"hosp_slg_bachupally","target":"loc_bachupally","name":"Access Road to SLG Hospitals Bachupally","distance":0.27,"base_time":0.46,"traffic":"clear"},{"id":"edge_hosp_hosp_kamineni_lbnagar","source":"hosp_kamineni_lbnagar","target":"loc_lbnagar","name":"Access Road to Kamineni Hospitals LB Nagar","distance":0.17,"base_time":0.3,"traffic":"clear"},{"id":"edge_hosp_hosp_omni_kothapet","source":"hosp_omni_kothapet","target":"loc_kothapet","name":"Access Road to Omni Hospitals Kothapet","distance":0.4,"base_time":0.69,"traffic":"clear"},{"id":"edge_hosp_hosp_citizens_nallagandla","source":"hosp_citizens_nallagandla","target":"loc_nallagandla","name":"Access Road to Citizens Specialty Hospital","distance":0.31,"base_time":0.53,"traffic":"clear"},{"id":"edge_hosp_hosp_aster_ameerpet","source":"hosp_aster_ameerpet","target":"loc_ameerpet","name":"Access Road to Aster Prime Hospital","distance":0.14,"base_time":0.3,"traffic":"clear"},{"id":"edge_hosp_hosp_olive_mehdipatnam","source":"hosp_olive_mehdipatnam","target":"loc_mehdipatnam","name":"Access Road to Olive Hospital Mehdipatnam","distance":0.59,"base_time":1.01,"traffic":"clear"},{"id":"edge_hosp_hosp_princess_esra","source":"hosp_princess_esra","target":"loc_charminar","name":"Access Road to Princess Esra Hospital","distance":0.39,"base_time":0.67,"traffic":"clear"},{"id":"edge_hosp_hosp_gleneagles","source":"hosp_gleneagles","target":"loc_lakdikapul","name":"Access Road to Gleneagles Global Hospital","distance":0.12,"base_time":0.3,"traffic":"clear"},{"id":"edge_hosp_hosp_fernandez","source":"hosp_fernandez","target":"loc_abids","name":"Access Road to Fernandez Hospital","distance":0.37,"base_time":0.63,"traffic":"clear"},{"id":"edge_hosp_hosp_apollo_drdo","source":"hosp_apollo_drdo","target":"loc_santoshnagar","name":"Access Road to Apollo DRDO Hospital","distance":1.14,"base_time":1.95,"traffic":"clear"},{"id":"edge_hosp_hosp_tx_uppal","source":"hosp_tx_uppal","target":"loc_uppal","name":"Access Road to TX Hospitals Uppal","distance":0.17,"base_time":0.3,"traffic":"clear"},{"id":"edge_hosp_hosp_rush_kompally","source":"hosp_rush_kompally","target":"loc_suchitra","name":"Access Road to Rush Hospitals Kompally","distance":0.72,"base_time":1.23,"traffic":"clear"},{"id":"edge_amb_central","source":"amb_central_hyderabad","target":"loc_lakdikapul","name":"Emergency Depot Slip Road to Lakdikapul","distance":0.2,"base_time":0.4,"traffic":"clear"}],"traffic_levels":["clear","light","moderate","heavy","severe"],"areas":[{"id":"loc_abids","area":"Abids","name":"Abids GPO Circle","lat":17.392,"lng":78.478,"details":"Historic Central Business District"},{"id":"loc_afzalgunj","area":"Afzal Gunj","name":"Afzal Gunj Nayapul Bridge","lat":17.375,"lng":78.479,"details":"Osmania General Hospital Main Approach"},{"id":"loc_amberpet","area":"Amberpet","name":"Amberpet Ali Cafe X Roads","lat":17.388,"lng":78.514,"details":"Central-East Connector Road"},{"id":"loc_ameerpet","area":"Ameerpet","name":"Ameerpet Metro Interchange","lat":17.4375,"lng":78.4483,"details":"Major Twin-Line Transit Hub"},{"id":"loc_aramghar","area":"Aramghar","name":"Aramghar Junction","lat":17.321,"lng":78.434,"details":"NH-44 & PVNR Expressway South Terminal"},{"id":"loc_attapur","area":"Attapur","name":"Attapur Pillar 143","lat":17.368,"lng":78.438,"details":"PVNR Expressway & Hyderguda Link"},{"id":"loc_bachupally","area":"Bachupally","name":"Bachupally X Roads","lat":17.527,"lng":78.368,"details":"Nizampet-Bachupally Medical Corridor"},{"id":"loc_balanagar","area":"Balanagar","name":"Balanagar Cross Roads","lat":17.472,"lng":78.448,"details":"Industrial Area Main Interchange"},{"id":"loc_banjara_hills","area":"Banjara Hills","name":"Banjara Hills Road No. 1","lat":17.4156,"lng":78.4352,"details":"Taj Krishna & Healthcare Corridor"},{"id":"loc_begumpet","area":"Begumpet","name":"Begumpet Flyover","lat":17.444,"lng":78.474,"details":"Old Airport Road & Lifestyle Building"},{"id":"orr_bongloor","area":"Bongloor","name":"ORR Exit 12 - Bongloor","lat":17.275,"lng":78.548,"details":"Outer Ring Road Nagarjuna Sagar Highway Exit"},{"id":"loc_bowenpally","area":"Bowenpally","name":"Bowenpally Checkpost","lat":17.478,"lng":78.485,"details":"NH-44 Nagpur Highway Starting Point"},{"id":"loc_chandrayangutta","area":"Chandrayangutta","name":"Chandrayangutta X Roads","lat":17.329,"lng":78.489,"details":"Inner Ring Road South Sector"},{"id":"loc_charminar","area":"Charminar","name":"Charminar Historic Plaza","lat":17.3616,"lng":78.4747,"details":"Old City Center & Mecca Masjid"},{"id":"loc_chikkadpally","area":"Chikkadpally","name":"RTC X Roads Chikkadpally","lat":17.404,"lng":78.498,"details":"Theatres Hub & Indira Park Link"},{"id":"loc_dilsukhnagar","area":"Dilsukhnagar","name":"Dilsukhnagar Bus Depot","lat":17.3688,"lng":78.5247,"details":"Metro Station & High Density Commercial Street"},{"id":"orr_dundigal","area":"Dundigal","name":"ORR Exit 5 - Dundigal / Bachupally","lat":17.552,"lng":78.388,"details":"Outer Ring Road Mallampet & Bachupally Exit"},{"id":"loc_ecil","area":"ECIL","name":"ECIL Cross Roads","lat":17.468,"lng":78.568,"details":"Radhika Theatre & Electronics Complex"},{"id":"loc_erragadda","area":"Erragadda","name":"Erragadda ESI Metro","lat":17.453,"lng":78.439,"details":"ESI Hospital & Sanath Nagar Link"},{"id":"loc_falaknuma","area":"Falaknuma","name":"Falaknuma Palace Gate","lat":17.332,"lng":78.468,"details":"Engine Bowli & South City Link"},{"id":"loc_film_nagar","area":"Film Nagar","name":"Film Nagar Cultural Center","lat":17.412,"lng":78.406,"details":"Apollo Hospital South Approach"},{"id":"loc_financial_dist","area":"Financial District","name":"Financial District","lat":17.418,"lng":78.342,"details":"WaveRock & IT SEZ Hub"},{"id":"loc_gachibowli","area":"Gachibowli","name":"Gachibowli Junction","lat":17.4399,"lng":78.3614,"details":"Bio-Diversity & Outer Ring Road Interchange"},{"id":"orr_ghatkesar","area":"Ghatkesar","name":"ORR Exit 9 - Ghatkesar / Medipally","lat":17.428,"lng":78.632,"details":"Outer Ring Road Warangal Highway Exit"},{"id":"loc_habsiguda","area":"Habsiguda","name":"Habsiguda Street No. 8","lat":17.415,"lng":78.555,"details":"CCMB & NGRI Research Institute Link"},{"id":"loc_hayathnagar","area":"Hayathnagar","name":"Hayathnagar RTC Depot","lat":17.324,"lng":78.608,"details":"NH-65 Vijayawada Highway Exit"},{"id":"loc_highcourt","area":"High Court","name":"High Court City College","lat":17.368,"lng":78.471,"details":"Musi River South Bank"},{"id":"loc_hitech_city","area":"Hitech City","name":"Hitech City Cyber Towers","lat":17.4504,"lng":78.3808,"details":"Cyber Towers Core Intersection"},{"id":"loc_jeedimetla","area":"Jeedimetla","name":"Jeedimetla Industrial Area","lat":17.509,"lng":78.455,"details":"Subhash Nagar & Shapoor Nagar Link"},{"id":"loc_jubilee_hills","area":"Jubilee Hills","name":"Jubilee Hills Checkpost","lat":17.43,"lng":78.411,"details":"Peddamma Temple & Road 36 Interchange"},{"id":"loc_kavadiguda","area":"Kavadiguda","name":"Kavadiguda Lower Tank Bund","lat":17.416,"lng":78.49,"details":"CBR & Secretariat North Gate"},{"id":"orr_keesara","area":"Keesara","name":"ORR Exit 8 - Keesara","lat":17.512,"lng":78.605,"details":"Outer Ring Road North-East Corridor"},{"id":"loc_khairatabad","area":"Khairatabad","name":"Khairatabad RTA Circle","lat":17.4116,"lng":78.4612,"details":"Lake Perimeter & Flyover"},{"id":"loc_kompally","area":"Kompally","name":"Kompally Cineplanet","lat":17.538,"lng":78.487,"details":"North Hyderabad Highway Gateway"},{"id":"loc_kondapur","area":"Kondapur","name":"Kondapur Kothaguda Junction","lat":17.461,"lng":78.367,"details":"Botanical Garden & HITEC-Kondapur Junction"},{"id":"loc_kothapet","area":"Kothapet","name":"Kothapet Fruit Market","lat":17.361,"lng":78.542,"details":"Chaitanyapuri & Omni Hospital Cross"},{"id":"loc_koti","area":"Koti","name":"Koti Women's College X Roads","lat":17.385,"lng":78.4867,"details":"Sultan Bazaar & Medical Row"},{"id":"loc_kukatpally","area":"Kukatpally","name":"Kukatpally KPHB Colony","lat":17.4947,"lng":78.3912,"details":"JNTU & KPHB Metro Arterial"},{"id":"loc_lbnagar","area":"LB Nagar","name":"LB Nagar Ring Road Junction","lat":17.348,"lng":78.552,"details":"Inner Ring Road & NH-65 Southern Gateway"},{"id":"loc_lakdikapul","area":"Lakdikapul","name":"Lakdikapul Metro Junction","lat":17.4045,"lng":78.464,"details":"Collectorate & Assembly Corridor"},{"id":"loc_madhapur","area":"Madhapur","name":"Madhapur Mindspace","lat":17.4334,"lng":78.3866,"details":"Mindspace IT Park & Inorbit Mall Corridor"},{"id":"loc_malakpet","area":"Malakpet","name":"Malakpet Super Bazaar","lat":17.375,"lng":78.502,"details":"NH-65 & Yashoda Malakpet Link"},{"id":"loc_malkajgiri","area":"Malkajgiri","name":"Malkajgiri Anandbagh","lat":17.452,"lng":78.535,"details":"Malkajgiri Station & Vani Nagar Link"},{"id":"loc_marredpally","area":"Marredpally","name":"Marredpally East","lat":17.452,"lng":78.512,"details":"Cantonment High-Speed Arterial"},{"id":"orr_medchal","area":"Medchal","name":"ORR Exit 6 - Medchal / Kandlakoya","lat":17.585,"lng":78.489,"details":"Outer Ring Road NH-44 North Toll Plaza"},{"id":"loc_mehdipatnam","area":"Mehdipatnam","name":"Mehdipatnam Rethi Bowli","lat":17.392,"lng":78.441,"details":"Bus Terminal & PVNR Expressway Entry"},{"id":"loc_mettuguda","area":"Mettuguda","name":"Mettuguda Metro Rail Nilayam","lat":17.438,"lng":78.523,"details":"South Central Railway HQ"},{"id":"loc_miyapur","area":"Miyapur","name":"Miyapur Allwyn X Roads","lat":17.4968,"lng":78.3546,"details":"Miyapur Metro Terminal & NH-65 Junction"},{"id":"loc_moosapet","area":"Moosapet","name":"Moosapet Metro Junction","lat":17.464,"lng":78.432,"details":"NH-65 Commercial Corridor"},{"id":"loc_moula_ali","area":"Moula Ali","name":"Moula Ali Kaman","lat":17.458,"lng":78.56,"details":"Railway Goods Shed & Dargah"},{"id":"loc_musheerabad","area":"Musheerabad","name":"Musheerabad Gandhi Gate","lat":17.424,"lng":78.503,"details":"Gandhi Medical College & Hospital Entry"},{"id":"loc_nacharam","area":"Nacharam","name":"Nacharam Industrial Area","lat":17.436,"lng":78.573,"details":"Mallapur & HMT Nagar Link"},{"id":"loc_nagole","area":"Nagole","name":"Nagole Metro Station","lat":17.375,"lng":78.56,"details":"Inner Ring Road & Musi River Bridge"},{"id":"loc_nallagandla","area":"Nallagandla","name":"Nallagandla Flyover","lat":17.472,"lng":78.307,"details":"Tellapur & BHEL Corridor"},{"id":"loc_nampally","area":"Nampally","name":"Nampally Station Road","lat":17.3916,"lng":78.472,"details":"Railway Station & Exhibition Grounds"},{"id":"loc_neredmet","area":"Neredmet","name":"Neredmet Cross Roads","lat":17.481,"lng":78.538,"details":"Safilguda Lake & Ramakrishnapuram Link"},{"id":"loc_osmania_univ","area":"Osmania University","name":"Osmania University Campus","lat":17.412,"lng":78.528,"details":"Arts College & Vidyanagar Link"},{"id":"loc_paradise","area":"Paradise","name":"Paradise Circle","lat":17.4425,"lng":78.487,"details":"MG Road & Sardar Patel Road Hub"},{"id":"orr_patancheru","area":"Patancheru","name":"ORR Exit 3 - Patancheru","lat":17.515,"lng":78.268,"details":"Outer Ring Road NH-65 Mumbai Tollway"},{"id":"orr_pedda_amberpet","area":"Pedda Amberpet","name":"ORR Exit 11 - Pedda Amberpet","lat":17.322,"lng":78.618,"details":"Outer Ring Road NH-65 Vijayawada Exit"},{"id":"loc_punjagutta","area":"Punjagutta","name":"Punjagutta Center","lat":17.426,"lng":78.453,"details":"Nagarjuna Circle & Central Mall Flyover"},{"id":"loc_raidurgam","area":"Raidurgam","name":"Raidurgam Knowledge City","lat":17.425,"lng":78.377,"details":"T-Hub, IKEA & Durgam Cheruvu Cable Bridge"},{"id":"loc_rajendranagar","area":"Rajendranagar","name":"Rajendranagar Agriculture Campus","lat":17.319,"lng":78.41,"details":"Outer Ring Road South Connector"},{"id":"loc_ramanthapur","area":"Ramanthapur","name":"Ramanthapur Polytechnic","lat":17.392,"lng":78.541,"details":"TV Studio & Amberpet Link Road"},{"id":"loc_sr_nagar","area":"SR Nagar","name":"SR Nagar Junction","lat":17.444,"lng":78.443,"details":"Commercial Arterial Corridor"},{"id":"loc_sainikpuri","area":"Sainikpuri","name":"Sainikpuri Cross Roads","lat":17.491,"lng":78.555,"details":"Defence Colony & Yapral Corridor"},{"id":"loc_santoshnagar","area":"Santoshnagar","name":"Santoshnagar DRDO Junction","lat":17.348,"lng":78.508,"details":"Defence Laboratories Corridor"},{"id":"loc_secunderabad","area":"Secunderabad","name":"Secunderabad Clock Tower","lat":17.4399,"lng":78.502,"details":"Secunderabad Railway Station Gateway"},{"id":"loc_shaikpet","area":"Shaikpet","name":"Shaikpet Dargah Flyover","lat":17.408,"lng":78.388,"details":"Seven Tombs & Gachibowli Flyover"},{"id":"loc_shamshabad","area":"Shamshabad","name":"Shamshabad Airport Interchange","lat":17.245,"lng":78.432,"details":"Rajiv Gandhi International Airport (RGIA) Gateway"},{"id":"loc_somajiguda","area":"Somajiguda","name":"Somajiguda Raj Bhavan Road","lat":17.421,"lng":78.458,"details":"Governor Residence & Healthcare Row"},{"id":"loc_suchitra","area":"Suchitra","name":"Suchitra Circle","lat":17.512,"lng":78.488,"details":"Quthbullapur & NH-44 Crossing"},{"id":"loc_tankbund","area":"Tank Bund","name":"Tank Bund PVNR Marg","lat":17.411,"lng":78.476,"details":"Hussain Sagar Lake Driveway"},{"id":"loc_tarnaka","area":"Tarnaka","name":"Tarnaka Flyover Junction","lat":17.428,"lng":78.538,"details":"Nagarjuna Sagar & University Entrance"},{"id":"orr_tellapur","area":"Tellapur","name":"ORR Exit 2B - Tellapur / Kollur","lat":17.475,"lng":78.291,"details":"Outer Ring Road West Tech Residential Hub"},{"id":"loc_tolichowki","area":"Tolichowki","name":"Tolichowki Flyover","lat":17.399,"lng":78.412,"details":"Golconda & Shaikpet Transit Link"},{"id":"loc_uppal","area":"Uppal","name":"Uppal Cross Roads","lat":17.402,"lng":78.56,"details":"Rajiv Gandhi Stadium & Warangal Highway Entry"},{"id":"loc_vanasthalipuram","area":"Vanasthalipuram","name":"Vanasthalipuram Complex","lat":17.336,"lng":78.572,"details":"Sushma Cross Roads"}]};

    function computeLocalDijkstraRoutes(sourceId, targetId) {
        const nodes = (graphData && graphData.nodes && graphData.nodes.length > 0) ? graphData.nodes : FALLBACK_GRAPH.nodes;
        const edges = (graphData && graphData.edges && graphData.edges.length > 0) ? graphData.edges : FALLBACK_GRAPH.edges;
        const nodeMap = {};
        nodes.forEach(n => { nodeMap[n.id] = n; });

        const mults = { clear: 1.0, light: 1.25, moderate: 1.6, heavy: 2.2, severe: 3.2 };

        function runDijkstra(penalties) {
            const adj = {};
            nodes.forEach(n => { adj[n.id] = []; });
            edges.forEach((e, idx) => {
                const m = mults[(e.traffic || 'clear').toLowerCase()] || 1.0;
                const pen = (penalties && penalties[idx]) || 1.0;
                const cost = e.base_time * m * pen;
                adj[e.source].push({ target: e.target, cost: cost, distance: e.distance, base_time: e.base_time * m, edge: e, edgeIndex: idx });
                adj[e.target].push({ target: e.source, cost: cost, distance: e.distance, base_time: e.base_time * m, edge: e, edgeIndex: idx });
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
                for (const item of neighbors) {
                    const alt = dist[curr.id] + item.cost;
                    if (alt < dist[item.target]) {
                        dist[item.target] = alt;
                        prev[item.target] = curr.id;
                        prevEdge[item.target] = item;
                        pq.push({ id: item.target, cost: alt });
                    }
                }
            }

            if (dist[targetId] === Infinity) return null;

            const path = [];
            const usedEdges = [];
            let curr = targetId;
            while (curr !== sourceId) {
                path.unshift(curr);
                const edgeItem = prevEdge[curr];
                usedEdges.unshift(edgeItem);
                curr = prev[curr];
            }
            path.unshift(sourceId);

            let totalDist = 0, totalRealTime = 0;
            const dirSteps = [];
            for (let i = 0; i < path.length - 1; i++) {
                const u = path[i], v = path[i+1];
                const item = usedEdges[i];
                const e = item.edge;
                totalDist += e.distance;
                totalRealTime += item.base_time;
                dirSteps.push({
                    step: i + 1,
                    instruction: 'Proceed along ' + e.name + ' toward ' + (nodeMap[v] ? nodeMap[v].name : v),
                    road_name: e.name,
                    distance_km: e.distance,
                    icon: i === 0 ? '🚑' : (i === path.length - 2 ? '🏥' : '⬆️')
                });
            }
            dirSteps.push({
                step: dirSteps.length + 1,
                instruction: 'Arrive at ' + (nodeMap[targetId] ? nodeMap[targetId].name : targetId) + '. Emergency patient handover bay.',
                road_name: 'Emergency Bay',
                distance_km: 0.0,
                icon: '🏥'
            });

            return {
                path: path,
                usedEdges: usedEdges,
                totalDistanceKm: Math.round(totalDist * 10) / 10,
                totalTimeMin: Math.round(totalRealTime * 10) / 10,
                directions: dirSteps
            };
        }

        const r1 = runDijkstra({});
        if (!r1) return { success: false, routes: [] };

        const penalties2 = {};
        r1.usedEdges.forEach(item => { penalties2[item.edgeIndex] = 3.5; });
        const r2 = runDijkstra(penalties2) || r1;

        const penalties3 = Object.assign({}, penalties2);
        r2.usedEdges.forEach(item => { penalties3[item.edgeIndex] = 4.5; });
        const r3 = runDijkstra(penalties3) || r2;

        function buildRouteObj(r, title, tag, trafficStatus) {
            return {
                title: title,
                tag: tag,
                total_time_min: r.totalTimeMin,
                total_distance_km: r.totalDistanceKm,
                traffic_delay_min: Math.round(Math.max(0, r.totalTimeMin * 0.15) * 10) / 10,
                traffic_status: trafficStatus,
                path: r.path,
                nodes: r.path.map(id => nodeMap[id] || { id: id, name: id, lat: 17.4, lng: 78.4 }),
                directions: r.directions
            };
        }

        const route1 = buildRouteObj(r1, 'Route 1: Primary Dijkstra Optimal Corridor', 'Fastest Route', 'Optimal Flow');
        const route2 = buildRouteObj(r2, 'Route 2: Secondary Arterial Bypass', 'Alternative 2', 'Moderate Flow');
        const route3 = buildRouteObj(r3, 'Route 3: Peripheral High-Capacity Bypass', 'Alternative 3', 'Expedited');

        return {
            success: true,
            best_route: route1,
            routes: [route1, route2, route3]
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

        // OpenStreetMap Tile Layer (Clean standard OSM, no API keys or watermarks)
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
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
            let data = null;
            try {
                const response = await fetch('/api/graph');
                if (response && response.ok) {
                    const resJson = await response.json();
                    if (resJson && resJson.success) {
                        data = resJson;
                    }
                }
            } catch (netErr) {
                console.warn('Backend API unavailable, using embedded Hyderabad network telemetry:', netErr);
            }

            if (!data && typeof FALLBACK_GRAPH !== 'undefined') {
                data = Object.assign({ success: true }, FALLBACK_GRAPH);
            }

            if (!data) {
                throw new Error('Failed to load Hyderabad network telemetry');
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
            let data = null;
            let url = `/api/routes?source=${sourceId}&target=${targetId}&k=3`;
            if (startNode && startNode.lat !== undefined && startNode.lng !== undefined) {
                url += `&source_lat=${startNode.lat}&source_lng=${startNode.lng}`;
            }

            try {
                const response = await fetch(url);
                if (response && response.ok) {
                    const resJson = await response.json();
                    if (resJson && resJson.success && resJson.routes && resJson.routes.length > 0) {
                        data = resJson;
                    }
                }
            } catch (netErr) {
                console.warn('Routing endpoint unreachable, calculating via client-side Dijkstra engine:', netErr);
            }

            if (!data && typeof computeLocalDijkstraRoutes === 'function') {
                data = computeLocalDijkstraRoutes(sourceId, targetId);
            }

            if (!data || !data.success || !data.routes || data.routes.length === 0) {
                throw new Error((data && data.error) || 'No route found to the selected hospital.');
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
