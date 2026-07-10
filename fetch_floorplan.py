"""Rebuild src/data/seating.json from the official House of Commons floorplan.

https://www.ourcommons.ca/members/en/floorplan renders the chamber as a 12x32
grid of `floorplan-col` cells. Each occupied cell is a <button> carrying the
member's name, party colour, and — crucially — a class marking Cabinet and Prime
Minister seats. Unoccupied cells are <div class="floorplan-cell unoccupied">;
they are aisles, the Clerks' Table, and vacant desks, and are not drawn.

Grid rows 0-5 are the opposition benches (0 = back row, 5 = front row) and rows
6-11 are the government benches (6 = front row, 11 = back row). Column 0 is the
Speaker's end of the chamber; the two front benches start at column 2 because the
Table of the House occupies the floor in front of the Speaker.

The Speaker himself sits in the Speaker's chair at the head of the chamber, not
at a bench desk, so he is deliberately absent from seating.json. SeatingChart.tsx
draws him as its own marker.
"""

import html
import json
import re
import urllib.request

URL = 'https://www.ourcommons.ca/members/en/floorplan'
OUT = 'src/data/seating.json'
POLITICIANS = 'src/data/politicians.json'

GRID_ROWS = 12
GRID_COLS = 32

# Chart geometry, mirrored in SeatingChart.tsx. Coordinates are stored unrotated:
# the component draws left = CHART_WIDTH - y - SEAT_WIDTH and top = x + SEAT_TOP_OFFSET.
BENCH_PITCH = 23        # gap between the six benches on a side
CHAIR_PITCH = 28        # gap between chairs along a bench
CHAIR_START = 14
OPPOSITION_FRONT_Y = 119
GOVERNMENT_FRONT_Y = 217

PARTY_BY_COLOUR = {
    '#d71920': ('Liberal', '#d71920'),
    '#002395': ('Conservative', '#1a4782'),
    '#0088ce': ('Bloc Québécois', '#33b2cc'),
    '#ff5800': ('NDP', '#f37021'),
    '#427730': ('Green', '#3d9b35'),
}
INDEPENDENT = ('Independent', '#808080')

CELL = re.compile(r'<div class="floorplan-col">')
BUTTON = re.compile(r'<button class="([^"]*)"')
ARIA = re.compile(r'aria-label="([^"]*)"')
BGCOLOR = re.compile(r'background-color:\s*(#[0-9A-Fa-f]{6})')


def fetch(url):
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    return urllib.request.urlopen(req, timeout=60).read().decode('utf-8', 'replace')


def parse_grid(page):
    """-> list of 12 rows, each a list of 32 cells (dict or None)."""
    table = page[page.index('<div class="floorplan-table"'):]
    raw_rows = re.split(r'<div class="floorplan-row">', table)[1:]
    assert len(raw_rows) == GRID_ROWS, len(raw_rows)

    grid = []
    for raw in raw_rows:
        cols = CELL.split(raw)[1:][:GRID_COLS]
        assert len(cols) == GRID_COLS, len(cols)
        row = []
        for col in cols:
            button = BUTTON.search(col)
            if not button or 'floorplan-cell' not in button.group(1):
                row.append(None)          # aisle, Table, or vacant desk
                continue
            classes = ' '.join(button.group(1).split())
            colour = BGCOLOR.search(col)
            row.append({
                'name': html.unescape(ARIA.search(col).group(1)),
                'colour': colour.group(1).lower() if colour else None,
                'cabinet': 'cabinet-member-seat' in classes,
                'pm': 'pm-seat' in classes,
            })
        grid.append(row)
    return grid


def coordinates(row, col):
    """Grid position -> the unrotated (x, y) the chart expects."""
    if row <= 5:                                   # opposition, row 5 = front bench
        y = OPPOSITION_FRONT_Y - (5 - row) * BENCH_PITCH
    else:                                          # government, row 6 = front bench
        y = GOVERNMENT_FRONT_Y + (row - 6) * BENCH_PITCH
    return CHAIR_START + col * CHAIR_PITCH, y


def build_alias_map(names, roster):
    """ourcommons spells out middle names ("David J. McGuinty"); openparliament doesn't."""
    by_ends = {}
    for r in roster:
        parts = r.split()
        by_ends.setdefault((parts[0], parts[-1]), []).append(r)

    aliases = {}
    for name in names:
        if name in roster:
            continue
        parts = name.split()
        candidates = by_ends.get((parts[0], parts[-1]), [])
        if len(candidates) == 1:
            aliases[name] = candidates[0]
    return aliases


def main():
    page = fetch(URL)
    grid = parse_grid(page)

    with open(POLITICIANS, encoding='utf-8') as f:
        roster = {p['name'] for p in json.load(f)['objects']}

    occupied = [(r, c, cell) for r, row in enumerate(grid)
                for c, cell in enumerate(row) if cell]
    aliases = build_alias_map([c['name'] for _, _, c in occupied], roster)

    seats = []
    unmatched = []
    for row, col, cell in occupied:
        name = aliases.get(cell['name'], cell['name'])
        if name not in roster:
            unmatched.append(cell['name'])
        party, colour = PARTY_BY_COLOUR.get(cell['colour'], INDEPENDENT)
        x, y = coordinates(row, col)
        seats.append({
            'x': x,
            'y': y,
            'color': colour,
            'party': party,
            'seatNumber': len(seats),
            'name': name,
            'benchRow': row,
            'chairCol': col,
            'cabinet': cell['cabinet'],
            'pm': cell['pm'],
        })

    if unmatched:
        raise SystemExit(f'{len(unmatched)} floorplan names absent from politicians.json: {unmatched}')

    seated = {s['name'] for s in seats}
    print(f'{len(seats)} desks | cabinet {sum(s["cabinet"] for s in seats)} '
          f'| pm {sum(s["pm"] for s in seats)}')
    print('roster members with no desk on the official plan:',
          sorted(roster - seated))

    with open(OUT, 'w', encoding='utf-8', newline='\r\n') as f:
        f.write(json.dumps(seats, indent=2, ensure_ascii=True))


if __name__ == '__main__':
    main()
