import { useState, useRef, useEffect } from 'react';
import senateSeatingData from '../data/senate_seating.json';

const getSenateColor = (color: string) => {
  // Map SVG colors to nicer hex codes or keep them
  // #5b081d -> Speaker/Clerk
  // #845b87 -> Independent Senators Group (ISG)
  // #6495ed -> Conservative
  // #386b87 -> Canadian Senators Group (CSG)
  // silver -> Non-affiliated
  // white -> Vacant
  // #386b67 -> Progressive Senate Group (PSG)
  if (color === '#845b87') return '#4a90e2'; // ISG
  if (color === '#6495ed') return '#1a4782'; // Conservative
  if (color === '#386b67') return '#e83e8c'; // PSG
  if (color === '#386b87') return '#6f42c1'; // CSG
  if (color === 'silver') return '#808080'; // Non-affiliated
  if (color === 'white') return '#222222'; // Vacant
  return color; // Speaker defaults
};

const getSenateGroupName = (color: string) => {
  if (color === '#845b87') return 'Independent Senators Group';
  if (color === '#6495ed') return 'Conservative';
  if (color === '#386b67') return 'Progressive Senate Group';
  if (color === '#386b87') return 'Canadian Senators Group';
  if (color === 'silver') return 'Non-affiliated';
  if (color === 'white') return 'Vacant';
  return 'Speaker / Clerk';
};

const generateMockSenatorName = (index: number) => {
  const firstNames = ['Marc', 'Raymonde', 'Peter', 'Yuen', 'Dennis', 'Chantal', 'Percy', 'Rose-May', 'René', 'David', 'Jane', 'Paul', 'Linda', 'Robert', 'Mary'];
  const lastNames = ['Gold', 'Saint-Germain', 'Harder', 'Pau', 'Dawson', 'Petitclerc', 'Downe', 'Poirier', 'Cormier', 'Wells', 'Smith', 'Tremblay', 'MacDonald', 'Gagnon', 'Wilson'];
  const first = firstNames[index % firstNames.length];
  const last = lastNames[(index * 3) % lastNames.length];
  return `Hon. ${first} ${last}`;
};
export const SenateChart = () => {
  const [hoveredSeat, setHoveredSeat] = useState<number | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const resizeObserver = new ResizeObserver(entries => {
      for (let entry of entries) {
        const { width, height } = entry.contentRect;
        const scaleX = width / 250;
        const scaleY = height / 640;
        setScale(Math.min(scaleX, scaleY, 1));
      }
    });
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    return () => resizeObserver.disconnect();
  }, []);

  return (
    <div ref={containerRef} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', flex: 1, minHeight: '100%', overflow: 'hidden' }}>
      <div style={{ width: 0, height: 0, position: 'relative' }}>
        <div style={{ position: 'absolute', width: '230px', height: '600px', left: '-115px', top: '-300px', transform: `scale(${scale})`, transformOrigin: 'center', transition: 'transform 0.1s ease-out' }}>
          <div style={{ position: 'absolute', width: '100%', height: '100%', filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.5))' }}>
          {senateSeatingData.map((seat: any, index: number) => {
            const isHovered = hoveredSeat === index;
            const fill = getSenateColor(seat.color);
            
            // viewBox="-80 50 600 230"
            const norm_x = seat.x + 80;
            const norm_y = seat.y - 50;
            const rotatedX = 230 - norm_y - 18;
            const rotatedY = norm_x;
            
            return (
              <div
                key={index}
                style={{
                  position: 'absolute',
                  left: rotatedX,
                  top: rotatedY,
                  width: '18px',
                  height: '18px',
                  backgroundColor: fill,
                  borderRadius: '4px',
                  opacity: isHovered ? 1 : 0.8,
                  border: isHovered ? '2px solid white' : 'none',
                  boxSizing: 'border-box',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  transform: isHovered ? 'scale(1.2)' : 'scale(1)',
                  zIndex: isHovered ? 10 : 1
                }}
                onMouseEnter={() => setHoveredSeat(index)}
                onMouseLeave={() => setHoveredSeat(null)}
              />
            );
          })}
        </div>

        {/* HTML Hover Tooltip Overlay */}
        {hoveredSeat !== null && (
          <div style={{
            position: 'absolute',
            left: 230 - (senateSeatingData[hoveredSeat].y - 50) - 18 + 9, // rotatedX + 9
            top: senateSeatingData[hoveredSeat].x + 80 - 10,              // rotatedY - 10
            transform: 'translate(-50%, -100%)',
            background: 'rgba(20,25,35,0.95)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.2)',
            padding: '12px',
            borderRadius: '8px',
            pointerEvents: 'none',
            zIndex: 1000,
            boxShadow: '0 8px 20px rgba(0,0,0,0.4)',
            minWidth: '200px'
          }}>
            <div style={{ fontWeight: 'bold', color: 'white', marginBottom: '4px', textAlign: 'center' }}>
              {senateSeatingData[hoveredSeat].color === 'white' ? 'Vacant Seat' : generateMockSenatorName(hoveredSeat)}
            </div>
            <div style={{ fontSize: '12px', color: getSenateColor(senateSeatingData[hoveredSeat].color), fontWeight: 'bold', textAlign: 'center', marginBottom: '4px' }}>
              {getSenateGroupName(senateSeatingData[hoveredSeat].color)}
            </div>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)', textAlign: 'center' }}>
              Seat {hoveredSeat + 1}
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
};
