import { useState, useRef, useEffect, useMemo } from 'react';
import senatorsData from '../data/senators.json';

interface Senator {
  name: string;
  group: string;
  color: string;
  province: string;
  appointedBy: string;
  appointedDate: string;
}

// Order in which groups are seated (Conservatives on the Speaker's left,
// matching their role as opposition; the independent groups fill the rest).
const GROUP_ORDER = [
  'Conservative',
  'Canadian Senators Group',
  'Progressive Senate Group',
  'Independent Senators Group',
  'Non-affiliated',
  'Vacant',
];

const CHART_W = 230;
const CHART_H = 600;
const SEAT = 16;

/** Generated Senate chamber: two banks of desks facing each other across the
 * centre aisle, Speaker's chair at the head. One desk per senator (105). */
const buildSeats = (senators: Senator[]) => {
  const sorted = [...senators].sort(
    (a, b) => GROUP_ORDER.indexOf(a.group) - GROUP_ORDER.indexOf(b.group),
  );

  // 3 columns per side, 18 rows: 54 desks per side, 108 slots for 105 entries.
  const positions: { x: number; y: number }[] = [];
  const rows = 18;
  const rowPitch = 29;
  const colPitch = 25;
  const topMargin = 60;
  for (let side = 0; side < 2; side++) {
    for (let col = 0; col < 3; col++) {
      for (let row = 0; row < rows; row++) {
        const x = side === 0 ? 14 + col * colPitch : CHART_W - 14 - SEAT - col * colPitch;
        positions.push({ x, y: topMargin + row * rowPitch });
      }
    }
  }

  // Left bank (side 0) first: Conservatives and CSG; then right bank.
  return sorted.map((senator, i) => ({ ...positions[i], senator, id: i }));
};

export const SenateChart = () => {
  const [hoveredSeat, setHoveredSeat] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  const seats = useMemo(() => buildSeats(senatorsData as Senator[]), []);

  useEffect(() => {
    const resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setScale(Math.min(width / (CHART_W + 20), height / (CHART_H + 40), 1));
      }
    });
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    return () => resizeObserver.disconnect();
  }, []);

  const hovered = hoveredSeat !== null ? seats[hoveredSeat] : null;

  return (
    <div ref={containerRef} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', flex: 1, minHeight: '100%', overflow: 'hidden' }}>
      <div style={{ width: 0, height: 0, position: 'relative' }}>
        <div style={{ position: 'absolute', width: `${CHART_W}px`, height: `${CHART_H}px`, left: `${-CHART_W / 2}px`, top: `${-CHART_H / 2}px`, transform: `scale(${scale})`, transformOrigin: 'center', transition: 'transform 0.1s ease-out' }}>
          <div style={{ position: 'absolute', width: '100%', height: '100%', filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.5))' }}>
            {/* Speaker's chair */}
            <div
              title="Speaker of the Senate"
              style={{ position: 'absolute', left: `${CHART_W / 2 - 14}px`, top: '14px', width: '28px', height: '20px', background: '#5b081d', border: '1.5px solid #d4af37', borderRadius: '4px' }}
            />
            <div style={{ position: 'absolute', left: 0, right: 0, top: '38px', textAlign: 'center', fontSize: '8px', letterSpacing: '1px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>
              Speaker
            </div>

            {seats.map(seat => {
              const isHovered = hoveredSeat === seat.id;
              return (
                <div
                  key={seat.id}
                  style={{
                    position: 'absolute',
                    left: seat.x,
                    top: seat.y,
                    width: `${SEAT}px`,
                    height: `${SEAT}px`,
                    backgroundColor: seat.senator.color,
                    borderRadius: '4px',
                    opacity: isHovered ? 1 : seat.senator.group === 'Vacant' ? 0.5 : 0.85,
                    border: isHovered ? '2px solid white' : 'none',
                    boxSizing: 'border-box',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    transform: isHovered ? 'scale(1.25)' : 'scale(1)',
                    zIndex: isHovered ? 10 : 1,
                  }}
                  onMouseEnter={() => setHoveredSeat(seat.id)}
                  onMouseLeave={() => setHoveredSeat(null)}
                />
              );
            })}
          </div>

          {hovered && (
            <div style={{
              position: 'absolute',
              left: hovered.x + SEAT / 2,
              top: hovered.y - 10,
              transform: 'translate(-50%, -100%)',
              background: 'rgba(20,25,35,0.95)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.2)',
              padding: '12px',
              borderRadius: '8px',
              pointerEvents: 'none',
              zIndex: 1000,
              boxShadow: '0 8px 20px rgba(0,0,0,0.4)',
              minWidth: '220px',
            }}>
              <div style={{ fontWeight: 'bold', color: 'white', marginBottom: '4px', textAlign: 'center', fontSize: '13px' }}>
                {hovered.senator.name}
              </div>
              <div style={{ fontSize: '11px', color: hovered.senator.color, fontWeight: 'bold', textAlign: 'center', marginBottom: '6px' }}>
                {hovered.senator.group}
              </div>
              {hovered.senator.province && (
                <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.7)', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '2px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '6px' }}>
                  <div><strong>Province:</strong> {hovered.senator.province}</div>
                  {hovered.senator.appointedBy && (
                    <div><strong>Appointed by:</strong> {hovered.senator.appointedBy} ({hovered.senator.appointedDate})</div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
