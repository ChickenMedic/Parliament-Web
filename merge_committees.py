import json
import re

# Read the newly scraped committees
with open(r'g:\8-wall-project\Parliament-Website\src\data\committees.json', 'r', encoding='utf-8') as f:
    scraped = json.load(f)

# Mock data extracted from Committees.tsx
mock_data = {
  "FINA": {
    "desc": "Mandated to study and report on all matters relating to the mandate, management and operation of the Department of Finance and the Canada Revenue Agency.",
    "chairName": "Peter Fonseca",
    "viceChairs": ["Jasraj Hallan", "Gabriel Ste-Marie"],
    "members": ["Terry Beech", "Yvan Baker", "Adam Chambers", "Kelly McCauley", "Dan Mazier", "Heather McPherson", "Sukh Dhaliwal"],
    "studies": [{"title": "Pre-budget Consultations 2026", "topic": "Reviewing public submissions, municipal requests...", "meetingDate": "June 4, 2026", "youtubeUrl": ""}],
    "partySeats": { "Liberal": 5, "Conservative": 4, "Bloc": 1, "NDP": 1 }
  },
  "HESA": {
    "desc": "Oversees the work of Health Canada, Public Health Agency of Canada, and CIHR to study issues related to healthcare systems and health regulations.",
    "chairName": "Sean Casey",
    "viceChairs": ["Stephen Ellis", "Don Davies"],
    "members": ["Mark Holland", "Todd Doherty", "Stephen Fuhr", "Hedy Fry", "Rob Morrison", "Jenna Sudds", "Leah Gazan"],
    "studies": [{"title": "Evaluation of the National Pharmacare Rollout", "topic": "Assessing pharmaceutical coverage benchmarks...", "meetingDate": "June 5, 2026", "youtubeUrl": ""}],
    "partySeats": { "Liberal": 5, "Conservative": 4, "NDP": 1, "Bloc": 1 }
  },
  "FAAE": {
    "desc": "Studies bills, spending, and policies of Global Affairs Canada and monitors international development assistance programs.",
    "chairName": "Ali Ehsassi",
    "viceChairs": ["Michael Chong", "Simon-Pierre Savard-Tremblay"],
    "members": ["Mélanie Joly", "Garnett Genuis", "Taleeb Noormohamed", "Wayne Long", "John Barlow", "Ziad Aboultaif", "Heather McPherson"],
    "studies": [{"title": "Canada's Indo-Pacific Strategy Implementation", "topic": "Assessing trade expansion incentives...", "meetingDate": "June 8, 2026", "youtubeUrl": ""}],
    "partySeats": { "Liberal": 5, "Conservative": 4, "Bloc": 1, "NDP": 1 }
  },
  "NDDN": {
    "desc": "Focuses on the Department of National Defence and the Canadian Armed Forces, reviewing operations, defense policy, and military equipment.",
    "chairName": "John McKay",
    "viceChairs": ["James Bezan", "Christine Normandin"],
    "members": ["Bill Blair", "Alex Ruff", "Pat Kelly", "Terry Duguid", "Serge Cormier", "Marie-France Lalonde", "Lindsay Mathyssen"],
    "studies": [{"title": "Military Recruitment and Retention Strategies", "topic": "Addressing service member culture complaints...", "meetingDate": "June 9, 2026", "youtubeUrl": ""}],
    "partySeats": { "Liberal": 5, "Conservative": 4, "Bloc": 1, "NDP": 1 }
  },
  "PACP": {
    "desc": "The House oversight committee, chaired by an Opposition member, that reviews the reports of the Auditor General of Canada to ensure government accountability.",
    "chairName": "John Williamson",
    "viceChairs": ["Jean-Yves Duclos", "Nathalie Sinclair-Desgagné"],
    "members": ["Kelly Block", "Blake Richards", "Kody Blois", "Peter Fragiskatos", "Sonia Sidhu", "Brad Vis", "Jenny Kwan"],
    "studies": [{"title": "Review of the Auditor General's Report on the ArriveCAN App", "topic": "Investigating third-party subcontractor fees...", "meetingDate": "June 3, 2026", "youtubeUrl": ""}],
    "partySeats": { "Conservative": 5, "Liberal": 4, "Bloc": 1, "NDP": 1 }
  },
  "ENVI": {
    "desc": "Mandated to study and report on matters relating to the environment, sustainable development, climate change, and environmental enforcement.",
    "chairName": "Sophie Chatel",
    "viceChairs": ["Gérard Deltell", "Don Davies"],
    "members": ["Steven Guilbeault", "Patrick Weiler", "Francis Scarpaleggia", "Patrick Bonin", "Gord Johns", "Leah Gazan", "Marilyn Gladu"],
    "studies": [{"title": "Evaluating the Federal Carbon Pricing Mechanism", "topic": "Analyzing industrial emission outputs...", "meetingDate": "June 4, 2026", "youtubeUrl": ""}],
    "partySeats": { "Liberal": 5, "Conservative": 4, "Bloc": 1, "NDP": 1 }
  },
  "JUST": {
    "desc": "Mandated to oversee the Department of Justice, federal courts, criminal law, and human rights issues.",
    "chairName": "Lena Metlege Diab",
    "viceChairs": ["Frank Caputo", "Luc Thériault"],
    "members": ["Sameer Zuberi", "Anju Dhillon", "Michael Cooper", "Jenny Kwan", "Lori Idlout", "Chris Bittle", "Dan Albas"],
    "studies": [{"title": "Review of Sentencing and Bail Reform Legislation", "topic": "Assessing violent crime recidivism statistics...", "meetingDate": "June 5, 2026", "youtubeUrl": ""}],
    "partySeats": { "Liberal": 5, "Conservative": 4, "Bloc": 1, "NDP": 1 }
  },
  "RNNR": {
    "desc": "Mandated to study and report on matters relating to the mandate, management, and operation of the Department of Natural Resources.",
    "chairName": "Kody Blois",
    "viceChairs": ["Shannon Stubbs", "Mario Simard"],
    "members": ["Terry Beech", "Greg McLean", "Peter Fonseca", "Viviane Lapointe", "Heather McPherson", "Alex Ruff", "Mona Fortier"],
    "studies": [{"title": "Transitioning to Clean Energy Infrastructure", "topic": "Evaluating federal grid connection incentives...", "meetingDate": "June 8, 2026", "youtubeUrl": ""}],
    "partySeats": { "Liberal": 5, "Conservative": 4, "Bloc": 1, "NDP": 1 }
  },
  "ETHI": {
    "desc": "Reviews access to information, privacy commissioner reports, and conflict of interest issues involving public office holders.",
    "chairName": "Pat Kelly",
    "viceChairs": ["Mona Fortier", "Alexis Brunelle-Duceppe"],
    "members": ["Michael Barrett", "Iqra Khalid", "Gord Johns", "Yasir Naqvi", "Tom Kmiec", "Serge Cormier", "John Williamson"],
    "studies": [{"title": "Investigation into Federal Government Contracting and Conflict of Interest Guidelines", "topic": "Auditing procurement relationships...", "meetingDate": "June 3, 2026", "youtubeUrl": ""}],
    "partySeats": { "Conservative": 5, "Liberal": 4, "Bloc": 1, "NDP": 1 }
  }
}

full_committees = []
for c in scraped:
    full_c = {
        "id": c["abbr"],
        "name": c["name"],
        "url": c["url"]
    }
    
    if c["abbr"] in mock_data:
        full_c.update(mock_data[c["abbr"]])
    else:
        full_c.update({
            "desc": "Committee details and mandate information not yet fully processed.",
            "chairName": "TBD",
            "viceChairs": [],
            "members": [],
            "studies": [],
            "partySeats": { "Liberal": 5, "Conservative": 4, "Bloc": 1, "NDP": 1 }
        })
    full_committees.append(full_c)

# We should also ensure the mock ones are kept if they didn't get scraped (e.g. abbr mismatch)
scraped_abbrs = {c["abbr"] for c in scraped}
for m_id, m_data in mock_data.items():
    if m_id not in scraped_abbrs:
        full_c = {
            "id": m_id,
            "name": m_id + " Committee",
            "url": ""
        }
        full_c.update(m_data)
        full_committees.append(full_c)

with open(r'g:\8-wall-project\Parliament-Website\src\data\committees_full.json', 'w', encoding='utf-8') as f:
    json.dump(full_committees, f, indent=2)

print("Created committees_full.json")
