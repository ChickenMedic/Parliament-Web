"""Rebuild src/data/senators.json from Wikipedia's "List of current senators
of Canada" table (kept current by editors within days of appointments).

Output: one entry per sitting senator with name, caucus group, province,
appointing PM, and appointment year, plus one "Vacant" entry per empty seat
so the chart always draws all 105 seats.

Run: python fetch_senators.py   (requires pandas + lxml)
"""

import io
import json
import ssl
import urllib.request

import pandas as pd

OUT = 'src/data/senators.json'
URL = 'https://en.wikipedia.org/wiki/List_of_current_senators_of_Canada'
TOTAL_SEATS = 105

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

GROUPS = {
    'ISG': ('Independent Senators Group', '#4a90e2'),
    'CSG': ('Canadian Senators Group', '#6f42c1'),
    'PSG': ('Progressive Senate Group', '#e83e8c'),
    'CPC': ('Conservative', '#1a4782'),
    'NA': ('Non-affiliated', '#808080'),
}
VACANT_COLOR = '#c0c0c0'

PM_NAMES = {
    'Chrétien': 'Jean Chrétien', 'Martin': 'Paul Martin', 'Harper': 'Stephen Harper',
    'Trudeau': 'Justin Trudeau', 'Carney': 'Mark Carney', 'Mulroney': 'Brian Mulroney',
    'Campbell': 'Kim Campbell',
}


def main():
    req = urllib.request.Request(URL, headers={'User-Agent': 'ParliaWeb/1.0 (personal project)'})
    html = urllib.request.urlopen(req, context=ctx, timeout=60).read().decode('utf-8')
    df = pd.read_html(io.StringIO(html))[0]

    name_col = next(c for c in df.columns if str(c).startswith('Name') and df[c].notna().sum() > 50)
    aff_col = next(c for c in df.columns if 'affiliation' in str(c).lower())
    prov_col = next(c for c in df.columns if 'Province' in str(c))
    date_col = next(c for c in df.columns if 'nominated' in str(c).lower())
    by_cols = [c for c in df.columns if 'advice' in str(c).lower()]

    senators = []
    for _, row in df.iterrows():
        name = row[name_col]
        if pd.isna(name):
            continue
        aff = row[aff_col] if pd.notna(row[aff_col]) else 'NA'
        group, color = GROUPS.get(str(aff).strip(), GROUPS['NA'])
        by = next((str(row[c]) for c in by_cols if pd.notna(row[c])), '')
        date = str(row[date_col]) if pd.notna(row[date_col]) else ''
        senators.append({
            'name': str(name).strip(),
            'group': group,
            'color': color,
            'province': str(row[prov_col]).strip() if pd.notna(row[prov_col]) else '',
            'appointedBy': PM_NAMES.get(by.strip(), by.strip()),
            'appointedDate': date[:4],
        })

    if len(senators) < 80:
        raise SystemExit(f'Only parsed {len(senators)} senators - layout may have changed.')

    vacancies = TOTAL_SEATS - len(senators)
    for _ in range(max(0, vacancies)):
        senators.append({
            'name': 'Vacant Seat', 'group': 'Vacant', 'color': VACANT_COLOR,
            'province': '', 'appointedBy': '', 'appointedDate': '',
        })

    from collections import Counter
    print(Counter(s['group'] for s in senators))
    with open(OUT, 'w', encoding='utf-8') as f:
        json.dump(senators, f, indent=1, ensure_ascii=False)
    print(f'Saved {len(senators)} entries ({vacancies} vacancies) to {OUT}')


if __name__ == '__main__':
    main()
