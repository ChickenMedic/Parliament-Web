"""Matching names against the sitting-MP roster.

politicians.json (openparliament) is the site's canonical spelling of every
member's name. The House of Commons, the party websites and LEGISinfo each
differ from it in small ways — accents, middle initials, nicknames, married
surnames — so anything that joins another source to the roster needs the same
tolerant matching. It lives here so the floorplan and the roles scrapers agree.
"""

import json
import re
import unicodedata

POLITICIANS = 'src/data/politicians.json'

# Differences no rule catches: nicknames, a married surname, a legal first name
# nobody uses. Each surname below is unique in the roster, so the mapping is
# unambiguous. Maps other-source name -> openparliament name.
ALIASES = {
    'Shuvaloy Majumdar': 'Shuv Majumdar',
    'Michelle Rempel Garner': 'Michelle Rempel',
    'Robert Oliphant': 'Rob Oliphant',
    'Robert Morrissey': 'Bobby Morrissey',
    'Jessica Fancy': 'Jessica Fancy-Landry',
    'Phil Lawrence': 'Philip Lawrence',
}

HONORIFIC = re.compile(r'^(Right\s+|Rt\.\s+)?(Hon\.|Sen\.|Mr\.|Mrs\.|Ms\.|Dr\.)\s+', re.I)


def strip_honorific(name):
    return HONORIFIC.sub('', (name or '').strip()).strip()


def normalize(name):
    """Fold accents, case, punctuation and middle initials."""
    decomposed = unicodedata.normalize('NFKD', name or '')
    stripped = ''.join(c for c in decomposed if not unicodedata.combining(c))
    return ' '.join(stripped.lower().replace('.', ' ').split())


def load_roster(path=POLITICIANS):
    """-> {name: politician record} for every sitting member."""
    with open(path, encoding='utf-8') as f:
        return {p['name']: p for p in json.load(f)['objects']}


def build_resolver(roster):
    """-> f(any spelling) -> roster name, or None if it can't be pinned down.

    Tries, in order: an exact hit, a known alias, an accent/case-folded hit,
    and finally a unique first-name/last-name pair — which is what catches
    "Jasraj Singh Hallan" against "Jasraj Hallan".
    """
    exact = {normalize(r): r for r in roster}
    by_ends = {}
    for r in roster:
        parts = normalize(r).split()
        if parts:
            by_ends.setdefault((parts[0], parts[-1]), []).append(r)

    def resolve(name):
        name = strip_honorific(name)
        if name in roster:
            return name
        if name in ALIASES and ALIASES[name] in roster:
            return ALIASES[name]
        key = normalize(name)
        if key in exact:
            return exact[key]
        parts = key.split()
        if not parts:
            return None
        candidates = by_ends.get((parts[0], parts[-1]), [])
        return candidates[0] if len(candidates) == 1 else None

    return resolve
