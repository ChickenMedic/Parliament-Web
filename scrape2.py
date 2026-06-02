import urllib.request
from bs4 import BeautifulSoup
import json
import csv
import os
import re

print("Starting scripts...")

# 2. Scrape Floorplan
floorplan_url = 'https://www.ourcommons.ca/members/en/floorplan?view=list'
print(f"Fetching {floorplan_url}...")
try:
    req = urllib.request.Request(floorplan_url, headers={'User-Agent': 'Mozilla/5.0'})
    html = urllib.request.urlopen(req).read().decode('utf-8')
    soup = BeautifulSoup(html, 'html.parser')
    
    seats = []
    for row in soup.find_all('tr'):
        cols = row.find_all('td')
        if len(cols) >= 3:
            seat_num = cols[0].text.strip().replace('\n', '').strip()
            mp_name = cols[1].text.strip().replace('\n', '').strip()
            party = cols[2].text.strip().replace('\n', '').strip()
            seats.append({"seat": seat_num, "mp": mp_name, "party": party})
    
    print(f"Parsed {len(seats)} seats from floorplan list.")
    with open('floorplan_list.json', 'w', encoding='utf-8') as f:
        json.dump(seats, f, indent=2, ensure_ascii=False)
except Exception as e:
    print("Error fetching floorplan:", e)

# 4. Scrape Bills
bills_url = 'https://www.parl.ca/legisinfo/en/bills'
print(f"Fetching {bills_url}...")
try:
    req = urllib.request.Request(bills_url, headers={'User-Agent': 'Mozilla/5.0'})
    html = urllib.request.urlopen(req).read().decode('utf-8')
    soup = BeautifulSoup(html, 'html.parser')
    
    bills = []
    # Find all links that look like a bill
    for a in soup.find_all('a', class_=re.compile('bill-tile-container')):
        url = a.get('href', '')
        if '/legisinfo/en/bill/' in url:
            # extract bill number from the url e.g. /legisinfo/en/bill/45-1/s-1
            num = url.split('/')[-1].upper()
            title_div = a.find('div', class_='bill-title')
            title = title_div.text.strip() if title_div else a.text.strip()
            bills.append({"number": num, "title": title, "url": f"https://www.parl.ca{url}"})
                
    # Deduplicate
    seen = set()
    dedup = []
    for b in bills:
        if b['number'] not in seen:
            seen.add(b['number'])
            dedup.append(b)
            
    print(f"Found {len(dedup)} bills.")
    with open(r"g:\8-wall-project\Parliament-Website\src\data\bills.json", 'w', encoding='utf-8') as f:
        json.dump(dedup, f, indent=2, ensure_ascii=False)
except Exception as e:
    print("Error fetching bills:", e)
