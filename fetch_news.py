"""Refresh src/data/news.json with the Canadian politics headlines the public
is actually seeing, via Google News RSS (free, no API key).

Output shape:
  { "federal": [items...], "provincial": { "Ontario": [items...], ... } }

Federal combines the Canada politics topic feed with a federal-politics
search; each province and territory gets its own politics search.

Run: python fetch_news.py
"""

import json
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

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

HEADERS = {'User-Agent': 'ParliaWeb/1.0 (personal project)'}


def search_url(query):
    return ('https://news.google.com/rss/search?q=' + urllib.parse.quote(query)
            + '&hl=en-CA&gl=CA&ceid=CA:en')


# Topic feed = Google News' own Canadian politics front page; the search adds
# federal-specific depth. Duplicates across feeds are collapsed by title.
FEDERAL_FEEDS = [
    'https://news.google.com/rss/headlines/section/topic/POLITICS?hl=en-CA&gl=CA&ceid=CA:en',
    search_url('Canada Parliament OR "House of Commons" OR "federal government"'),
]

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


def collect(urls, limit, seen):
    cutoff = time.time() - MAX_AGE_DAYS * 86400
    merged = []
    for url in urls:
        try:
            items = fetch_feed(url)
        except Exception as e:
            print(f'warning: feed failed ({e}); continuing')
            continue
        for item in items:
            key = item['title'].lower().strip()
            if not key or key in seen or timestamp(item) < cutoff:
                continue
            seen.add(key)
            merged.append(item)
        time.sleep(0.5)
    merged.sort(key=timestamp, reverse=True)
    return merged[:limit]


def main():
    seen = set()
    federal = collect(FEDERAL_FEEDS, FEDERAL_MAX, seen)
    print(f'federal: {len(federal)} headlines')

    provincial = {}
    for prov in PROVINCES:
        items = collect(
            [search_url(f'"{prov}" (politics OR legislature OR premier)')],
            PROVINCE_MAX, seen)
        provincial[prov] = items
        print(f'{prov}: {len(items)} headlines')

    if not federal and not any(provincial.values()):
        raise SystemExit('No headlines fetched; keeping previous data')

    with open(OUT, 'w', encoding='utf-8') as f:
        json.dump({'federal': federal, 'provincial': provincial}, f,
                  indent=1, ensure_ascii=False)
    print(f'Saved {OUT}')


if __name__ == '__main__':
    main()
