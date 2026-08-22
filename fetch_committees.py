"""Rebuild src/data/committees_full.json from the official House of Commons
committee membership pages (https://www.ourcommons.ca/committees/en/<ID>/members).

Each page lists Chair / Vice-Chairs / Members with party and riding, which we
scrape directly so rosters and party math always reflect the current Parliament.

Run: python fetch_committees.py
"""

import json
import ssl
import time
import urllib.request

from bs4 import BeautifulSoup

OUT = 'src/data/committees_full.json'

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

HEADERS = {'User-Agent': 'ParliaWeb/1.0 (personal project)'}

NAMES = {
    'FINA': 'Standing Committee on Finance',
    'HESA': 'Standing Committee on Health',
    'FAAE': 'Standing Committee on Foreign Affairs and International Development',
    'NDDN': 'Standing Committee on National Defence',
    'PACP': 'Standing Committee on Public Accounts',
    'ENVI': 'Standing Committee on Environment and Sustainable Development',
    'JUST': 'Standing Committee on Justice and Human Rights',
    'RNNR': 'Standing Committee on Natural Resources',
    'ETHI': 'Standing Committee on Access to Information, Privacy and Ethics',
    'AGRI': 'Standing Committee on Agriculture and Agri-Food',
    'CIMM': 'Standing Committee on Citizenship and Immigration',
    'INDU': 'Standing Committee on Industry and Technology',
    'SECU': 'Standing Committee on Public Safety and National Security',
    'TRAN': 'Standing Committee on Transport, Infrastructure and Communities',
    'HUMA': 'Standing Committee on Human Resources, Skills and Social Development and the Status of Persons with Disabilities',
    'CHPC': 'Standing Committee on Canadian Heritage',
}

# Standing committees shown on the site, with one-line mandates.
COMMITTEES = {
    'FINA': 'Studies the mandate, management and operation of the Department of Finance and the Canada Revenue Agency, including pre-budget consultations.',
    'HESA': 'Oversees Health Canada, the Public Health Agency of Canada, and CIHR, studying healthcare systems and health regulation.',
    'FAAE': 'Studies the policies and spending of Global Affairs Canada and monitors international development assistance.',
    'NDDN': 'Reviews the Department of National Defence and the Canadian Armed Forces: operations, defence policy, and procurement.',
    'PACP': 'The House oversight committee, chaired by an Opposition member, that reviews the Auditor General’s reports.',
    'ENVI': 'Studies matters relating to the environment, sustainable development, and climate change.',
    'JUST': 'Oversees the Department of Justice, federal courts, criminal law, and human-rights issues.',
    'RNNR': 'Studies the mandate, management, and operation of the Department of Natural Resources.',
    'ETHI': 'Reviews access to information, privacy, and conflict-of-interest issues involving public office holders.',
    'AGRI': 'Studies agriculture and agri-food policy, food supply chains, and support programs for producers.',
    'CIMM': 'Oversees Immigration, Refugees and Citizenship Canada, studying immigration levels, processing, and settlement.',
    'INDU': 'Studies industry, science and technology policy, including competition, spectrum, and research funding.',
    'SECU': 'Oversees Public Safety Canada, the RCMP, CBSA, and CSIS, studying national security and policing.',
    'TRAN': 'Studies transport and infrastructure policy, including rail, marine, air, and communities.',
    'HUMA': 'Studies employment, workforce development, income security, and housing programs.',
    'CHPC': 'Oversees Canadian Heritage: broadcasting, arts, sport, and official languages in culture.',
}


def fetch(url, tries=3):
    last = None
    for attempt in range(tries):
        try:
            req = urllib.request.Request(url, headers=HEADERS)
            with urllib.request.urlopen(req, context=ctx, timeout=45) as r:
                return r.read().decode('utf-8', errors='replace')
        except Exception as e:
            last = e
            time.sleep(2 * (attempt + 1))
    raise last


def parse_members(html):
    """Returns (committee_name, sections) where sections maps
    'Chair'/'Vice-Chairs'/'Members' to [(name, party)] without duplicates."""
    soup = BeautifulSoup(html, 'html.parser')
    h1 = soup.find('h1')
    name = h1.get_text(' ', strip=True) if h1 else ''

    sections = {}
    for section in soup.select('.member-section'):
        heading = section.find(['h2', 'h3', 'h4'])
        label = heading.get_text(strip=True) if heading else '?'
        seen = set()
        people = []
        for card in section.select('.committee-member-card'):
            parts = [t for t in card.stripped_strings]
            # Cards look like: [Hon.] First Last Party Riding Province
            parts = [p for p in parts if p not in ('Hon.', 'Right Hon.')]
            if len(parts) < 3:
                continue
            party_idx = next(
                (i for i, p in enumerate(parts)
                 if p in ('Liberal', 'Conservative', 'Bloc Québécois', 'NDP',
                          'Green Party', 'Independent')),
                None,
            )
            if party_idx is None or party_idx == 0:
                continue
            person = (' '.join(parts[:party_idx]), parts[party_idx])
            if person not in seen:
                seen.add(person)
                people.append(person)
        sections[label] = people
    return name, sections


def main():
    # Keep whatever we already have so a failed fetch never drops a committee
    # from the site — stale data beats a missing committee.
    try:
        with open(OUT, encoding='utf-8') as f:
            existing = {c['id']: c for c in json.load(f)}
    except (OSError, ValueError):
        existing = {}

    committees = []
    for cid, desc in COMMITTEES.items():
        url = f'https://www.ourcommons.ca/committees/en/{cid}/members'
        try:
            _, sections = parse_members(fetch(url))
        except Exception as e:
            print(f'  ! {cid} failed: {e}')
            sections = {}
        name = NAMES.get(cid, f'{cid} Committee')

        chair = sections.get('Chair', [])
        vice = sections.get('Vice-Chairs', [])
        members = sections.get('Members', [])
        everyone = chair + vice + members

        if not everyone:
            if cid in existing:
                print(f'  ! {cid}: no roster scraped, keeping previous data')
                committees.append(existing[cid])
            else:
                print(f'  ! {cid}: no roster scraped and no previous data, skipping')
            continue

        party_seats = {}
        for _, party in everyone:
            short = {'Bloc Québécois': 'Bloc', 'Green Party': 'Green'}.get(party, party)
            party_seats[short] = party_seats.get(short, 0) + 1

        committees.append({
            'id': cid,
            'name': name or f'{cid} Committee',
            'desc': desc,
            'url': f'https://www.ourcommons.ca/committees/en/{cid}',
            'workUrl': f'https://www.ourcommons.ca/committees/en/{cid}/Work',
            'chairName': chair[0][0] if chair else 'TBD',
            'viceChairs': [n for n, _ in vice],
            'members': [n for n, _ in members],
            'parties': {n: p for n, p in everyone},
            'partySeats': party_seats,
        })
        print(f'{cid}: chair={committees[-1]["chairName"]}, {len(everyone)} members')
        time.sleep(0.6)

    with open(OUT, 'w', encoding='utf-8') as f:
        json.dump(committees, f, indent=1, ensure_ascii=False)
    print(f'Saved {len(committees)} committees to {OUT}')


if __name__ == '__main__':
    main()
