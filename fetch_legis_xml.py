import urllib.request
import xml.etree.ElementTree as ET
import json
import ssl

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

req = urllib.request.urlopen('https://www.parl.ca/legisinfo/en/bills/xml', context=ctx)
xml_data = req.read()
root = ET.fromstring(xml_data)

bills = []
for bill in root.findall('Bill')[:50]: # limit to top 50
    b_id = bill.find('BillNumberFormatted').text if bill.find('BillNumberFormatted') is not None else "Unknown"
    title_el = bill.find('LongTitleEn')
    title = title_el.text if title_el is not None else ""
    
    short_title_el = bill.find('ShortTitleEn')
    if short_title_el is not None and short_title_el.text and short_title_el.text.strip():
        actual_title = short_title_el.text.strip()
    else:
        actual_title = title
        
    status_el = bill.find('LatestCompletedMajorStageName')
    status = status_el.text if status_el is not None else "In Progress"
    if "Royal Assent" in status:
        status = "Passed (Royal Assent)"
        
    # Calculate an importance score for sorting (e.g. Government bills C-1 to C-200 are usually important)
    is_gov = False
    importance = 0
    if b_id.startswith('C-') or b_id.startswith('S-'):
        num_part = b_id.split('-')[1]
        if num_part.isdigit():
            num = int(num_part)
            if b_id.startswith('C-') and num < 200:
                is_gov = True
                importance = 100 - num # lower number = more important
    
    parl_num = bill.find('ParliamentNumber').text
    sess_num = bill.find('SessionNumber').text
    link = f"https://www.parl.ca/legisinfo/en/bill/{parl_num}-{sess_num}/{b_id.lower().replace('-', '')}"
    text_link = f"https://www.parl.ca/DocumentViewer/en/{parl_num}-{sess_num}/bill/{b_id.lower().replace('-', '')}/first-reading"

    sponsor_el = bill.find('SponsorAffiliationTitle')
    sponsor = sponsor_el.text if sponsor_el is not None else "Unknown"
    
    ai_breakdown = f"Bill {b_id} ({actual_title}) was introduced by {sponsor}. The current status is: {status}. Read the full text or summary using the links."

    bills.append({
        "id": b_id,
        "title": actual_title,
        "desc": title, # Use long title as desc
        "status": status,
        "category": "Social" if not is_gov else "Government",
        "lib": "N/A",
        "con": "N/A",
        "ndp": "N/A",
        "bloc": "N/A",
        "aiBreakdown": ai_breakdown,
        "link": link,
        "text_link": text_link,
        "importance": importance
    })

# Sort by importance descending
bills.sort(key=lambda x: x['importance'], reverse=True)

with open(r'g:\8-wall-project\Parliament-Website\src\data\bills.json', 'w', encoding='utf-8') as f:
    json.dump(bills, f, indent=2)

print(f"Saved {len(bills)} bills to bills.json.")
