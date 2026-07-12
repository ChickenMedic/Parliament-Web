"""Refresh src/data/leaders_news.json with recent headlines for the Prime
Minister and the Leader of the Official Opposition via Google News RSS
(aggregates CBC, CTV, Global News, the Globe and Mail, National Post, ...).

Run: python fetch_leader_news.py
"""

import json
import ssl
import time
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET

OUT = 'src/data/leaders_news.json'

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

HEADERS = {'User-Agent': 'ParliaWeb/1.0 (personal project)'}

QUERIES = {
    'pm': '"Mark Carney" Canada Prime Minister',
    'opposition': '"Pierre Poilievre" Conservative',
}


def fetch_news(query, limit=6):
    url = ('https://news.google.com/rss/search?q=' + urllib.parse.quote(query)
           + '&hl=en-CA&gl=CA&ceid=CA:en')
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
        if len(items) >= limit:
            break
    return items


def main():
    out = {}
    for key, query in QUERIES.items():
        out[key] = fetch_news(query)
        print(f'{key}: {len(out[key])} headlines')
        time.sleep(0.5)
    with open(OUT, 'w', encoding='utf-8') as f:
        json.dump(out, f, indent=1, ensure_ascii=False)
    print(f'Saved {OUT}')


if __name__ == '__main__':
    main()
