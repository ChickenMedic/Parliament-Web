import json
import csv
import sys

def import_seating():
    try:
        with open('seating_assignments.csv', 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            assignments = list(reader)
    except FileNotFoundError:
        print("seating_assignments.csv not found. Please run export_seating_to_csv.py first.")
        sys.exit(1)
        
    with open(r'g:\8-wall-project\Parliament-Website\src\data\seating.json', 'r', encoding='utf-8') as f:
        seats = json.load(f)
        
    for row in assignments:
        try:
            s_id = int(row['Seat_ID'])
            party = row['Party'].strip()
            if 0 <= s_id < len(seats):
                seats[s_id]['party'] = party
        except Exception as e:
            print(f"Skipping invalid row {row}: {e}")
            
    with open(r'g:\8-wall-project\Parliament-Website\src\data\seating.json', 'w', encoding='utf-8') as f:
        json.dump(seats, f, indent=2)

    print("Successfully imported seating assignments from CSV.")

if __name__ == "__main__":
    import_seating()
