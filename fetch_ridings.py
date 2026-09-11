"""Rebuild src/data/ridings.json — the electoral-district boundaries the map draws.

Sources:
  1. House of Commons  - the authoritative list of current constituencies.
     https://www.ourcommons.ca/members/en/constituencies/xml
  2. OpenNorth Represent - boundary geometry for the same representation order.
     https://represent.opennorth.ca/boundaries/federal-electoral-districts-2023-representation-order/

The 2023 Representation Order took effect for the 2025 general election and
raised the House from 338 seats to 343 (Alberta +3, Ontario +1, BC +1). The
map was still drawing 2013 boundaries, so five ridings had no polygon at all
and a hundred more were matched to a differently-named predecessor by fuzzy
string comparison — which is how an MP ends up drawn over the wrong ground.

The two sources are cross-checked: if the geometry doesn't cover exactly the
constituencies the House lists, the file is not written. Coordinates are
rounded to five decimals (about a metre) because the map is national-scale
and the raw precision costs megabytes for pixels nobody can see.

MapComponent builds the city insets at runtime from these base features, so
this file holds one feature per riding and nothing else.

Run: python fetch_ridings.py
"""

import json
import ssl
import unicodedata
import urllib.request
import xml.etree.ElementTree as ET
import re

OUT = 'src/data/ridings.json'
CONSTITUENCIES = 'https://www.ourcommons.ca/members/en/constituencies/xml'
BOUNDARIES = ('https://represent.opennorth.ca/boundaries/'
              'federal-electoral-districts-2023-representation-order/simple_shape?limit=400')
EXPECTED_SEATS = 343
PRECISION = 5

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

HEADERS = {'User-Agent': 'ParliaWeb/1.0 (personal project; contact: samdawson93@outlook.com)'}


def get(url):
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req, context=ctx, timeout=180) as r:
        return r.read()


def norm(name):
    """Fold accents, case, and the three dashes the sources disagree about."""
    decomposed = unicodedata.normalize('NFKD', name or '')
    stripped = ''.join(c for c in decomposed if not unicodedata.combining(c))
    return ' '.join(re.sub(r'[^a-z0-9 ]', ' ', stripped.lower()).split())


def official_constituencies():
    root = ET.fromstring(get(CONSTITUENCIES))
    names = []
    for entry in root:
        name = entry.findtext('Name')
        if name:
            names.append(name.strip())
    return names


def round_coords(node):
    """Round every coordinate pair in a GeoJSON geometry, in place."""
    if node and isinstance(node[0], (int, float)):
        return [round(v, PRECISION) for v in node]
    return [round_coords(child) for child in node]


def main():
    official = official_constituencies()
    print(f'House of Commons lists {len(official)} constituencies')
    if len(official) != EXPECTED_SEATS:
        # A representation order is a once-a-decade event, so this is far more
        # likely to be a broken fetch than a real change in the size of the House.
        raise SystemExit(
            f'Expected {EXPECTED_SEATS} constituencies, got {len(official)}. '
            f'If a new representation order really has taken effect, update '
            f'EXPECTED_SEATS and the boundary set URL together.')

    shapes = json.loads(get(BOUNDARIES))['objects']
    print(f'Represent returned {len(shapes)} boundaries')

    by_norm = {norm(s['name']): s for s in shapes}
    missing = [n for n in official if norm(n) not in by_norm]
    extra = [s['name'] for s in shapes if norm(s['name']) not in {norm(n) for n in official}]
    if missing or extra:
        raise SystemExit(
            f'Boundary set does not match the House list — not writing.\n'
            f'  no geometry for: {missing}\n'
            f'  geometry with no constituency: {extra}')

    # Keep the House's spelling: it's what politicians.json riding names follow.
    features = []
    for name in sorted(official, key=norm):
        geometry = by_norm[norm(name)]['simple_shape']
        geometry['coordinates'] = round_coords(geometry['coordinates'])
        features.append({
            'type': 'Feature',
            'properties': {'name': name},
            'geometry': geometry,
        })

    payload = {'type': 'FeatureCollection', 'features': features}
    with open(OUT, 'w', encoding='utf-8') as f:
        json.dump(payload, f, ensure_ascii=False, separators=(',', ':'))
    print(f'Saved {len(features)} ridings to {OUT}')


if __name__ == '__main__':
    main()
