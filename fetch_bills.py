"""Rebuild src/data/bills.json for the current session (45-1).

Sources:
  1. LEGISinfo JSON  - bill list, statuses, stage dates, sponsors.
     https://www.parl.ca/legisinfo/en/bills/json?parlsession=45-1
  2. openparliament  - recorded divisions; each vote detail carries the
     official party positions (Yes/No + caucus disagreement).
     https://api.openparliament.ca/votes/?session=45-1
  3. Google News RSS - recent media coverage per bill, which naturally spans
     multiple outlets (CBC, CTV, Global News, National Post, ...).

Run: python fetch_bills.py            (full refresh, ~2-4 minutes)
     python fetch_bills.py --no-media (skip the news fetch)
"""

import json
import re
import ssl
import sys
import time
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET

SESSION = '45-1'
PARL, SESS = SESSION.split('-')
OUT = 'src/data/bills.json'
POLITICIANS = 'src/data/politicians.json'

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

HEADERS = {'User-Agent': 'ParliaWeb/1.0 (personal project; contact: samdawson93@outlook.com)'}


def get(url, retries=3):
    for attempt in range(retries):
        try:
            req = urllib.request.Request(url, headers=HEADERS)
            with urllib.request.urlopen(req, context=ctx, timeout=45) as r:
                return r.read()
        except Exception as e:
            if attempt == retries - 1:
                raise
            time.sleep(1.5 * (attempt + 1))


def get_json(url):
    return json.loads(get(url).decode('utf-8'))


# ---------------------------------------------------------------- LEGISinfo

def fetch_legisinfo_bills():
    data = get_json(f'https://www.parl.ca/legisinfo/en/bills/json?parlsession={SESSION}&pagesize=1000')
    print(f'LEGISinfo: {len(data)} bills in session {SESSION}')
    return data


def fetch_bill_detail(slug):
    """Per-bill JSON. The list endpoint stopped populating sponsor and
    latest-event fields (mid-2026); they are only in the detail payload."""
    try:
        b = get_json(f'https://www.parl.ca/legisinfo/en/bill/{SESSION}/{slug}/json')
        return b[0] if isinstance(b, list) else b
    except Exception:
        return {}


# The seven major milestones a bill passes on its way to becoming law.
# For Senate bills the two chambers are swapped when rendering; the data
# stores the raw dates and the UI orders them by originating chamber.
STAGE_KEYS = [
    ('houseFirstReading', 'PassedHouseFirstReadingDateTime', 'First reading (House)'),
    ('houseSecondReading', 'PassedHouseSecondReadingDateTime', 'Second reading (House)'),
    ('houseThirdReading', 'PassedHouseThirdReadingDateTime', 'Third reading (House)'),
    ('senateFirstReading', 'PassedSenateFirstReadingDateTime', 'First reading (Senate)'),
    ('senateSecondReading', 'PassedSenateSecondReadingDateTime', 'Second reading (Senate)'),
    ('senateThirdReading', 'PassedSenateThirdReadingDateTime', 'Third reading (Senate)'),
    ('royalAssent', 'ReceivedRoyalAssentDateTime', 'Royal Assent'),
]


def clean_date(value):
    if not value:
        return None
    return value.split('T')[0]


CATEGORY_RULES = [
    ('Finance', r'budget|tax|financ|economic|fiscal|revenue|bank|excise|customs tariff'),
    ('Justice', r'criminal code|justice|sentenc|bail|court|offence|firearm|polic'),
    ('Environment', r'environment|climate|emission|carbon|energy|pollut|species|park'),
    ('Health', r'health|pharmacare|dental|drug|food|medical'),
    ('Labour', r'labour|labor|employment|worker|strike|pension|wage'),
    ('Immigration', r'immigra|citizenship|refugee|border'),
    ('Indigenous', r'indigenous|first nations|inuit|métis|metis|indian act'),
    ('Defence', r'defence|defense|military|armed forces|veteran'),
    ('Transport', r'transport|railway|marine|aviation|highway'),
    ('Digital & Media', r'broadcast|online|digital|privacy|artificial intelligence|telecommunications'),
]


def categorize(text):
    t = text.lower()
    for name, pattern in CATEGORY_RULES:
        if re.search(pattern, t):
            return name
    return 'Other'


# ------------------------------------------------------------ openparliament

def fetch_votes():
    """All recorded divisions for the session, oldest first."""
    votes, url = [], f'https://api.openparliament.ca/votes/?session={SESSION}&limit=100&format=json'
    while url:
        data = get_json(url)
        votes.extend(data['objects'])
        nxt = data.get('pagination', {}).get('next_url')
        url = f'https://api.openparliament.ca{nxt}' if nxt else None
        time.sleep(0.3)
    votes.reverse()
    print(f'openparliament: {len(votes)} recorded divisions')
    return votes


def vote_weight(description):
    d = description.lower()
    if '3rd reading' in d or 'third reading' in d:
        return 3
    if '2nd reading' in d or 'second reading' in d:
        return 2
    return 1


def fetch_party_positions(votes):
    """bill number -> {parties, basedOn, voteDate, voteUrl, weight} from the
    most decisive recorded division (3rd reading > 2nd reading > other,
    later date wins ties). Also returns bill number -> [vote summaries]."""
    by_bill_votes = {}
    for v in votes:
        if not v.get('bill_url'):
            continue
        m = re.match(rf'/bills/{SESSION}/([A-Z]+-\d+)/', v['bill_url'])
        if not m:
            continue
        num = m.group(1)
        by_bill_votes.setdefault(num, []).append(v)

    positions = {}
    total = sum(len(vs) for vs in by_bill_votes.values())
    done = 0
    for num, vs in by_bill_votes.items():
        best = max(vs, key=lambda v: (vote_weight(v['description']['en']), v['date']))
        done += 1
        try:
            detail = get_json(f'https://api.openparliament.ca{best["url"]}?format=json')
        except Exception as e:
            print(f'  ! vote detail failed for {num}: {e}')
            continue
        parties = {}
        for pv in detail.get('party_votes', []):
            short = pv['party']['short_name']['en']
            parties[short] = {
                'vote': pv['vote'],
                'disagreement': pv.get('disagreement') or 0.0,
            }
        if parties:
            positions[num] = {
                'parties': parties,
                'basedOn': best['description']['en'],
                'voteDate': best['date'],
                'voteResult': best['result'],
                'voteUrl': f'https://openparliament.ca{best["url"]}',
            }
        if done % 20 == 0:
            print(f'  vote details {done}/{len(by_bill_votes)} bills')
        time.sleep(0.35)

    summaries = {
        num: [
            {
                'number': v['number'],
                'date': v['date'],
                'description': v['description']['en'],
                'result': v['result'],
                'yea': v['yea_total'],
                'nay': v['nay_total'],
            }
            for v in vs
        ]
        for num, vs in by_bill_votes.items()
    }
    return positions, summaries


# ------------------------------------------------------------------- media

def fetch_media(bill_number, short_title):
    """Top news items for a bill via Google News RSS (multiple outlets)."""
    query = f'"Bill {bill_number}" Canada'
    if short_title and len(short_title) < 60 and not short_title.startswith('An Act'):
        query = f'"Bill {bill_number}" OR "{short_title}" Canada'
    url = ('https://news.google.com/rss/search?q=' + urllib.parse.quote(query)
           + '&hl=en-CA&gl=CA&ceid=CA:en')
    try:
        root = ET.fromstring(get(url))
    except Exception as e:
        print(f'  ! media fetch failed for {bill_number}: {e}')
        return []
    items = []
    for item in root.iter('item'):
        title = item.findtext('title') or ''
        link = item.findtext('link') or ''
        pub = item.findtext('pubDate') or ''
        source = item.findtext('source') or ''
        # Google appends " - Source" to titles; strip it since we show source.
        if source and title.endswith(' - ' + source):
            title = title[: -len(' - ' + source)]
        items.append({'title': title, 'source': source, 'link': link, 'date': pub})
        if len(items) >= 5:
            break
    return items


# -------------------------------------------------------------------- main

def main():
    with_media = '--no-media' not in sys.argv

    with open(POLITICIANS, encoding='utf-8') as f:
        politicians = json.load(f)['objects']
    party_by_mp = {p['name']: p['current_party']['short_name']['en'] for p in politicians}

    import unicodedata

    def norm_name(n):
        n = unicodedata.normalize('NFKD', n)
        n = ''.join(c for c in n if not unicodedata.combining(c)).lower()
        return re.sub(r'[^a-z ]', ' ', n)

    def sponsor_party_of(sponsor):
        if not sponsor:
            return None
        name = re.sub(r'^(Right\s+)?Hon\.\s+', '', sponsor).strip()
        if party_by_mp.get(name):
            return party_by_mp[name]
        # Honorifics, middle names, and accents differ between LEGISinfo and
        # openparliament; match if an MP's tokens are a subset of the sponsor's
        # (catches "Michelle Rempel Garner" vs "Michelle Rempel").
        stoks = set(norm_name(name).split())
        for mp_name, mp_party in party_by_mp.items():
            ptoks = set(norm_name(mp_name).split())
            if ptoks and ptoks.issubset(stoks):
                return mp_party
        # Senators aren't in politicians.json; flag them rather than None.
        if sponsor.startswith('Sen.') or 'Senator' in sponsor:
            return 'Senator'
        return None

    raw = fetch_legisinfo_bills()
    votes = fetch_votes()
    positions, vote_summaries = fetch_party_positions(votes)

    bills = []
    for i, b in enumerate(raw):
        num = b['NumberCode']
        # Skip the two ceremonial pro forma bills; they never advance.
        if num in ('C-1', 'S-1'):
            continue

        # Sponsor and latest-event fields only live in the per-bill payload now.
        detail = fetch_bill_detail(num.lower())
        if (i + 1) % 25 == 0:
            print(f'  bill details {i + 1}/{len(raw)}')
        time.sleep(0.2)
        long_title = (b.get('LongTitleEn') or '').strip()
        short_title = (b.get('ShortTitleEn') or '').strip()
        title = short_title or long_title

        stages = []
        for key, field, label in STAGE_KEYS:
            stages.append({'key': key, 'label': label, 'date': clean_date(b.get(field))})
        # Senate bills go through the Senate first; order the steps accordingly.
        if num.startswith('S-'):
            stages = stages[3:6] + stages[0:3] + stages[6:]

        sponsor_name = (detail.get('SponsorPersonName') or '').strip()
        honorific = (detail.get('SponsorPersonShortHonorific') or '').strip()
        sponsor = f'{honorific} {sponsor_name}'.strip() or None if sponsor_name else None
        sponsor_party = sponsor_party_of(sponsor)

        bill_type = b.get('BillDocumentTypeNameEn') or ''
        is_gov = 'Government' in bill_type

        slug = num.lower().replace('-', '')
        bills.append({
            'id': num,
            'title': title,
            'longTitle': long_title,
            'status': b.get('StatusNameEn') or 'Unknown',
            'receivedRoyalAssent': bool(b.get('ReceivedRoyalAssentDateTime') or b.get('ReceivedRoyalAssent')),
            'type': 'Government Bill' if is_gov else 'Private Member’s Bill' if num.startswith('C-') else 'Senate Public Bill',
            'originatingChamber': 'Senate' if num.startswith('S-') else 'House of Commons',
            'category': categorize(short_title + ' ' + long_title),
            'sponsor': sponsor,
            'sponsorParty': sponsor_party,
            'latestActivity': detail.get('LatestBillEventTypeNameEn'),
            'latestActivityDate': clean_date(detail.get('LatestBillEventDateTime')),
            'stages': stages,
            'partyPositions': positions.get(num),
            'votes': vote_summaries.get(num, []),
            'media': [],
            'link': f'https://www.parl.ca/legisinfo/en/bill/{SESSION}/{slug}',
            'text_link': f'https://www.parl.ca/DocumentViewer/en/{SESSION}/bill/{slug}/first-reading',
        })

    # Sort: government bills first by number, then private members' bills.
    def sort_key(bill):
        prefix, n = bill['id'].split('-')
        return (int(n) >= 200, prefix != 'C', int(n))

    bills.sort(key=sort_key)

    if with_media:
        # Media coverage for bills people actually hear about: all government
        # bills plus anything that reached a recorded vote.
        targets = [b for b in bills if b['type'] == 'Government Bill' or b['votes']]
        print(f'Fetching media for {len(targets)} bills...')
        for i, bill in enumerate(targets):
            bill['media'] = fetch_media(bill['id'], bill['title'])
            if (i + 1) % 10 == 0:
                print(f'  media {i + 1}/{len(targets)}')
            time.sleep(0.4)

    with open(OUT, 'w', encoding='utf-8') as f:
        json.dump(bills, f, indent=1, ensure_ascii=False)
    n_pos = sum(1 for b in bills if b['partyPositions'])
    n_media = sum(1 for b in bills if b['media'])
    print(f'Saved {len(bills)} bills ({n_pos} with party positions, {n_media} with media) to {OUT}')


if __name__ == '__main__':
    main()
