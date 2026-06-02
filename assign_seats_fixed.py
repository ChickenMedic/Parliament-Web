import json
import collections

def get_party_color(party):
    p = party.lower()
    if 'liberal' in p: return '#d71920'
    if 'conservative' in p: return '#1a4782'
    if 'ndp' in p: return '#f37021'
    if 'bloc' in p: return '#33b2cc'
    if 'green' in p: return '#3d9b35'
    return '#808080' # Independent/Other

with open('floorplan_list.json', 'r', encoding='utf-8') as f:
    floorplan = json.load(f)

valid_seats = [s for s in floorplan if 'clerk' not in s['mp'].lower() and 'vacant' not in s['mp'].lower()]

party_counts = collections.defaultdict(int)
for s in valid_seats:
    party_counts[s['party']] += 1

# Create standard flat lists of MPs for each side
# Government (Left side of screen)
lib_count = party_counts.get('Liberal', 0)
gov_queue = ['L'] * lib_count
# Some independents/others might overflow to government side if needed, but normally 156 Libs.

# Opposition (Right side of screen)
con_count = party_counts.get('Conservative', 0)
bloc_count = party_counts.get('Bloc Québécois', 0)
ndp_count = party_counts.get('NDP', 0)
green_count = party_counts.get('Green Party', 0) + party_counts.get('Green', 0)
ind_count = party_counts.get('Independent', 0)

opp_queue = ['C'] * con_count + ['B'] * bloc_count + ['N'] * ndp_count + ['G'] * green_count + ['I'] * ind_count

with open(r'g:\8-wall-project\Parliament-Website\src\data\seating.json', 'r', encoding='utf-8') as f:
    seats = json.load(f)

# Compute visual coordinates
for s in seats:
    s['ry'] = s['x'] + 50
    s['rx'] = 356 - s['y'] - 20
    s['row_approx'] = round(s['ry'] / 10) * 10

# Sort into rows top-to-bottom
rows = collections.defaultdict(list)
for s in seats:
    rows[s['row_approx']].append(s)

sorted_row_keys = sorted(rows.keys())

for rk in sorted_row_keys:
    # Sort left-to-right
    rows[rk].sort(key=lambda s: s['rx'])

# Now let's build the map
with open(r'g:\8-wall-project\Parliament-Website\seating_map.txt', 'w', encoding='utf-8') as f:
    f.write("== PARLIAMENT SEATING MAP ==\n")
    f.write("Edit the letters inside the brackets to reassign parties.\n")
    f.write("L=Liberal, C=Conservative, N=NDP, B=Bloc, G=Green, I=Independent\n")
    f.write("Format: [L] represents 1 seat. Row 1 starts at the top (near Speaker).\n")
    f.write("Do not alter the brackets or line structure.\n\n")

    for r_idx, rk in enumerate(sorted_row_keys):
        row_seats = rows[rk]
        
        # Split left (Gov) and right (Opp)
        left_seats = [s for s in row_seats if s['rx'] < 178]
        right_seats = [s for s in row_seats if s['rx'] >= 178]
        
        # Assign parties from queue
        for s in left_seats:
            char = gov_queue.pop(0) if gov_queue else (opp_queue.pop(0) if opp_queue else 'I')
            s['assigned_char'] = char
            
        # For right seats, usually they fill from center outwards, or left-to-right? 
        # Actually left-to-right is fine.
        for s in right_seats:
            char = opp_queue.pop(0) if opp_queue else (gov_queue.pop(0) if gov_queue else 'I')
            s['assigned_char'] = char

        left_str = " ".join([f"[{s['assigned_char']}]" for s in left_seats])
        right_str = " ".join([f"[{s['assigned_char']}]" for s in right_seats])
        
        f.write(f"Row {r_idx + 1:02d}:   {left_str:<40}  |  {right_str}\n")

char_to_party = {
    'L': 'Liberal',
    'C': 'Conservative',
    'N': 'NDP',
    'B': 'Bloc Québécois',
    'G': 'Green',
    'I': 'Independent'
}

# Apply to json
for s in seats:
    party = char_to_party.get(s['assigned_char'], 'Independent')
    s['party'] = party
    s['color'] = get_party_color(party)
    del s['ry']
    del s['rx']
    del s['row_approx']
    del s['assigned_char']

with open(r'g:\8-wall-project\Parliament-Website\src\data\seating.json', 'w', encoding='utf-8') as f:
    json.dump(seats, f, indent=2)

print("seating_map.txt generated and seating.json updated.")
