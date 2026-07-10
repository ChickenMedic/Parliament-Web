"""Refresh src/data/politicians.json from the openparliament.ca API.

The list endpoint (/politicians/) returns only name, url, current_party,
current_riding and image, so the contact fields the site renders -- voice, email
and twitter -- have to come from each member's detail endpoint. That is one
request per MP, so this takes a couple of minutes.

openparliament sometimes drops a twitter handle it used to publish (Mark Carney,
for one). Rather than silently lose a handle the site already shows, a missing
API value falls back to whatever is already committed. Every other field is taken
from the API verbatim, so members who have left the House disappear as they should.
"""

import json
import os
import time
import urllib.error
import urllib.request

API = 'https://api.openparliament.ca'
OUT = 'src/data/politicians.json'
CONTACT = os.environ.get('OPENPARLIAMENT_CONTACT', 'samdawson93@outlook.com')

HEADERS = {'User-Agent': f'ParliaWeb/1.0 ({CONTACT})', 'Accept': 'application/json'}
DELAY = 0.1          # be polite; the API is a volunteer project
RETRIES = 3


def get(path):
    url = path if path.startswith('http') else API + path
    for attempt in range(RETRIES):
        try:
            req = urllib.request.Request(url, headers=HEADERS)
            with urllib.request.urlopen(req, timeout=30) as r:
                return json.loads(r.read().decode('utf-8'))
        except (urllib.error.URLError, TimeoutError):
            if attempt == RETRIES - 1:
                raise
            time.sleep(2 ** attempt)


def fetch_roster():
    """Every sitting MP, following pagination."""
    members, path = [], '/politicians/?format=json&limit=500'
    while path:
        page = get(path)
        members.extend(page['objects'])
        path = page['pagination'].get('next_url')
    return members


def load_previous():
    try:
        with open(OUT, encoding='utf-8') as f:
            return {p['name']: p for p in json.load(f)['objects']}
    except FileNotFoundError:
        return {}


def main():
    previous = load_previous()
    roster = fetch_roster()
    print(f'roster: {len(roster)} sitting members')

    people, kept_twitter = [], []
    for i, member in enumerate(roster, 1):
        detail = get(member['url'] + '?format=json')
        handles = (detail.get('other_info') or {}).get('twitter') or []
        twitter = handles[0] if handles else None

        if not twitter:
            committed = previous.get(member['name'], {}).get('twitter')
            if committed:
                twitter = committed
                kept_twitter.append(member['name'])

        people.append({
            'name': member['name'],
            'url': member['url'],
            'current_party': member['current_party'],
            'current_riding': member['current_riding'],
            'image': member.get('image'),
            'voice': detail.get('voice'),
            'email': detail.get('email'),
            'twitter': twitter,
        })
        if i % 25 == 0:
            print(f'  {i}/{len(roster)}')
        time.sleep(DELAY)

    now = {p['name'] for p in people}
    before = set(previous)
    print('\nadded: ', sorted(now - before) or 'none')
    print('removed:', sorted(before - now) or 'none')
    if kept_twitter:
        print(f'kept {len(kept_twitter)} committed twitter handles the API no longer returns:',
              sorted(kept_twitter))

    payload = {
        'objects': people,
        'pagination': {'offset': 0, 'limit': 500, 'next_url': None, 'previous_url': None},
    }
    with open(OUT, 'w', encoding='utf-8', newline='\n') as f:
        f.write(json.dumps(payload, indent=2, ensure_ascii=False))


if __name__ == '__main__':
    main()
