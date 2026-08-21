"""Propose updates to src/data/scandals.json from recent news coverage.

Pulls Google News RSS headlines for each existing scandal (plus general
federal-scandal queries), then asks Claude to update timelines/statuses and
add genuinely major new scandals. Output is written back to scandals.json;
the CI workflow opens a pull request so a human reviews before publishing.

Run: ANTHROPIC_API_KEY=... python update_scandals.py
"""

import json
import os
import ssl
import sys
import time
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from datetime import date

import anthropic

SCANDALS = 'src/data/scandals.json'
MODEL = 'claude-opus-5'

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE
HEADERS = {'User-Agent': 'ParliaWeb/1.0 (personal project)'}

GENERAL_QUERIES = [
    'Canada federal government scandal',
    'Canada ethics commissioner investigation MP minister',
]


def fetch_news(query, limit=8):
    url = ('https://news.google.com/rss/search?q=' + urllib.parse.quote(query)
           + '&hl=en-CA&gl=CA&ceid=CA:en')
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req, context=ctx, timeout=45) as r:
        root = ET.fromstring(r.read())
    items = []
    for item in root.iter('item'):
        items.append({
            'title': item.findtext('title') or '',
            'source': item.findtext('source') or '',
            'date': item.findtext('pubDate') or '',
        })
        if len(items) >= limit:
            break
    return items


SCHEMA = {
    "type": "object",
    "properties": {
        "scandals": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "id": {"type": "string"},
                    "title": {"type": "string"},
                    "party": {"type": "string"},
                    "status": {"type": "string"},
                    "severity": {"type": "string", "enum": ["Critical", "High", "Medium", "Low"]},
                    "description": {"type": "string"},
                    "keyFigures": {"type": "array", "items": {"type": "string"}},
                    "timeline": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "date": {"type": "string"},
                                "event": {"type": "string"},
                            },
                            "required": ["date", "event"],
                            "additionalProperties": False,
                        },
                    },
                    "votes": {"type": "integer"},
                    "latestDevelopments": {"type": "string"},
                    "developmentsAsOf": {"type": "string"},
                },
                "required": ["id", "title", "party", "status", "severity",
                             "description", "keyFigures", "timeline", "votes",
                             "latestDevelopments", "developmentsAsOf"],
                "additionalProperties": False,
            },
        }
    },
    "required": ["scandals"],
    "additionalProperties": False,
}

PROMPT = """You maintain the "scandals" data file for a factual, non-partisan \
Canadian federal politics website. Below is the current data, followed by \
recent news headlines gathered per scandal and from general queries.

Update the data with these rules:
- Preserve every existing entry, its id, and its votes count. Never delete entries.
- Only make a change when the headlines clearly support it: append new timeline \
entries (date format like "Aug 2026"), update a "status", or refine an \
"Ongoing" timeline row into a dated one. The site ranks scandals by their most \
recent DATED timeline entry, so whenever headlines show a real development, \
record it as a dated row rather than leaving an undated "Ongoing" placeholder.
- Add a NEW scandal entry (next sequential id, votes 0) only if the headlines \
show a major federal political controversy covered by multiple outlets that is \
not already in the list. Minor gaffes or provincial stories do not qualify.
- Keep descriptions and events neutral, factual, and allegation-aware (say \
"alleged" where nothing is proven). No editorializing.
- For EVERY entry, write "latestDevelopments": 2-4 sentences answering "what \
is happening with this right now?" — is it before the courts, under active \
investigation, awaiting a report, effectively resolved, or dormant with no \
recent news? Base it on the headlines; if the headlines show nothing recent, \
say the story has gone quiet and give the last known state. Set \
"developmentsAsOf" to {today}.
- Apart from latestDevelopments/developmentsAsOf, if nothing warrants a \
change, return the data exactly as given.

CURRENT DATA:
{data}

HEADLINES:
{headlines}
"""


def main():
    with open(SCANDALS, encoding='utf-8') as f:
        scandals = json.load(f)

    headlines = {}
    for s in scandals:
        # First few title words make a decent news query.
        query = ' '.join(s['title'].split()[:5]) + ' Canada'
        try:
            headlines[s['title']] = fetch_news(query)
        except Exception as e:
            print(f"news fetch failed for {s['id']}: {e}")
        time.sleep(0.5)
    for q in GENERAL_QUERIES:
        try:
            headlines[q] = fetch_news(q)
        except Exception as e:
            print(f"news fetch failed for '{q}': {e}")
        time.sleep(0.5)

    client = anthropic.Anthropic()
    response = client.beta.messages.create(
        model=MODEL,
        max_tokens=16000,
        betas=["server-side-fallback-2026-07-01"],
        fallbacks="default",
        output_config={"format": {"type": "json_schema", "schema": SCHEMA}},
        messages=[{
            "role": "user",
            "content": PROMPT.format(
                data=json.dumps(scandals, indent=1, ensure_ascii=False),
                headlines=json.dumps(headlines, indent=1, ensure_ascii=False),
                today=date.today().strftime('%b %d, %Y'),
            ),
        }],
    )

    if response.stop_reason == "refusal":
        print("Model declined the request; leaving scandals.json unchanged.")
        return
    if response.stop_reason == "max_tokens":
        print("Output truncated; leaving scandals.json unchanged.", file=sys.stderr)
        sys.exit(1)

    text = next(b.text for b in response.content if b.type == "text")
    updated = json.loads(text)["scandals"]

    if updated == scandals:
        print("No changes proposed.")
        return

    with open(SCANDALS, 'w', encoding='utf-8') as f:
        json.dump(updated, f, indent=2, ensure_ascii=False)
        f.write('\n')
    print(f"Updated {SCANDALS} ({len(updated)} entries, was {len(scandals)}).")


if __name__ == '__main__':
    main()
