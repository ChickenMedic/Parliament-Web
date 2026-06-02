import json

def generate_map():
    # 338 total seats
    # We want 12 columns by 32 rows.
    # 12 * 32 = 384
    # We need to remove 46 seats to make it 338.
    # We'll remove seats from the bottom rows (y = 28, 29, 30, 31), starting from the center aisle and outermost edges.
    
    # Let's define the party counts
    # Lib: 156, Con: 119, Bloc: 32, NDP: 24, Green: 2, Ind: 3, Vacant: 1
    # Total: 337 + 1 speaker = 338.
    
    counts = {
        'L': 156,
        'C': 119,
        'B': 32,
        'N': 24,
        'G': 2,
        'I': 3,
        'V': 1
    }
    
    # We will build a list of 338 valid grid coordinates (x, y)
    # x from 0 to 11. Left side: 0-5. Right side: 6-11.
    valid_coords = []
    
    for y in range(32):
        for x in range(12):
            # Let's carve out 46 seats from the back to make it trail off.
            # At the very back (y=28..31), the chamber narrows.
            if y >= 28:
                # Remove some seats from the edges
                dist_from_edge = min(x, 11 - x)
                # y=28: drop 2 from each edge (dist < 2) -> 4 seats
                # y=29: drop 3 from each edge (dist < 3) -> 6 seats
                # y=30: drop 4 from each edge (dist < 4) -> 8 seats
                # y=31: drop 5 from each edge (dist < 5) -> 10 seats
                # Total dropped = 4 + 6 + 8 + 10 = 28. Still need 18 more.
                
                # Let's drop seats from the center aisle at the back too.
                # Center is x=5,6
                # y=28..31: drop center 2 seats?
                pass
                
            # Actually, a simpler way to drop 46 seats:
            # Just don't add them. We will add seats if we haven't reached 338.
            # But the user said "the tail end of the seating are all grey... due to the way the seats trail off away from the speaker."
            # Grey means vacant/unassigned? Or grey means the grid background? 
            # "We've completely lost all the Bloc MPs, and the tail end of the seating are all grey. Like it should be 12 columns by 32 rows, and the end rows should only be 1 due the way the seats trail off away from the speaker."
            # Wait, "the end rows should only be 1" -> meaning the outermost columns? Or just 1 seat per row?
            # Probably means the last few rows only have 1 or 2 seats per side.
            
    # Let's just create a fixed list of 337 chars (exclude speaker who is rendered separately or maybe include speaker?)
    # Usually the speaker is the one at the head. Let's just assign 337 members + 1 vacant. 338.
    
    grid = [[' ' for _ in range(12)] for _ in range(32)]
    
    # Let's define which of the 12x32 grid spots are ACTIVE seats.
    # We need 338 active seats.
    active_seats = []
    for y in range(32):
        for x in range(12):
            active_seats.append((x,y))
            
    # We have 384. We need to remove 46.
    # Let's remove from the bottom corners (y=25..31, x near 0 and x near 11)
    # Let's do it manually.
    to_remove = [
        (0,25), (11,25),
        (0,26), (11,26),
        (0,27), (1,27), (10,27), (11,27),
        (0,28), (1,28), (2,28), (9,28), (10,28), (11,28),
        (0,29), (1,29), (2,29), (3,29), (8,29), (9,29), (10,29), (11,29),
        (0,30), (1,30), (2,30), (3,30), (4,30), (7,30), (8,30), (9,30), (10,30), (11,30),
        (0,31), (1,31), (2,31), (3,31), (4,31), (7,31), (8,31), (9,31), (10,31), (11,31),
    ]
    # Count of to_remove: 2 + 2 + 4 + 6 + 8 + 10 + 10 = 42.
    # We need 4 more removed. Let's remove (5,31), (6,31) (center aisle back) and (5,30), (6,30).
    to_remove += [(5,31), (6,31), (5,30), (6,30)]
    # Total removed = 46. Active = 384 - 46 = 338. Perfect.
    
    final_active = [s for s in active_seats if s not in to_remove]
    
    # Now we populate the final_active with our letters.
    # Left side (x < 6): Government (Liberals)
    # Right side (x >= 6): Opposition (Cons, Bloc, NDP, Green, Ind)
    
    # Lib: 156
    # Left side has exactly 6 columns. Total seats on left = 338 / 2 = 169.
    # Libs take 156. The remaining 13 seats on the left will be NDP/Ind/Vacant maybe? Or usually Gov spills over if they have > half, but here they have < half.
    # So left side: 156 Libs, then we can put NDP (24) -> wait, 156 + 13 = 169.
    # So left side can be 156 Libs, + 13 NDP.
    # Right side: 169 seats. Cons (119) + Bloc (32) + remaining NDP (11) + Green (2) + Ind (3) + Vacant (1) + Speaker (1).
    # 119 + 32 + 11 + 2 + 3 + 1 + 1 = 169. Perfect!
    
    left_queue = ['L']*156 + ['N']*13
    right_queue = ['C']*119 + ['B']*32 + ['N']*11 + ['G']*2 + ['I']*3 + ['V']*1 + ['S']*1
    
    for (x, y) in final_active:
        if x < 6:
            grid[y][x] = left_queue.pop(0) if left_queue else ' '
        else:
            grid[y][x] = right_queue.pop(0) if right_queue else ' '
            
    # Write to seating_map.txt
    lines = []
    lines.append("HOUSE OF COMMONS SEATING MAP - 12x32 Grid")
    lines.append("L=Liberal, C=Conservative, B=Bloc, N=NDP, G=Green, I=Independent, V=Vacant, S=Speaker")
    lines.append("Leave blank spaces [ ] for empty grid positions.")
    lines.append("")
    for y in range(32):
        row_str = "Row {:02d}: ".format(y+1)
        for x in range(12):
            if x == 6:
                row_str += "  ||  " # Center aisle
            row_str += f"[{grid[y][x]}]"
        lines.append(row_str)
        
    with open('seating_map.txt', 'w') as f:
        f.write('\n'.join(lines))
        
    print("Generated seating_map.txt perfectly.")

generate_map()
