import urllib.request
from bs4 import BeautifulSoup
import json
import csv
import os
import re

print("Starting scripts...")

# 1. Update roles.json
csv_path = r"C:\Users\Sam Dawson\.gemini\antigravity\brain\e3d6739a-ba96-44eb-a303-854162164faa\.system_generated\steps\1132\content.md"
roles_path = r"g:\8-wall-project\Parliament-Website\src\data\roles.json"

roles = {}
with open(csv_path, 'r', encoding='utf-8-sig') as f:
    lines = f.readlines()
    start_idx = 0
    for i, line in enumerate(lines):
        if line.startswith("Person ID") or line.startswith("\ufeffPerson ID"):
            start_idx = i
            break
            
    csv_lines = lines[start_idx:]
    reader = csv.DictReader(csv_lines)
    for row in reader:
        first = row.get("First Name", "").strip()
        last = row.get("Last Name", "").strip()
        title = row.get("Title", "").strip()
        if first and last and title:
            roles[f"{first} {last}"] = title

with open(roles_path, 'w', encoding='utf-8') as f:
    json.dump(roles, f, indent=2, ensure_ascii=False)
print(f"Updated {roles_path} with {len(roles)} roles.")

# 2. Scrape Floorplan
floorplan_url = 'https://www.ourcommons.ca/members/en/floorplan?view=list'
print(f"Fetching {floorplan_url}...")
try:
    req = urllib.request.Request(floorplan_url, headers={'User-Agent': 'Mozilla/5.0'})
    html = urllib.request.urlopen(req).read().decode('utf-8')
    soup = BeautifulSoup(html, 'html.parser')
    
    # Floorplan table typically has rows with Seat, Member, Party
    # We just want a list of parties in seat order.
    # Alternatively, we can find elements with party classes or text.
    # We will just parse the table.
    table = soup.find('table')
    seats = []
    if table:
        for row in table.find_all('tr')[1:]:
            cols = row.find_all('td')
            if len(cols) >= 3:
                seat_num = cols[0].text.strip()
                party = cols[2].text.strip()
                seats.append({"seat": seat_num, "party": party})
    
    print(f"Parsed {len(seats)} seats from floorplan list.")
    
    # Save a temporary floorplan list to inspect
    with open('floorplan_list.json', 'w') as f:
        json.dump(seats, f, indent=2)

except Exception as e:
    print("Error fetching floorplan:", e)

# 3. Scrape Committees
committees_url = 'https://www.ourcommons.ca/Committees/en/Home'
print(f"Fetching {committees_url}...")
try:
    req = urllib.request.Request(committees_url, headers={'User-Agent': 'Mozilla/5.0'})
    html = urllib.request.urlopen(req).read().decode('utf-8')
    soup = BeautifulSoup(html, 'html.parser')
    
    committees = []
    # Try to find committee links or lists
    for a in soup.find_all('a', href=True):
        href = a['href']
        if '/Committees/en/' in href and len(href.split('/')) > 4:
            abbr = href.split('/')[-1]
            name = a.text.strip()
            if name and len(name) > 5 and not name.lower() in ['home', 'contact', 'about']:
                committees.append({"name": name, "abbr": abbr, "url": f"https://www.ourcommons.ca{href}"})
    
    # Deduplicate by name
    seen = set()
    dedup = []
    for c in committees:
        if c['name'] not in seen:
            seen.add(c['name'])
            dedup.append(c)
            
    print(f"Found {len(dedup)} committees.")
    with open(r"g:\8-wall-project\Parliament-Website\src\data\committees.json", 'w', encoding='utf-8') as f:
        json.dump(dedup, f, indent=2, ensure_ascii=False)
except Exception as e:
    print("Error fetching committees:", e)

# 4. Scrape Bills
bills_url = 'https://www.parl.ca/legisinfo/en/bills'
print(f"Fetching {bills_url}...")
try:
    req = urllib.request.Request(bills_url, headers={'User-Agent': 'Mozilla/5.0'})
    html = urllib.request.urlopen(req).read().decode('utf-8')
    soup = BeautifulSoup(html, 'html.parser')
    
    bills = []
    # Bills might be in a list or div wrappers
    for bill_div in soup.find_all('div', class_=re.compile('bill-container|bill-row|col-12|row')):
        bill_num_el = bill_div.find(string=re.compile(r'^[C|S]-\d+$'))
        if bill_num_el:
            bill_num = bill_num_el.strip()
            # find title
            title_el = bill_div.find('a', href=re.compile(r'/legisinfo/en/bill/'))
            if title_el:
                title = title_el.text.strip()
                bills.append({"number": bill_num, "title": title})
                
    # If the above fails, let's just do a generic search for a tags
    if not bills:
        for a in soup.find_all('a', href=re.compile(r'/legisinfo/en/bill/')):
            text = a.text.strip()
            if text:
                bills.append({"title": text, "url": f"https://www.parl.ca{a['href']}"})
                
    print(f"Found {len(bills)} bills.")
    with open(r"g:\8-wall-project\Parliament-Website\src\data\bills.json", 'w', encoding='utf-8') as f:
        json.dump(bills, f, indent=2, ensure_ascii=False)
except Exception as e:
    print("Error fetching bills:", e)

