"""Add Wikipedia portrait URLs to src/data/prime_ministers.json.

The prime ministers list itself is hand-maintained (names, parties, dates and
one-line summaries change once a decade at most). This only fills in the
``portrait`` field for each entry from the Wikipedia page named in ``wiki``,
using the REST summary endpoint, which returns the article's lead image as a
thumbnail on upload.wikimedia.org.

An entry whose lookup fails keeps whatever portrait it already had, so a
flaky run never blanks a photo. The History page falls back to initials when
there is none.

Run: python fetch_pm_portraits.py
"""

import json
import time
import urllib.parse
import urllib.request

DATA = 'src/data/prime_ministers.json'
SUMMARY = 'https://en.wikipedia.org/api/rest_v1/page/summary/'
HEADERS = {'User-Agent': 'ParliaWeb/1.0 (personal project; contact: samdawson93@outlook.com)'}


def portrait_for(title):
    req = urllib.request.Request(SUMMARY + urllib.parse.quote(title), headers=HEADERS)
    with urllib.request.urlopen(req, timeout=30) as r:
        page = json.loads(r.read().decode('utf-8'))
    source = (page.get('thumbnail') or {}).get('source')
    if not source:
        return None
    # Keep the size the API hands back (about 320px wide): Wikimedia only
    # serves thumbnail widths it has already rendered, so asking for another
    # width returns a 400. Drop the utm_ tracking parameters.
    return source.split('?')[0]


def main():
    with open(DATA, encoding='utf-8') as f:
        pms = json.load(f)

    updated = 0
    for pm in pms:
        try:
            url = portrait_for(pm['wiki'])
        except Exception as e:  # network or missing page: keep what we had
            print(f"  ! {pm['name']}: {e}")
            continue
        if url and url != pm.get('portrait'):
            pm['portrait'] = url
            updated += 1
        elif not url:
            print(f"  ! {pm['name']}: no lead image on {pm['wiki']}")
        time.sleep(0.2)

    with open(DATA, 'w', encoding='utf-8', newline='\n') as f:
        f.write(json.dumps(pms, indent=2, ensure_ascii=False) + '\n')
    print(f'Updated {updated} of {len(pms)} portraits in {DATA}')


if __name__ == '__main__':
    main()
