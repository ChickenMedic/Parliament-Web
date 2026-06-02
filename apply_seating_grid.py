import json
import re

def get_party_color(party):
    p = party.lower()
    if 'liberal' in p: return '#d71920'
    if 'conservative' in p: return '#1a4782'
    if 'ndp' in p: return '#f37021'
    if 'bloc' in p: return '#33b2cc'
    if 'green' in p: return '#3d9b35'
    return '#808080'

char_to_party = {
    'L': 'Liberal',
    'C': 'Conservative',
    'N': 'NDP',
    'B': 'Bloc Québécois',
    'G': 'Green',
    'I': 'Independent'
}

with open('seating_map.txt', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Extract all [X] tokens from the file in order
# But we need to distinguish Left and Right properly?
# Actually, the file lists Left first, then Right, for each row.
# But wait, our generation logic sorted left-to-right within the whole row anyway!
# So extracting all [X] sequentially per row matches the left-to-right order exactly.
map_chars = []
for line in lines:
    if line.startswith("Row"):
        # find all [X]
        matches = re.findall(r'\[([A-Z])\]', line)
        map_chars.extend(matches)

with open(r'g:\8-wall-project\Parliament-Website\src\data\seating.json', 'r', encoding='utf-8') as f:
    seats = json.load(f)

# Sort seats top-to-bottom, then left-to-right to match exactly
for s in seats:
    s['ry'] = s['x'] + 50
    s['rx'] = 356 - s['y'] - 20
    s['row_approx'] = round(s['ry'] / 10) * 10

seats.sort(key=lambda s: (s['row_approx'], s['rx']))

if len(map_chars) != len(seats):
    print(f"Error: Found {len(map_chars)} seats in map, but expected {len(seats)}.")
else:
    for i, s in enumerate(seats):
        party = char_to_party.get(map_chars[i], 'Independent')
        s['party'] = party
        s['color'] = get_party_color(party)
        
    # Clean up temp keys
    for s in seats:
        del s['ry']
        del s['rx']
        del s['row_approx']

    # We need to sort them back to original ID order? 
    # Actually seating.json order doesn't matter, but let's just save.
    with open(r'g:\8-wall-project\Parliament-Website\src\data\seating.json', 'w', encoding='utf-8') as f:
        json.dump(seats, f, indent=2)

    print("seating.json successfully updated from seating_map.txt")
