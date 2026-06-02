import json
import re

char_to_party = {
    'L': 'Liberal',
    'C': 'Conservative',
    'N': 'NDP',
    'B': 'Bloc Québécois',
    'G': 'Green',
    'I': 'Independent',
    'V': 'Vacant'
}

with open('seating_map.txt', 'r', encoding='utf-8') as f:
    lines = f.readlines()

seats = []

# Map grid to coordinates
y_idx = 0
for line in lines:
    if line.startswith("Row"):
        # find all pieces like [L] or [ ]
        # A row looks like: Row 01: [L][L][L][L][L][L]  ||  [C][C][C][C][C][C]
        # We can extract the inner characters using regex
        matches = re.findall(r'\[(.*?)\]', line)
        for x_idx, char in enumerate(matches):
            if char != ' ' and char != '':
                party = char_to_party.get(char, 'Unknown')
                seats.append({
                    "x": x_idx,
                    "y": y_idx,
                    "party": party
                })
        y_idx += 1

print(f"Generated {len(seats)} seats from text file.")

with open(r'g:\8-wall-project\Parliament-Website\src\data\seating.json', 'w', encoding='utf-8') as f:
    json.dump(seats, f, indent=2)
