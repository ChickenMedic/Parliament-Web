import json
import re

with open(r'g:\8-wall-project\Parliament-Website\src\data\bills.json', 'r', encoding='utf-8') as f:
    bills = json.load(f)

for b in bills:
    raw_title = b['title']
    
    # Extract status
    status_match = re.search(r'Current status\s+(.*?)\s+(Last major stage|$)', raw_title, re.IGNORECASE)
    status = status_match.group(1).strip() if status_match else "In Progress"
    if "Royal assent" in status or "law" in status:
        status = "Passed (Royal Assent)"
        
    # Extract actual title
    # It often says "Short title\n<title>" or "An Act..."
    short_title_match = re.search(r'Short title\s+(.*?)\s+(S-\d+|C-\d+)', raw_title)
    if short_title_match:
        actual_title = short_title_match.group(1).strip()
    else:
        # Just grab the "An Act ..."
        act_match = re.search(r'(An Act.*?)(?=\n\n|\n[A-Z]-\d+|\Z)', raw_title, re.DOTALL)
        actual_title = act_match.group(1).replace('\n', ' ').strip() if act_match else b['number']
        
    b['desc'] = b['title'] # keep full for desc or AI breakdown
    b['title'] = actual_title
    b['status'] = status
    
    # Defaults for UI
    b['category'] = 'Social'
    b['lib'] = 'Awaiting Details'
    b['con'] = 'Awaiting Details'
    b['ndp'] = 'Awaiting Details'
    b['bloc'] = 'Awaiting Details'
    b['aiBreakdown'] = b['desc'][:200] + '...'

with open(r'g:\8-wall-project\Parliament-Website\src\data\bills.json', 'w', encoding='utf-8') as f:
    json.dump(bills, f, indent=2)

print("Bills cleaned.")
