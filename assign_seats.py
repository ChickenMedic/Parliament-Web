import json
import collections
import math

def get_party_color(party):
    p = party.lower()
    if 'liberal' in p: return '#d71920'
    if 'conservative' in p: return '#1a4782'
    if 'ndp' in p: return '#f37021'
    if 'bloc' in p: return '#33b2cc'
    if 'green' in p: return '#3d9b35'
    return '#808080' # Independent/Other

# 1. Count parties from floorplan_list.json
with open('floorplan_list.json', 'r', encoding='utf-8') as f:
    floorplan = json.load(f)

# Filter out Speaker etc if needed, but floorplan has 343. 
# We only have 338 points in seating.json.
# Let's count parties of the first 338 active MPs.
# Actually, the floorplan might have some empty seats or clerks. Let's filter out non-MPs.
# Wait, "Speaker's chair" is one.
valid_seats = [s for s in floorplan if 'clerk' not in s['mp'].lower() and 'vacant' not in s['mp'].lower()]

party_counts = collections.defaultdict(int)
for s in valid_seats:
    party_counts[s['party']] += 1

print("Scraped Party Counts:", dict(party_counts))

# 2. Load seating.json
with open(r'g:\8-wall-project\Parliament-Website\src\data\seating.json', 'r', encoding='utf-8') as f:
    points = json.load(f)

# Sort points by a heuristic to form contiguous blocks
# Typically Government on the right (x > 400), Opposition on the left (x < 400)
# Within each side, sort by row (y) and then x.

# Let's find center x
xs = [p['x'] for p in points]
cx = (max(xs) + min(xs)) / 2
cy = max([p['y'] for p in points]) # The Speaker is usually at the top or bottom?
# Let's just group them by angle from center bottom
speaker_x = cx
speaker_y = min([p['y'] for p in points]) - 100

for p in points:
    # angle from speaker
    dx = p['x'] - speaker_x
    dy = p['y'] - speaker_y
    p['angle'] = math.atan2(dy, dx)
    p['dist'] = math.hypot(dx, dy)

# Sort by angle so we sweep from one side of the horseshoe to the other, then by distance
points.sort(key=lambda p: (p['angle'], p['dist']))

# Flatten parties into a list of 338 elements exactly
party_list = []
# Government first (Liberal) - they usually sit on Speaker's right (larger angle or smaller angle depending on atan2)
# Actually, let's just use the exact party counts.
# Let's say we put Liberals, then NDP, then Green, then Bloc, then Conservatives.
order = ['Liberal', 'NDP', 'Green Party', 'Green', 'Independent', 'Bloc Québécois', 'Conservative']
# Match exact names from party_counts
exact_parties = list(party_counts.keys())
sorted_parties = []
for pref in order:
    for ep in exact_parties:
        if pref.lower() in ep.lower() and ep not in sorted_parties:
            sorted_parties.append(ep)

# Add any leftovers
for ep in exact_parties:
    if ep not in sorted_parties:
        sorted_parties.append(ep)

flat_parties = []
for p in sorted_parties:
    flat_parties.extend([p] * party_counts[p])

# Truncate or pad flat_parties to exactly len(points)
if len(flat_parties) > len(points):
    flat_parties = flat_parties[:len(points)]
elif len(flat_parties) < len(points):
    flat_parties.extend(['Independent'] * (len(points) - len(flat_parties)))

# Assign to points
for i, p in enumerate(points):
    p['party'] = flat_parties[i]
    p['color'] = get_party_color(flat_parties[i])
    del p['angle']
    del p['dist']

with open(r'g:\8-wall-project\Parliament-Website\src\data\seating.json', 'w', encoding='utf-8') as f:
    json.dump(points, f, indent=2)

print(f"Updated seating.json with {len(points)} seats.")
