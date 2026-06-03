import json
import collections

def get_party_color(party):
    p = party.lower()
    if 'liberal' in p: return '#d71920'
    if 'conservative' in p: return '#1a4782'
    if 'ndp' in p: return '#f37021'
    if 'bloc' in p: return '#33b2cc'
    if 'green' in p: return '#3d9b35'
    if 'unoccupied' in p or 'vacant' in p: return 'url(#hatched-grey)' # Using pattern or just light grey if string not supported. 
    # Actually, in SeatingChart.tsx it uses `backgroundColor: fill`. We can use '#d3d3d3' for unoccupied.
    if p == 'unoccupied': return '#d3d3d3'
    return '#808080' # Independent/Other

with open(r'g:\8-wall-project\Parliament-Website\src\data\seating.json', 'r', encoding='utf-8') as f:
    seats = json.load(f)

for s in seats:
    s['ry'] = s['x'] + 50
    s['rx'] = 356 - s['y'] - 20
    s['row_approx'] = round(s['ry'] / 10) * 10

rows = collections.defaultdict(list)
for s in seats:
    rows[s['row_approx']].append(s)

sorted_row_keys = sorted(rows.keys())

# Let's populate the queues
gov_queue = ['Liberal'] * 174
opp_queue = ['Conservative'] * 140 + ['Bloc Québécois'] * 21 + ['NDP'] * 5 + ['Green'] * 1 + ['Independent'] * 2

for rk in sorted_row_keys:
    # Sort left-to-right within the row
    rows[rk].sort(key=lambda s: s['rx'])
    
    # Left side (rx < 178)
    left_seats = [s for s in rows[rk] if s['rx'] < 178]
    right_seats = [s for s in rows[rk] if s['rx'] >= 178]
    
    for s in left_seats:
        party = gov_queue.pop(0) if gov_queue else 'Unoccupied'
        s['party'] = party
        s['color'] = get_party_color(party)
        
    for s in right_seats:
        party = opp_queue.pop(0) if opp_queue else 'Unoccupied'
        s['party'] = party
        s['color'] = get_party_color(party)

# Cleanup
for s in seats:
    if 'ry' in s: del s['ry']
    if 'rx' in s: del s['rx']
    if 'row_approx' in s: del s['row_approx']

with open(r'g:\8-wall-project\Parliament-Website\src\data\seating.json', 'w', encoding='utf-8') as f:
    json.dump(seats, f, indent=2)

print("Successfully reassigned seats in seating.json.")
