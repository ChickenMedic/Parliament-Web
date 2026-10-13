"""Refresh src/data/leaders_news.json with recent headlines for the Prime
Minister and the Leader of the Official Opposition via Google News RSS
(aggregates CBC, CTV, Global News, the Globe and Mail, National Post, ...).

Google News sometimes answers a GitHub runner with a 429/503 or just hangs,
so each query is retried with a growing pause, and a query that still fails
keeps the headlines already on disk rather than blanking them. The run only
fails if every query failed, which is what a genuinely broken feed looks like.

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


RETRY_PAUSES = (5, 15, 30)


def get(url):
    last = None
    for attempt, pause in enumerate(RETRY_PAUSES + (None,)):
        try:
            req = urllib.request.Request(url, headers=HEADERS)
            with urllib.request.urlopen(req, context=ctx, timeout=45) as r:
                return r.read()
        except Exception as e:  # HTTP error, timeout, reset: all worth a retry
            last = e
            if pause is None:
                break
            print(f'  attempt {attempt + 1} failed ({e}); retrying in {pause}s')
            time.sleep(pause)
    raise last


def fetch_news(query, limit=6):
    url = ('https://news.google.com/rss/search?q=' + urllib.parse.quote(query)
           + '&hl=en-CA&gl=CA&ceid=CA:en')
    root = ET.fromstring(get(url))
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
    try:
        with open(OUT, encoding='utf-8') as f:
            previous = json.load(f)
    except (FileNotFoundError, ValueError):
        previous = {}

    out, failed = {}, []
    for key, query in QUERIES.items():
        try:
            out[key] = fetch_news(query)
            print(f'{key}: {len(out[key])} headlines')
        except Exception as e:
            failed.append(key)
            out[key] = previous.get(key, [])
            print(f'{key}: fetch failed ({e}); keeping {len(out[key])} previous headlines')
        time.sleep(0.5)

    if len(failed) == len(QUERIES):
        raise SystemExit('Every query failed; leaving the committed data untouched.')

    with open(OUT, 'w', encoding='utf-8') as f:
        json.dump(out, f, indent=1, ensure_ascii=False)
    print(f'Saved {OUT}')


if __name__ == '__main__':
    main()
