"""Refresh src/data/news.json with the Canadian politics headlines the public
is actually seeing, via Google News RSS (free, no API key).

Output shape:
  { "federal": [items...], "provincial": { "Ontario": [items...], ... } }

Federal combines the Canada politics topic feed with a federal-politics
search; each province and territory gets its own politics search.

Run: python fetch_news.py
"""

import json
import re
import ssl
import time
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from email.utils import parsedate_to_datetime

OUT = 'src/data/news.json'
FEDERAL_MAX = 40
PROVINCE_MAX = 8
MAX_AGE_DAYS = 7
# PEI, the territories and other small jurisdictions can go a week without
# political coverage; a slightly older headline beats an empty column.
QUIET_MAX_AGE_DAYS = 21

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

HEADERS = {'User-Agent': 'ParliaWeb/1.0 (personal project)'}


def search_url(query):
    return ('https://news.google.com/rss/search?q=' + urllib.parse.quote(query)
            + '&hl=en-CA&gl=CA&ceid=CA:en')


# Despite the Canadian locale, Google's POLITICS topic feed is world politics
# with Canadian stories mixed in — roughly half of it is Nigeria, Malaysia or
# Germany — so everything from it has to name a Canadian federal subject to be
# kept. The searches below are already scoped by their query and aren't
# filtered. Duplicates across feeds are collapsed by title.
FEDERAL_TOPIC_FEED = 'https://news.google.com/rss/headlines/section/topic/POLITICS?hl=en-CA&gl=CA&ceid=CA:en'

FEDERAL_SEARCHES = [
    search_url('Canada Parliament OR "House of Commons" OR "federal government"'),
    search_url('Carney OR Poilievre OR "federal cabinet" OR "Parliament Hill" Canada'),
]

# Anchors, not topics: "Nigeria's parliament" and "Doug Ford's cabinet" both
# have to fall out, so a bare "parliament" or "minister" isn't enough.
FEDERAL_RE = re.compile(
    r'\b(canada|canadian|ottawa|parliament hill|house of commons|'
    r'carney|poilievre|blanchet|governor general)\b', re.I)


def is_federal(item):
    return bool(FEDERAL_RE.search(item['title']))

# West to east, then the territories — the frontend keeps this order.
PROVINCES = [
    'British Columbia', 'Alberta', 'Saskatchewan', 'Manitoba', 'Ontario',
    'Quebec', 'New Brunswick', 'Nova Scotia', 'Prince Edward Island',
    'Newfoundland and Labrador', 'Yukon', 'Northwest Territories', 'Nunavut',
]


def fetch_feed(url):
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req, context=ctx, timeout=45) as r:
        root = ET.fromstring(r.read())
    items = []
    for item in root.iter('item'):
        title = item.findtext('title') or ''
        source = item.findtext('source') or ''
        if source and title.endswith(' - ' + source):
            title = title[: -len(' - ' + source)]
        items.append({
            'title': title,
            'source': source,
            'link': item.findtext('link') or '',
            'date': item.findtext('pubDate') or '',
        })
    return items


def timestamp(item):
    try:
        return parsedate_to_datetime(item['date']).timestamp()
    except Exception:
        return 0


def gather(urls):
    """Every item from every feed, tolerating an individual feed failing."""
    merged = []
    for url in urls:
        try:
            merged.extend(fetch_feed(url))
        except Exception as e:
            print(f'warning: feed failed ({e}); continuing')
        time.sleep(0.5)
    return merged


def select(items, limit, seen, max_age_days=MAX_AGE_DAYS, relevant=None):
    """Newest unseen items inside the age window, most recent first."""
    cutoff = time.time() - max_age_days * 86400
    picked = []
    for item in items:
        key = item['title'].lower().strip()
        if not key or key in seen or timestamp(item) < cutoff:
            continue
        if relevant and not relevant(item):
            continue
        seen.add(key)
        picked.append(item)
    picked.sort(key=timestamp, reverse=True)
    return picked[:limit]


def main():
    seen = set()
    federal = select(gather([FEDERAL_TOPIC_FEED]), FEDERAL_MAX, seen, relevant=is_federal)
    print(f'federal topic feed: {len(federal)} Canadian headlines')
    federal += select(gather(FEDERAL_SEARCHES), FEDERAL_MAX, seen)
    federal.sort(key=timestamp, reverse=True)
    federal = federal[:FEDERAL_MAX]
    print(f'federal: {len(federal)} headlines')

    provincial = {}
    for prov in PROVINCES:
        items = gather([search_url(f'"{prov}" (politics OR legislature OR premier)')])
        picked = select(items, PROVINCE_MAX, seen)
        if not picked:
            picked = select(items, PROVINCE_MAX, seen, QUIET_MAX_AGE_DAYS)
        provincial[prov] = picked
        print(f'{prov}: {len(picked)} headlines')

    if not federal and not any(provincial.values()):
        raise SystemExit('No headlines fetched; keeping previous data')

    with open(OUT, 'w', encoding='utf-8') as f:
        json.dump({'federal': federal, 'provincial': provincial}, f,
                  indent=1, ensure_ascii=False)
    print(f'Saved {OUT}')


if __name__ == '__main__':
    main()
