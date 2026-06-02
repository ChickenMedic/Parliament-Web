import urllib.request
import re
import json

html = urllib.request.urlopen('https://www.ourcommons.ca/members/en/floorplan?view=list').read().decode('utf-8')
seats = []
rows = re.findall(r'<tr.*?>(.*?)</tr>', html, re.DOTALL)
for r in rows:
    cols = re.findall(r'<td[^>]*>(.*?)</td>', r, re.DOTALL)
    if len(cols) >= 3:
        # cleanup inner html
        seat = re.sub(r'<[^>]*>', '', cols[0]).strip()
        mp = re.sub(r'<[^>]*>', '', cols[1]).strip()
        party = re.sub(r'<[^>]*>', '', cols[2]).strip()
        
        # fix html entities
        seat = seat.replace('&#x27;', "'").replace('\r\n', ' ').strip()
        seat = ' '.join(seat.split())
        mp = ' '.join(mp.split())
        
        seats.append({'seat': seat, 'mp': mp, 'party': party})

print(f'Found {len(seats)} seats')
with open('floorplan_list.json', 'w') as f:
    json.dump(seats, f, indent=2)
