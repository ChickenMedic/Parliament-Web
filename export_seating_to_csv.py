import json
import csv

def export_seating():
    with open(r'g:\8-wall-project\Parliament-Website\src\data\seating.json', 'r', encoding='utf-8') as f:
        seats = json.load(f)
        
    with open('seating_assignments.csv', 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(['Seat_ID', 'Party', 'Note'])
        
        for i, s in enumerate(seats):
            # i is the Seat_ID corresponding to the JSON index
            writer.writerow([i, s.get('party', 'Independent'), f"x={s['x']}, y={s['y']}"])

    print("Exported seating assignments to seating_assignments.csv")

if __name__ == "__main__":
    export_seating()
