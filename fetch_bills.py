"""Rebuild src/data/bills.json for the current session (45-1).

Sources:
  1. LEGISinfo JSON  - bill list, statuses, stage dates, sponsors.
     https://www.parl.ca/legisinfo/en/bills/json?parlsession=45-1
  2. openparliament  - recorded divisions; each vote detail carries the
     official party positions (Yes/No + caucus disagreement).
     https://api.openparliament.ca/votes/?session=45-1
  3. Google News RSS - recent media coverage per bill, which naturally spans
     multiple outlets (CBC, CTV, Global News, National Post, ...).

Google News matches loosely, so headlines are filtered before they are kept:
an item has to name this bill (or its distinctive short title) and post-date
the session, because bill numbers are reused every Parliament and "Bill C-7"
from 2021 is a different bill. Surviving items are merged into whatever the
previous run kept, which keeps the daily diff to genuinely new coverage.

Run: python fetch_bills.py            (full refresh, ~2-4 minutes)
     python fetch_bills.py --no-media (skip the news fetch and keep the
                                       coverage already in bills.json)
"""

import json
import re
import ssl
import sys
import time
import unicodedata
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from email.utils import parsedate_to_datetime

SESSION = '45-1'
PARL, SESS = SESSION.split('-')
# The day the 45th Parliament convened. Nothing published before it can be
# about a bill of this session, whatever number a headline quotes.
SESSION_START = '2025-05-26'
OUT = 'src/data/bills.json'
POLITICIANS = 'src/data/politicians.json'
SENATORS = 'src/data/senators.json'
MEDIA_PER_BILL = 6

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


# Ordered most-specific first; the first pattern to match wins, so a bill
# about military justice lands in Defence rather than Justice. Patterns run
# over the short and long titles together.
CATEGORY_RULES = [
    ('Indigenous', r'indigenous|first nations|inuit|m[ée]tis|indian act|self-government agreement|modern treaty|land claim|residential school'),
    ('Democracy & Elections', r'elections act|electoral|referend|clarity act|parliament of canada act|oath of office|constitution act|notwithstanding|senate reform|lobbying|conflict of interest act'),
    ('Housing', r'housing|home buyer|build canada homes|mortgage|\brent(al|er)?\b|homeless'),
    ('Defence', r'defence|defense|military|armed forces|veteran|wartime|\bnato\b'),
    ('Justice', r'criminal|justice|judicial|sentenc|\bbail\b|parole|\bcourt|offence|firearm|polic(e|ing)|corrections and conditional release|victim|extortion|impaired driving|divorce act|traffick|prosecut|violence|non-disclosure agreement|civil law|hate'),
    ('Immigration', r'immigra|citizenship|refugee|border|asylum|passport'),
    ('Trade & Foreign Affairs', r'free trade|trade agreement|accession|tariff|\bexport|\bimport|foreign affairs|international development|sanction|comprehensive economic|foreign interference'),
    ('Health', r'health|pharmacare|dental|\bdrug|medical|disease|disorder|cancer|\bmental|injur(y|ies)|alcohol|tobacco|vaping|addiction|organ donor|donation|allerg|heart|cardiac|stroke|diabet|vaccin|palliative'),
    ('Environment', r'environment|climate|emission|carbon|pollut|species|\bpark(s)?\b|conservation|water quality|flood|drought|wildfire|coast'),
    ('Energy & Resources', r'energy|pipeline|\boil\b|\bgas\b|nuclear|natural resources|mining|electricity|renewable'),
    ('Consumer', r'consumer|labelling|packaging|warranty|right to repair|durability|access to and use of cash|credit card|grocer|food price|betting|gambling|lottery'),
    ('Agriculture & Fisheries', r'agricultur|\bfarm|livestock|fisher|aquacultur|\bfood\b|grain|dairy|\bcrop'),
    ('Labour', r'labour|labor|employment|worker|strike|pension|wage|workplace|apprentic|\bunion\b'),
    ('Finance', r'budget|\btax|financ|economic|fiscal|revenue|\bbank|excise|customs|income|benefit|affordab|insurance|cost of living|consolidated revenue fund'),
    ('Industry & Business', r'small business|department of industry|entrepreneur|competition act|bankruptcy|insolvency|procurement'),
    ('Transport', r'transport|railway|marine|aviation|aeronautics|highway|shipping|vehicle|space launch|air passenger|infrastructure|canada post|postal'),
    ('Digital & Media', r'broadcast|online|digital|privacy|artificial intelligence|telecommunications|lawful access|cyber|internet|social media|spectrum|electronic'),
    ('Families & Seniors', r'child(ren)?\b|youth|famil(y|ies)|senior|\belder|caregiv|silver alert|daycare|child care'),
    ('Commemoration', r'heritage (month|day)|national .{0,40}\bday\b|\bday act\b|\bweek act\b|awareness (month|week|day)|\bmedal\b|memorial|commemorat|national bird|national symbol|emblem|recognition act'),
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

# "Bill C-12", "Bill C 12", "C‑12" — Google News titles use every dash there
# is, and some drop the separator entirely.
BILL_NUM_RE = re.compile(r'\b([CS])[-‐‑‒–— ]?(\d{1,3})\b', re.I)

# Supply bills are numbered and passed in batches and attract no coverage of
# their own; every headline quoting their number belongs to an older bill.
NO_MEDIA_RE = re.compile(r'appropriation act|pro forma', re.I)


def pub_date(raw):
    """RSS pubDate -> YYYY-MM-DD, or None if it won't parse."""
    try:
        return parsedate_to_datetime(raw).date().isoformat()
    except Exception:
        return None


def distinctive_title(short_title):
    """A short title specific enough to identify a bill on its own."""
    t = (short_title or '').strip()
    if len(t) < 12 or t.lower().startswith('an act'):
        return None
    return t


def media_floor(bill):
    """Earliest date a headline could plausibly be about this bill."""
    dates = [s['date'] for s in bill['stages'] if s['date']]
    return max(min(dates) if dates else SESSION_START, SESSION_START)


def media_is_relevant(bill, item, floor):
    """Keep a headline only if it names this bill and post-dates the session."""
    date = pub_date(item['date'])
    if not date or date < floor:
        return False
    numbers = {f'{m.group(1).upper()}-{int(m.group(2))}'
               for m in BILL_NUM_RE.finditer(item['title'])}
    if bill['id'] in numbers:
        return True
    # A headline about some other bill is about some other bill.
    if numbers:
        return False
    title = distinctive_title(bill['title'])
    return bool(title and title.lower() in item['title'].lower())


def fetch_feed(query):
    url = ('https://news.google.com/rss/search?q=' + urllib.parse.quote(query)
           + '&hl=en-CA&gl=CA&ceid=CA:en')
    root = ET.fromstring(get(url))
    items = []
    for item in root.iter('item'):
        title = item.findtext('title') or ''
        source = item.findtext('source') or ''
        # Google appends " - Source" to titles; strip it since we show source.
        if source and title.endswith(' - ' + source):
            title = title[: -len(' - ' + source)]
        items.append({
            'title': title,
            'source': source,
            'link': item.findtext('link') or '',
            'date': item.findtext('pubDate') or '',
        })
    return items


def fetch_media(bill, previous):
    """Relevant news items for a bill, merged with what the last run kept.

    Google's phrase search is approximate, so both queries are treated as
    candidates and every item — new or carried over — has to pass the same
    relevance check. A bad item that slipped in before is dropped on the next
    run; a good one survives until six newer ones push it out.
    """
    if NO_MEDIA_RE.search(bill['title'] + ' ' + bill['longTitle']):
        return []
    queries = [f'"Bill {bill["id"]}" Canada']
    title = distinctive_title(bill['title'])
    if title:
        queries.append(f'"{title}" Canada')

    candidates = list(previous)
    for query in queries:
        try:
            candidates.extend(fetch_feed(query))
        except Exception as e:
            print(f'  ! media fetch failed for {bill["id"]}: {e}')
        time.sleep(0.4)

    floor = media_floor(bill)
    kept, seen = [], set()
    for item in candidates:
        key = item['title'].lower().strip()
        if not key or key in seen or not media_is_relevant(bill, item, floor):
            continue
        seen.add(key)
        kept.append(item)
    # Newest first, so the diff moves at the pace coverage actually does.
    kept.sort(key=lambda i: pub_date(i['date']) or '', reverse=True)
    return kept[:MEDIA_PER_BILL]


# -------------------------------------------------------------------- main

# senators.json carries the full caucus name; the cards want the short form.
SENATE_GROUPS = {
    'Independent Senators Group': 'ISG',
    'Canadian Senators Group': 'CSG',
    'Progressive Senate Group': 'PSG',
    'Conservative': 'Conservative',
    'Non-affiliated': 'Non-affiliated',
}


def main():
    with_media = '--no-media' not in sys.argv

    with open(POLITICIANS, encoding='utf-8') as f:
        politicians = json.load(f)['objects']
    party_by_mp = {p['name']: p['current_party']['short_name']['en'] for p in politicians}

    with open(SENATORS, encoding='utf-8') as f:
        group_by_senator = {s['name']: SENATE_GROUPS.get(s['group'], s['group'])
                            for s in json.load(f) if s['group'] != 'Vacant'}

    def norm_name(n):
        n = unicodedata.normalize('NFKD', n)
        n = ''.join(c for c in n if not unicodedata.combining(c)).lower()
        return re.sub(r'[^a-z ]', ' ', n)

    def lookup(name, table):
        """Honorifics, middle names, and accents differ between LEGISinfo and
        our rosters; match if a roster name's tokens are a subset of the
        sponsor's (catches "Michelle Rempel Garner" vs "Michelle Rempel")."""
        if table.get(name):
            return table[name]
        stoks = set(norm_name(name).split())
        for roster_name, value in table.items():
            rtoks = set(norm_name(roster_name).split())
            if rtoks and rtoks.issubset(stoks):
                return value
        return None

    def sponsor_party_of(sponsor, is_senator):
        if not sponsor:
            return None
        name = re.sub(r'^(Right\s+)?Hon\.\s+', '', sponsor).strip()
        if is_senator:
            # Senators who have since retired are off the current roster; the
            # chamber is still the useful label for their bills.
            return lookup(name, group_by_senator) or 'Senator'
        return lookup(name, party_by_mp)

    # Carried forward so a day when Google returns a thin result set doesn't
    # wipe coverage the site has already vetted, and so a sponsor who has left
    # the House doesn't take their party label with them.
    try:
        with open(OUT, encoding='utf-8') as f:
            published = json.load(f)
        previous_media = {b['id']: b.get('media') or [] for b in published}
        previous_party = {b['id']: b.get('sponsorParty') for b in published}
    except (FileNotFoundError, ValueError):
        previous_media, previous_party = {}, {}

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

        # The role field is occasionally a stray internal value
        # ("HansardDisplay"), so derive the role we display from the signals
        # that are reliable: a Senate affiliation id, or a ministerial title.
        role = (detail.get('SponsorAffiliationRoleNameEn') or '').strip()
        sponsor_title = (detail.get('SponsorAffiliationTitleEn') or '').strip() or None
        is_senator = role == 'Senator' or detail.get('SponsorSenateSystemAffiliationId') is not None
        # The title is either a portfolio or the plain "Member of Parliament"
        # / "Senator" placeholder, so a portfolio means a cabinet sponsor —
        # which covers the offices that don't read as "Minister of ...", like
        # the President of the Treasury Board.
        has_portfolio = bool(sponsor_title) and sponsor_title not in ('Member of Parliament', 'Senator')
        if is_senator:
            sponsor_role = 'Senator'
        elif has_portfolio or role in ('Minister', 'Prime Minister'):
            sponsor_role = 'Minister'
        elif sponsor:
            sponsor_role = 'Member of Parliament'
        else:
            sponsor_role = None
        if not has_portfolio:
            sponsor_title = None
        sponsor_party = sponsor_party_of(sponsor, is_senator)
        if sponsor_party is None:
            # politicians.json is the *current* roster, so an MP who resigned
            # or lost a by-election drops off it — but the bill they sponsored
            # still belongs to the party they sat for. Keep what we published.
            sponsor_party = previous_party.get(num)

        # Which committee currently has the bill — the join key matches the
        # ids in committees_full.json.
        cd = detail.get('LatestBillEventCommitteeDetails') or {}
        committee = None
        if cd.get('CommitteeAcronym'):
            committee = {
                'acronym': cd['CommitteeAcronym'],
                'name': cd.get('CommitteeNameEn') or cd['CommitteeAcronym'],
                'chamber': 'Senate' if cd.get('IsSenateCommittee') else 'House of Commons',
                'url': (f'https://www.ourcommons.ca/committees/en/{cd["CommitteeAcronym"]}'
                        if cd.get('IsHouseOfCommonsCommittee') else None),
            }

        bill_type = b.get('BillDocumentTypeNameEn') or ''
        is_gov = 'Government' in bill_type

        # DocumentViewer and LEGISinfo URLs need the hyphenated form ("c-2");
        # the unhyphenated form 404s or redirects to a generic overview page.
        slug = num.lower()

        # Publications list which text versions exist; empty = nothing to read
        # yet, so the UI greys out the "View Full Text" button (text_link null).
        pubs = detail.get('Publications') or []
        text_link = None
        if pubs:
            stage_slug = (pubs[-1].get('PublicationTypeNameEn') or 'First Reading').lower().replace(' ', '-')
            text_link = f'https://www.parl.ca/DocumentViewer/en/{SESSION}/bill/{slug}/{stage_slug}'
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
            'sponsorRole': sponsor_role,
            'sponsorTitle': sponsor_title,
            'sponsorRiding': (detail.get('SponsorConstituencyNameEn') or '').strip() or None,
            'latestActivity': detail.get('LatestBillEventTypeNameEn'),
            'latestActivityDate': clean_date(detail.get('LatestBillEventDateTime')),
            'latestActivityChamber': detail.get('LatestBillEventChamberNameEn'),
            'committee': committee,
            'stages': stages,
            'partyPositions': positions.get(num),
            'votes': vote_summaries.get(num, []),
            'media': [],
            'link': f'https://www.parl.ca/legisinfo/en/bill/{SESSION}/{slug}',
            'text_link': text_link,
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
            bill['media'] = fetch_media(bill, previous_media.get(bill['id'], []))
            if (i + 1) % 10 == 0:
                print(f'  media {i + 1}/{len(targets)}')
    else:
        for bill in bills:
            bill['media'] = previous_media.get(bill['id'], [])

    # A half-delivered upstream response should not quietly empty the docket.
    if previous_media and len(bills) < 0.8 * len(previous_media):
        raise SystemExit(
            f'Refusing to write: got {len(bills)} bills but {len(previous_media)} '
            f'are already published — upstream looks incomplete.')

    with open(OUT, 'w', encoding='utf-8') as f:
        json.dump(bills, f, indent=1, ensure_ascii=False)
    n_pos = sum(1 for b in bills if b['partyPositions'])
    n_media = sum(1 for b in bills if b['media'])
    n_party = sum(1 for b in bills if b['sponsorParty'])
    print(f'Saved {len(bills)} bills ({n_pos} with party positions, {n_media} with media, '
          f'{n_party} with a sponsor party) to {OUT}')


if __name__ == '__main__':
    main()
