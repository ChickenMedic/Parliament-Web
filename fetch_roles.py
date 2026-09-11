"""Rebuild src/data/roles.json — who holds which front-bench job.

Two halves, two sources, two different levels of trust:

  Cabinet   https://www.ourcommons.ca/members/en/ministries/xml
            The House of Commons' own register of the ministry. Authoritative,
            so it is managed outright: ministers are added, retitled and
            removed to match it exactly.

  Shadow    https://www.conservative.ca/shadow-cabinet/
  cabinet   A party page, with no official equivalent. Titles are refreshed and
            critics who have left the shadow cabinet are dropped, but new ones
            are only reported. The committed list is deliberately trimmed to
            the critics who shadow an actual cabinet portfolio — the page also
            carries associate critics, regional development posts and whip's
            office roles — and that trim is an editorial call, not a rule this
            script should guess at. Run with --add-new to adopt them all.

This file replaces scrape.py and scrape_shadow_cabinet.py, which wrote a
hardcoded 44th-Parliament critic list and a path into a since-deleted
directory straight over roles.json.

Run: python fetch_roles.py [--add-new]
"""

import html
import json
import re
import ssl
import sys
import urllib.request
import xml.etree.ElementTree as ET

from roster import build_resolver, load_roster, strip_honorific

OUT = 'src/data/roles.json'
CABINET_URL = 'https://www.ourcommons.ca/members/en/ministries/xml'
SHADOW_URL = 'https://www.conservative.ca/shadow-cabinet/'

# Refuse to write if a source suddenly returns far less than it should; a
# reshuffle moves a handful of people, a broken parse loses all of them.
MIN_CABINET = 20
MIN_SHADOW = 25

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

HEADERS = {'User-Agent': 'Mozilla/5.0 (compatible; ParliaWeb/1.0; personal project)'}

# Anything matching this is the cabinet's to manage; everything else in
# roles.json is opposition or hand-curated and is left alone.
MINISTERIAL = re.compile(
    r'^(Prime Minister|Deputy Prime Minister|Minister\b|Secretary of State|'
    r'President of the|Leader of the Government)', re.I)

# The shadow roles the site carries: portfolio critics plus the leadership.
# Associate critics, regional development posts, whips and coordinators are
# on the page too and are deliberately not shown.
SHADOW_KEEP = re.compile(
    r'^(Shadow Minister for |Leader of the Official Opposition$|'
    r'Deputy Leader$|House Leader$)')

# The page's bare leadership labels, in the site's own wording.
SHADOW_LABELS = {
    'Deputy Leader': 'Deputy Leader of the Conservative Party',
    'House Leader': 'Opposition House Leader',
}


def get(url):
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req, context=ctx, timeout=60) as r:
        return r.read()


def fetch_cabinet():
    """-> [(name, title)] in the House's order of precedence."""
    root = ET.fromstring(get(CABINET_URL))
    ministers = []
    for entry in root:
        field = {c.tag: c.text for c in entry}
        if field.get('ToDateTime'):
            continue                      # a former minister, kept for history
        first = (field.get('PersonOfficialFirstName') or '').strip()
        last = (field.get('PersonOfficialLastName') or '').strip()
        title = (field.get('Title') or '').strip()
        if first and last and title:
            ministers.append((f'{first} {last}', title))
    return ministers


def clean(text):
    return ' '.join(html.unescape(text).replace('﻿', '').split())


def fetch_shadow_cabinet():
    """-> {name: title} for the critics the site carries, plus everything the
    page lists, so the caller can report what it chose not to adopt."""
    page = get(SHADOW_URL).decode('utf-8', 'replace')
    # Ridings are commented out on some cards; strip comments so they stay out.
    page = re.sub(r'<!--.*?-->', '', page, flags=re.S)

    name_re = re.compile(r'<h3 class="name-header"[^>]*>\s*(.*?)\s*</h3>', re.S)
    role_re = re.compile(r'<p class="riding-title"[^>]*>\s*(.*?)\s*</p>', re.S)

    everyone = {}
    for card in re.split(r'<div class="cabinet-flex-content">', page)[1:]:
        card = card.split('</div>')[0]
        # Each card splits the name across two headings: honorific + given
        # name, then surname.
        names = [clean(n) for n in name_re.findall(card)]
        roles = [clean(r) for r in role_re.findall(card)]
        if not names or not roles:
            continue
        everyone[strip_honorific(' '.join(names))] = roles[-1]

    kept = {n: SHADOW_LABELS.get(t, t) for n, t in everyone.items() if SHADOW_KEEP.match(t)}
    return kept, everyone


def main():
    add_new = '--add-new' in sys.argv

    roster = load_roster()
    resolve = build_resolver(roster)

    with open(OUT, encoding='utf-8') as f:
        current = json.load(f)

    cabinet = fetch_cabinet()
    print(f'ministry register: {len(cabinet)} ministers')
    if len(cabinet) < MIN_CABINET:
        raise SystemExit(f'Only {len(cabinet)} ministers parsed; refusing to write.')

    shadow, everyone = fetch_shadow_cabinet()
    print(f'shadow cabinet page: {len(everyone)} cards, {len(shadow)} portfolio critics')
    if len(shadow) < MIN_SHADOW:
        raise SystemExit(f'Only {len(shadow)} critics parsed; refusing to write.')

    unresolved = []

    def roster_name(name):
        resolved = resolve(name)
        if resolved is None:
            unresolved.append(name)
        return resolved

    # ---- cabinet: managed outright, in order of precedence ----
    roles, added, retitled = {}, [], []
    for name, title in cabinet:
        resolved = roster_name(name)
        if resolved is None:
            continue
        if resolved not in current:
            added.append((resolved, title))
        elif current[resolved] != title:
            retitled.append((resolved, current[resolved], title))
        roles[resolved] = title

    dropped = [(n, r) for n, r in current.items()
               if MINISTERIAL.match(r) and n not in roles]

    # ---- everything else: keep the committed entry, refresh what we can ----
    shadow_by_roster = {}
    for name, title in shadow.items():
        resolved = roster_name(name)
        if resolved is not None:
            shadow_by_roster[resolved] = title

    for name, role in current.items():
        if MINISTERIAL.match(role) or name in roles:
            continue
        if name in shadow_by_roster:
            if shadow_by_roster[name] != role:
                retitled.append((name, role, shadow_by_roster[name]))
            roles[name] = shadow_by_roster[name]
        elif name in roster:
            # Still an MP, but the party no longer lists them as a critic.
            dropped.append((name, role))
        else:
            # No longer an MP at all; their role went with the seat.
            dropped.append((name, role))

    newcomers = {n: t for n, t in shadow_by_roster.items() if n not in roles}
    if add_new:
        roles.update(newcomers)

    for label, rows in (('added', added), ('retitled', retitled), ('removed', dropped)):
        if rows:
            print(f'\n{label}:')
            for row in rows:
                print('   ', ' | '.join(str(c) for c in row))
    if newcomers:
        print(f'\nnew on the shadow cabinet page{" (adopted)" if add_new else ""}:')
        for n, t in sorted(newcomers.items()):
            print(f'    {n} | {t}')
        if not add_new:
            print('    (not adopted — re-run with --add-new to take them all)')
    if unresolved:
        print(f'\ncould not match to a sitting MP, skipped: {sorted(set(unresolved))}')

    with open(OUT, 'w', encoding='utf-8') as f:
        json.dump(roles, f, indent=1, ensure_ascii=False)
        f.write('\n')
    print(f'\nSaved {len(roles)} roles to {OUT}')


if __name__ == '__main__':
    main()
