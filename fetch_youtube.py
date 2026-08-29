"""Refresh src/data/youtube_videos.json with recent uploads from the channels
in src/data/youtube_channels.json, via YouTube's public per-channel RSS feeds
(free, no API key).

Registry entries only need "handle" (the @name without the @), "name", and
"about"; this script resolves and caches each channel's id back into the
registry on first sight.

Run: python fetch_youtube.py
"""

import json
import re
import ssl
import time
import urllib.request
import xml.etree.ElementTree as ET

REGISTRY = 'src/data/youtube_channels.json'
OUT = 'src/data/youtube_videos.json'
MAX_AGE_DAYS = 21
PER_CHANNEL = 4

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

HEADERS = {'User-Agent': 'Mozilla/5.0 (ParliaWeb personal project)'}

ATOM = '{http://www.w3.org/2005/Atom}'
MEDIA = '{http://search.yahoo.com/mrss/}'
YT = '{http://www.youtube.com/xml/schemas/2015}'


def get(url):
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req, context=ctx, timeout=45) as r:
        return r.read()


def resolve_channel_id(handle):
    html = get(f'https://www.youtube.com/@{handle}').decode('utf-8', 'replace')
    # externalId is the page's own channel; "channelId" often matches a
    # recommended channel first, so try it last.
    for pat in (r'"externalId":"(UC[0-9A-Za-z_-]{22})"',
                r'channel_id=(UC[0-9A-Za-z_-]{22})',
                r'"channelId":"(UC[0-9A-Za-z_-]{22})"'):
        m = re.search(pat, html)
        if m:
            return m.group(1)
    raise ValueError(f'no channel id found on @{handle} page')


def fetch_videos(channel_id):
    root = ET.fromstring(get(
        f'https://www.youtube.com/feeds/videos.xml?channel_id={channel_id}'))
    cutoff = time.time() - MAX_AGE_DAYS * 86400
    videos = []
    for entry in root.iter(f'{ATOM}entry'):
        published = entry.findtext(f'{ATOM}published') or ''
        try:
            ts = time.mktime(time.strptime(published[:19], '%Y-%m-%dT%H:%M:%S'))
            ts -= time.timezone  # published is UTC (+00:00)
        except ValueError:
            continue
        if ts < cutoff:
            continue
        thumb = entry.find(f'{MEDIA}group/{MEDIA}thumbnail')
        videos.append({
            'videoId': entry.findtext(f'{YT}videoId') or '',
            'title': entry.findtext(f'{ATOM}title') or '',
            'date': published,
            'thumbnail': thumb.get('url') if thumb is not None else None,
        })
        if len(videos) >= PER_CHANNEL:
            break
    return videos


def main():
    with open(REGISTRY, encoding='utf-8') as f:
        channels = json.load(f)

    out = []
    registry_changed = False
    for ch in channels:
        if not ch.get('channelId'):
            try:
                ch['channelId'] = resolve_channel_id(ch['handle'])
                registry_changed = True
                print(f"resolved @{ch['handle']} -> {ch['channelId']}")
            except Exception as e:
                print(f"warning: could not resolve @{ch['handle']}: {e}")
                continue
        try:
            videos = fetch_videos(ch['channelId'])
        except Exception as e:
            print(f"warning: feed failed for @{ch['handle']}: {e}")
            continue
        for v in videos:
            out.append({
                'channel': ch['name'],
                'handle': ch['handle'],
                'about': ch.get('about', ''),
                **v,
            })
        print(f"@{ch['handle']}: {len(videos)} recent videos")
        time.sleep(0.5)

    if registry_changed:
        with open(REGISTRY, 'w', encoding='utf-8') as f:
            json.dump(channels, f, indent=1, ensure_ascii=False)

    if not out:
        raise SystemExit('No videos fetched; keeping previous data')

    out.sort(key=lambda v: v['date'], reverse=True)
    with open(OUT, 'w', encoding='utf-8') as f:
        json.dump(out, f, indent=1, ensure_ascii=False)
    print(f'Saved {len(out)} videos to {OUT}')


if __name__ == '__main__':
    main()
