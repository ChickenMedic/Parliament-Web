"""Generate plain-language summaries for bills in src/data/bills.json.

For each bill without an entry in src/data/bill_summaries.json, fetches the
bill's full text XML from parl.ca and asks Claude for a one-paragraph
overview plus a sectioned executive summary ("deeper dive"). Only missing
bills are summarized, so routine runs cost pennies; the first run covers the
whole docket. The CI workflow ships the result through the editorial PR so
a human reviews new summaries before they publish.

Run: ANTHROPIC_API_KEY=... python update_bill_summaries.py
"""

import json
import ssl
import sys
import urllib.request
import xml.etree.ElementTree as ET
from concurrent.futures import ThreadPoolExecutor
from datetime import date

import anthropic

BILLS = 'src/data/bills.json'
OUT = 'src/data/bill_summaries.json'
MODEL = 'claude-opus-5'
MAX_TEXT_CHARS = 14000
SESSION = '45-1'

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE
HEADERS = {'User-Agent': 'ParliaWeb/1.0 (personal project)'}


def fetch_bill_text(bill_id):
    """Full text from parl.ca's per-version XML; latest version wins."""
    parl, sess = SESSION.split('-')
    num = int(bill_id.split('-')[1])
    kind = 'Government' if num < 200 else 'Private'
    for version in (4, 3, 2, 1):
        url = (f'https://www.parl.ca/Content/Bills/{parl}{sess}/{kind}/'
               f'{bill_id}/{bill_id}_{version}/{bill_id}_E.xml')
        try:
            req = urllib.request.Request(url, headers=HEADERS)
            with urllib.request.urlopen(req, context=ctx, timeout=45) as r:
                root = ET.fromstring(r.read())
            text = ' '.join(t.strip() for t in root.itertext() if t.strip())
            return text[:MAX_TEXT_CHARS]
        except Exception:
            continue
    return None


SCHEMA = {
    "type": "object",
    "properties": {
        "overview": {"type": "string"},
        "deepDive": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "heading": {"type": "string"},
                    "body": {"type": "string"},
                },
                "required": ["heading", "body"],
                "additionalProperties": False,
            },
        },
    },
    "required": ["overview", "deepDive"],
    "additionalProperties": False,
}

PROMPT = """You write plain-language bill explainers for a factual, \
non-partisan Canadian politics website. Summarize this bill for an ordinary \
reader with no legal background.

Bill {id}: {title}
Long title: {long_title}
Type: {btype} | Sponsor: {sponsor} | Status: {status}

{text_section}

{media_section}

Return:
- "overview": ONE paragraph (3-5 sentences) saying what the bill does and why \
it matters, in plain language.
- "deepDive": 3-5 sections, each with a short "heading" and a "body" of 1-2 \
paragraphs, forming an executive summary. Good headings: "What the bill \
does", "Key provisions", "Who it affects", "Context". Base everything \
strictly on the material above — never invent provisions. Stay neutral: \
describe, don't advocate.

If the FULL TEXT is available, base the summary on it and treat headlines \
only as context. If the text has NOT been published, write instead about \
what the bill is REPORTED or expected to contain, drawing on the headlines \
and the title: hedge every claim ("reporting suggests", "is expected to"), \
attribute claims to coverage rather than to the bill, include a "What we \
don't know yet" section, and never present speculation as enacted text. The \
site labels these summaries as speculative.
"""


def summarize(client, bill):
    text = fetch_bill_text(bill['id'])
    text_section = (f'FULL TEXT (may be truncated):\n{text}' if text
                    else 'The bill text has not been published yet.')
    media = bill.get('media') or []
    media_section = ('NEWS HEADLINES ABOUT THIS BILL:\n' + '\n'.join(
        f"- {m['title']} ({m.get('source') or 'News'}, {m.get('date', '')})"
        for m in media[:10]) if media else 'No news headlines found for this bill.')
    response = client.beta.messages.create(
        model=MODEL,
        max_tokens=4000,
        betas=["server-side-fallback-2026-07-01"],
        fallbacks="default",
        output_config={"format": {"type": "json_schema", "schema": SCHEMA}},
        messages=[{
            "role": "user",
            "content": PROMPT.format(
                id=bill['id'], title=bill['title'], long_title=bill['longTitle'],
                btype=bill['type'], sponsor=bill['sponsor'] or 'Unknown',
                status=bill['status'], text_section=text_section,
                media_section=media_section,
            ),
        }],
    )
    if response.stop_reason != "end_turn":
        raise RuntimeError(f"stop_reason={response.stop_reason}")
    result = json.loads(next(b.text for b in response.content if b.type == "text"))
    result['hadFullText'] = bool(text)
    result['generated'] = date.today().isoformat()
    return result


def main():
    with open(BILLS, encoding='utf-8') as f:
        bills = json.load(f)
    try:
        with open(OUT, encoding='utf-8') as f:
            summaries = json.load(f)
    except FileNotFoundError:
        summaries = {}

    # Summarize missing bills, and re-do title-only summaries once text exists.
    todo = [b for b in bills
            if b['id'] not in summaries
            or (not summaries[b['id']].get('hadFullText') and b.get('text_link'))]
    if not todo:
        print('All bills already summarized.')
        return
    print(f'Summarizing {len(todo)} bills...')

    failures = 0

    def work(bill):
        nonlocal failures
        try:
            summaries[bill['id']] = summarize(client, bill)
            print(f"  {bill['id']} done")
        except Exception as e:
            failures += 1
            print(f"  {bill['id']} FAILED: {e}", file=sys.stderr)

    client = anthropic.Anthropic()
    with ThreadPoolExecutor(max_workers=3) as pool:
        list(pool.map(work, todo))

    with open(OUT, 'w', encoding='utf-8') as f:
        json.dump(summaries, f, indent=1, ensure_ascii=False)
        f.write('\n')
    print(f'Saved {len(summaries)} summaries to {OUT} ({failures} failures).')
    if failures and failures >= len(todo):
        sys.exit(1)


if __name__ == '__main__':
    main()
