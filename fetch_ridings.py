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

Represent's geometry is the legal ("digital") boundary, which runs out to the
international border in the Great Lakes, across Hudson Bay, and up to the
North Pole for the territories. Drawn as-is that paints the sea party colours
and, because Web Mercator can't project latitude 90, smears the Arctic across
the whole map. So every riding is clipped to Natural Earth's 1:10m land mask
(coastline with lakes cut out) to give a cartographic boundary instead.

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

from shapely.geometry import shape, mapping, MultiPolygon, Polygon
from shapely.validation import make_valid
from shapely import unary_union

OUT = 'src/data/ridings.json'
CONSTITUENCIES = 'https://www.ourcommons.ca/members/en/constituencies/xml'
BOUNDARIES = ('https://represent.opennorth.ca/boundaries/'
              'federal-electoral-districts-2023-representation-order/simple_shape?limit=400')
# Natural Earth admin-0 countries with lakes removed, 1:10m. The GitHub mirror
# serves the repository's GeoJSON build of the official shapefiles.
LAND_MASK = ('https://raw.githubusercontent.com/nvkelso/natural-earth-vector/'
             'master/geojson/ne_10m_admin_0_countries_lakes.geojson')
EXPECTED_SEATS = 343
PRECISION = 5

# Parliament renamed these ridings after the 2023 Representation Order (the
# boundaries are unchanged). The House list uses the new names; Represent and
# openparliament.ca — and so politicians.json — still use the old ones. Each
# feature is written under the House's name with the old name as an alias so
# the map can match MPs whichever spelling the roster carries.
RENAMED = {
    'Argenteuil—La Petite-Nation': 'Argenteuil—Papineau—Des Collines',
    'Beauharnois—Salaberry—Soulanges—Huntingdon': 'Vallée-du-Haut-Saint-Laurent',
    'Brantford—Brant South—Six Nations': 'Brantford—Brant South',
    'Cape Spear': 'Cape Spear—Mount Pearl—Paradise',
    'Cariboo—Prince George': 'Cariboo—Prince George—Omineca',
    'Central Newfoundland': 'Coast of Bays—Central—Notre Dame',
    'Halifax West': "Halifax West—Peggy's Cove",
    'Jonquière': 'Jonquière—Hébertville—Pays-des-Bleuets',
    'Longueuil—Charles-LeMoyne': 'Longueuil—Charles-LeMoyne—Greenfield Park',
    'New Tecumseth—Gwillimbury': 'York—South Simcoe',
    'Portneuf—Jacques-Cartier': 'Saint-Augustin—Portneuf—Jacques-Cartier',
    'Richmond—Arthabaska': 'Richmond—Arthabaska—des-Sources',
    'Rimouski—La Matapédia': 'Rimouski-Neigette—Mitis—Matapédia—Les Basques',
    'Saint John—St. Croix': 'New Brunswick Southwest',
    'Saskatoon—University': 'Saskatoon East',
    'Terra Nova—The Peninsulas': 'The Eastern Peninsulas',
    'York Centre': 'North York',
}

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


def canada_land():
    """Canada's land area as a (multi)polygon, with lakes cut out."""
    countries = json.loads(get(LAND_MASK))['features']
    canada = [f for f in countries if f['properties'].get('ADMIN') == 'Canada']
    if len(canada) != 1:
        raise SystemExit(f'Expected one Canada feature in the land mask, found {len(canada)}')
    return make_valid(shape(canada[0]['geometry']))


def clip_to_land(geometry, land):
    """Intersect a riding with the land mask; keep the original if that fails."""
    riding = make_valid(shape(geometry))
    clipped = riding.intersection(land)
    # intersection() can return a GeometryCollection with stray lines/points
    # along shared edges; keep only the areas.
    if clipped.geom_type == 'GeometryCollection':
        clipped = unary_union([g for g in clipped.geoms if g.area > 0])
    if clipped.is_empty or clipped.area == 0:
        print('  ! nothing left after clipping; keeping the raw boundary')
        return geometry
    return mapping(as_multipolygon(clipped))


def as_multipolygon(geom):
    """Every feature is a MultiPolygon so the map code has one shape to handle."""
    if isinstance(geom, Polygon):
        return MultiPolygon([geom])
    if isinstance(geom, MultiPolygon):
        return geom
    return MultiPolygon([g for g in geom.geoms if isinstance(g, Polygon)])


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

    renamed = {norm(old): new for old, new in RENAMED.items()}
    aliases = {}
    for s in shapes:
        if norm(s['name']) in renamed:
            aliases[norm(renamed[norm(s['name'])])] = s['name']
            s['name'] = renamed[norm(s['name'])]

    by_norm = {norm(s['name']): s for s in shapes}
    missing = [n for n in official if norm(n) not in by_norm]
    extra = [s['name'] for s in shapes if norm(s['name']) not in {norm(n) for n in official}]
    if missing or extra:
        raise SystemExit(
            f'Boundary set does not match the House list — not writing.\n'
            f'  no geometry for: {missing}\n'
            f'  geometry with no constituency: {extra}')

    land = canada_land()
    print('Clipping ridings to the coastline...')

    # Keep the House's spelling: it's what politicians.json riding names follow.
    features = []
    for name in sorted(official, key=norm):
        geometry = clip_to_land(by_norm[norm(name)]['simple_shape'], land)
        geometry['coordinates'] = round_coords(geometry['coordinates'])
        properties = {'name': name}
        if norm(name) in aliases:
            properties['aliases'] = [aliases[norm(name)]]
        features.append({
            'type': 'Feature',
            'properties': properties,
            'geometry': geometry,
        })

    payload = {'type': 'FeatureCollection', 'features': features}
    with open(OUT, 'w', encoding='utf-8') as f:
        json.dump(payload, f, ensure_ascii=False, separators=(',', ':'))
    print(f'Saved {len(features)} ridings to {OUT}')


if __name__ == '__main__':
    main()
