import json

with open(r'g:\8-wall-project\Parliament-Website\src\data\seating.json', 'r', encoding='utf-8') as f:
    seats = json.load(f)

for s in seats:
    s['ry'] = s['x'] + 50
    s['rx'] = 356 - s['y'] - 20
    s['row_approx'] = round(s['ry'] / 10) * 10

# Group into rows
rows = {}
for s in seats:
    r = s['row_approx']
    if r not in rows:
        rows[r] = []
    rows[r].append(s)

party_char = {
    'Liberal': 'L',
    'Conservative': 'C',
    'NDP': 'N',
    'Bloc Québécois': 'B',
    'Green': 'G',
    'Green Party': 'G',
    'Independent': 'I'
}

with open(r'g:\8-wall-project\Parliament-Website\seating_map.txt', 'w', encoding='utf-8') as f:
    f.write("== SEATING MAP ==\n")
    f.write("Edit the letters to assign parties. L=Liberal, C=Conservative, N=NDP, B=Bloc, G=Green, I=Independent\n")
    f.write("Do NOT change the layout (spaces/brackets).\n\n")
    
    sorted_rows = sorted(rows.keys())
    for r_idx, r in enumerate(sorted_rows):
        f.write(f"Row {r_idx + 1}:\n")
        # sort seats by x
        row_seats = sorted(rows[r], key=lambda x: x['rx'])
        
        # We can split left and right
        left_seats = [s for s in row_seats if s['rx'] < 160]
        right_seats = [s for s in row_seats if s['rx'] >= 160]
        
        left_str = " ".join([f"[{party_char.get(s.get('party', 'I'), 'I')}]" for s in left_seats])
        right_str = " ".join([f"[{party_char.get(s.get('party', 'I'), 'I')}]" for s in right_seats])
        
        f.write(f"  Left (Gov): {left_str:<40} | Right (Opp): {right_str}\n\n")

print("Generated seating_map.txt")
