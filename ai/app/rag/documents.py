"""
Discovery Uttarakhand - Curated RAG Knowledge Corpus
Strictly curated authoritative travel documents with metadata, sources, and trust levels.
"""
from typing import List, Dict, Any

KNOWLEDGE_CORPUS: List[Dict[str, Any]] = [
    {
        "documentId": "rag_vof_01",
        "title": "Valley of Flowers National Park & Trekking Guidelines",
        "location": "Valley of Flowers",
        "category": "Trek Guide",
        "trustLevel": "VERIFIED_OFFICIAL",
        "source": "Uttarakhand Forest Department & UNESCO World Heritage",
        "sourceUrl": "https://forest.uk.gov.in/valley-of-flowers",
        "lastUpdated": "2026-06-01",
        "content": (
            "Valley of Flowers is a UNESCO World Heritage Site located in Chamoli district. "
            "Best visiting window: Mid-July to early September when over 500 species of alpine flowers bloom. "
            "Gateway: Trek begins from Govindghat. Vehicles reach Pulna (4 km from Govindghat). From Pulna, trek 10 km to Ghangaria base camp. "
            "Ghangaria to Valley of Flowers is 3.5 km one-way. Night stay inside the Valley is strictly prohibited; all trekkers must exit by 5:00 PM. "
            "Permit fee: ₹150 for Indian nationals, ₹600 for foreigners, valid for 3 days. Entry gate opens at 7:00 AM."
        )
    },
    {
        "documentId": "rag_hemkund_02",
        "title": "Hemkund Sahib High-Altitude Pilgrimage Advisory",
        "location": "Hemkund Sahib",
        "category": "Spiritual Trek",
        "trustLevel": "VERIFIED_OFFICIAL",
        "source": "Hemkund Sahib Gurudwara Trust & SDMA",
        "sourceUrl": "https://hemkundsahib.org",
        "lastUpdated": "2026-05-20",
        "content": (
            "Sri Hemkund Sahib is situated at an elevation of 4,329 meters (14,200 ft). "
            "Base camp is Ghangaria. The trek from Ghangaria to Hemkund is 6 km with a steep gradient. "
            "Due to low oxygen levels at high altitude, visitors with respiratory or heart conditions must consult a doctor. "
            "Pony and helicopter services (Govindghat to Ghangaria) operate during the pilgrimage season (June to October). "
            "All pilgrims must descend back to Ghangaria before 2:00 PM to avoid hypothermia and mountain mist."
        )
    },
    {
        "documentId": "rag_char_dham_03",
        "title": "Char Dham Yatra Biometric Registration & Safety Protocol",
        "location": "Badrinath / Kedarnath / Gangotri / Yamunotri",
        "category": "Pilgrimage Regulations",
        "trustLevel": "VERIFIED_GOVERNMENT",
        "source": "Uttarakhand Tourism Development Board (UTDB)",
        "sourceUrl": "https://registrationandtouristcare.uk.gov.in",
        "lastUpdated": "2026-04-15",
        "content": (
            "Mandatory Registration: All pilgrims undertaking Char Dham or Do Dham yatra must register on the official portal "
            "registrationandtouristcare.uk.gov.in. QR code slips or Yatra wristbands must be scanned at verification checkpoints. "
            "Kedarnath route: Gaurikund to Kedarnath is a 16 km steep mountain trek. Medical fitness certificates are required for pilgrims over 55. "
            "Badrinath route: Accessible by road via NH-7 directly up to the temple complex. "
            "Daylight Transit Rule: Passenger vehicles are not permitted on ghat roads between 8:00 PM and 4:30 AM for safety."
        )
    },
    {
        "documentId": "rag_auli_04",
        "title": "Auli Skiing, Ropeway & Summer Meadow Advisory",
        "location": "Auli",
        "category": "Adventure & Winter Sports",
        "trustLevel": "VERIFIED_OFFICIAL",
        "source": "Garhwal Mandal Vikas Nigam (GMVN)",
        "sourceUrl": "https://gmvnonline.com",
        "lastUpdated": "2026-01-10",
        "content": (
            "Auli is India's premier skiing destination located at 2,800m elevation in Chamoli. "
            "Skiing season: Late December to early March. Summer meadow (bugyal) season: April to November. "
            "Joshimath-Auli Ropeway (Cable Car) spans 4 km and is one of the highest in Asia, taking 25 minutes. "
            "Spectacular 180-degree views of Nanda Devi, Kamet, and Mana Parvat. GMVN conducts certified skiing courses."
        )
    },
    {
        "documentId": "rag_chopta_05",
        "title": "Chopta, Tungnath & Chandrashila Trek Guidelines",
        "location": "Chopta",
        "category": "Trek & Temple",
        "trustLevel": "VERIFIED_OFFICIAL",
        "source": "Rudraprayag District Tourism Office",
        "sourceUrl": "https://rudraprayag.nic.in",
        "lastUpdated": "2026-05-12",
        "content": (
            "Chopta (2,680m) is known as the Mini Switzerland of Uttarakhand. "
            "Tungnath Temple (3,680m) is the highest Shiva shrine in the world and part of the Panch Kedar circuit. "
            "Trek distance: 3.5 km from Chopta to Tungnath (paved path), followed by 1.5 km further steep ascent to Chandrashila summit (4,000m). "
            "Total 5 km one-way. Suitable for beginners and families with moderate fitness. Camping is permitted only in designated meadows."
        )
    },
    {
        "documentId": "rag_nainital_lakes_06",
        "title": "Kumaon Lake Circuit: Nainital, Bhimtal, Naukuchiatal, Sattal",
        "location": "Nainital / Bhimtal",
        "category": "Lake Tourism & Ecology",
        "trustLevel": "VERIFIED_OFFICIAL",
        "source": "Kumaon Mandal Vikas Nigam (KMVN)",
        "sourceUrl": "https://kmvn.in",
        "lastUpdated": "2026-06-15",
        "content": (
            "The Kumaon Lake District encompasses Naini Lake, Bhimtal (largest lake with central island aquarium), "
            "Naukuchiatal (nine-cornered lake famous for paragliding and kayaking), and Sattal (interconnected freshwater lakes ideal for birdwatching). "
            "Boating rates are standardized by local boat clubs. Motorised water sports are prohibited on ecological grounds."
        )
    },
    {
        "documentId": "rag_cultural_etiquette_07",
        "title": "Uttarakhand Mountain Code of Conduct & Cultural Etiquette",
        "location": "Uttarakhand Wide",
        "category": "Responsible Travel",
        "trustLevel": "VERIFIED_OFFICIAL",
        "source": "Uttarakhand Tourism & Ecology Board",
        "sourceUrl": "https://uttarakhandtourism.gov.in",
        "lastUpdated": "2026-03-01",
        "content": (
            "1. Leave No Trace: Single-use plastics are legally banned across Himalayan pilgrimage and eco-sensitive zones. "
            "2. Modest Attire: Traditional dress is required when entering sanctum sanctorum of Himalayan shrines. Footwear and leather items must be left outside. "
            "3. Acclimatization: For altitudes above 3,000 meters, take an acclimatization rest day and stay well hydrated. Avoid alcohol at high altitude. "
            "4. Road Respect: Honk gently on blind mountain curves. Downhill traffic must give right of way to uphill vehicles."
        )
    }
]
