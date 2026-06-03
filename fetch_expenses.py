import urllib.request
import os
import json
import ssl

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

# We'll fetch the aggregated XML for the latest quarter (e.g. 2024 quarter 1 or whatever is available)
# Actually, the user wants us to put the expenses into their own folders.
# Let's save a summary JSON in src/data/expenses/
output_dir = r'g:\8-wall-project\Parliament-Website\src\data\expenses'
os.makedirs(output_dir, exist_ok=True)

# Try fetching a known proactive disclosure XML or just a sample.
# Often the House of Commons uses URLs like: https://www.ourcommons.ca/ProactiveDisclosure/en/members/2024/1/xml
# If that fails, we can fallback to generating a dummy dataset so the frontend has data to work with.
def fetch_expenses():
    url = "https://www.ourcommons.ca/ProactiveDisclosure/en/members/2023/1/xml"
    print(f"Fetching expenditures from {url}...")
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        xml_data = urllib.request.urlopen(req, context=ctx).read()
        
        xml_path = os.path.join(output_dir, "expenses_2023_1.xml")
        with open(xml_path, 'wb') as f:
            f.write(xml_data)
        print(f"Saved {xml_path}")
        
    except Exception as e:
        print(f"Failed to fetch real XML: {e}")
        print("Generating a sample dataset for demonstration...")
        sample_data = {
            "members": [
                {"name": "Mark Carney", "travel": 12000, "office": 45000, "staff": 150000},
                {"name": "Francis Scarpaleggia", "travel": 8000, "office": 30000, "staff": 140000}
            ]
        }
        with open(os.path.join(output_dir, "sample_expenses.json"), 'w') as f:
            json.dump(sample_data, f, indent=2)
        print("Saved sample expenses.")

if __name__ == "__main__":
    fetch_expenses()
