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
import unicodedata
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
VACANT = ('Vacant', '#c0c0c0')

CELL = re.compile(r'<div class="floorplan-col">')
BUTTON = re.compile(r'<button class="([^"]*)"')
UNOCCUPIED = re.compile(r'<div class="floorplan-cell unoccupied"')
ARIA = re.compile(r'aria-label="([^"]*)"')
BGCOLOR = re.compile(r'background-color:\s*(#[0-9A-Fa-f]{6})')

VACANT_CELL = {'name': None}      # sentinel for an empty desk


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
                # An empty desk is `floorplan-cell unoccupied`. A bare `floorplan-cell`
                # is not a desk at all -- the Table of the House at the near end of a
                # bench, or the wall at the far end -- and is left undrawn.
                row.append(VACANT_CELL if UNOCCUPIED.search(col) else None)
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


"""ourcommons and openparliament disagree about a handful of names in ways no rule
catches: nicknames, a married surname, a hyphenation. Each surname below is unique
in the roster, so the mapping is unambiguous. Maps ourcommons -> openparliament."""
ALIASES = {
    'Shuvaloy Majumdar': 'Shuv Majumdar',
    'Michelle Rempel Garner': 'Michelle Rempel',
    'Robert Oliphant': 'Rob Oliphant',
    'Robert Morrissey': 'Bobby Morrissey',
    'Jessica Fancy': 'Jessica Fancy-Landry',
}


def normalize(name):
    """Fold accents, case, and middle initials: the two sources differ on all three."""
    decomposed = unicodedata.normalize('NFKD', name)
    stripped = ''.join(c for c in decomposed if not unicodedata.combining(c))
    return ' '.join(stripped.lower().replace('.', ' ').split())


def build_resolver(roster):
    """-> f(ourcommons name) -> openparliament name, or None."""
    exact = {normalize(r): r for r in roster}
    by_ends = {}
    for r in roster:
        parts = normalize(r).split()
        by_ends.setdefault((parts[0], parts[-1]), []).append(r)

    def resolve(name):
        if name in roster:
            return name
        if name in ALIASES:
            return ALIASES[name]
        key = normalize(name)
        if key in exact:
            return exact[key]
        parts = key.split()
        candidates = by_ends.get((parts[0], parts[-1]), [])
        return candidates[0] if len(candidates) == 1 else None

    return resolve


def main():
    page = fetch(URL)
    grid = parse_grid(page)

    with open(POLITICIANS, encoding='utf-8') as f:
        roster = {p['name'] for p in json.load(f)['objects']}

    resolve = build_resolver(roster)

    seats = []
    unmatched = []
    for row, cells in enumerate(grid):
        for col, cell in enumerate(cells):
            if cell is None:
                continue                      # not a desk; nothing to draw
            x, y = coordinates(row, col)

            if cell['name'] is None:
                seats.append({
                    'x': x, 'y': y,
                    'color': VACANT[1], 'party': VACANT[0],
                    'seatNumber': len(seats), 'name': None,
                    'benchRow': row, 'chairCol': col,
                    'cabinet': False, 'pm': False,
                })
                continue

            name = resolve(cell['name'])
            if name is None:
                unmatched.append(cell['name'])
                name = cell['name']
            party, colour = PARTY_BY_COLOUR.get(cell['colour'], INDEPENDENT)
            seats.append({
                'x': x, 'y': y,
                'color': colour, 'party': party,
                'seatNumber': len(seats), 'name': name,
                'benchRow': row, 'chairCol': col,
                'cabinet': cell['cabinet'], 'pm': cell['pm'],
            })

    if unmatched:
        raise SystemExit(f'{len(unmatched)} floorplan names absent from politicians.json: {unmatched}')

    seated = {s['name'] for s in seats if s['name']}
    vacant = sum(1 for s in seats if s['name'] is None)
    print(f'{len(seats)} desks ({len(seated)} occupied, {vacant} vacant) '
          f'| cabinet {sum(s["cabinet"] for s in seats)} | pm {sum(s["pm"] for s in seats)}')
    print('roster members with no desk on the official plan:',
          sorted(roster - seated))

    with open(OUT, 'w', encoding='utf-8', newline='\r\n') as f:
        f.write(json.dumps(seats, indent=2, ensure_ascii=True))


if __name__ == '__main__':
    main()
