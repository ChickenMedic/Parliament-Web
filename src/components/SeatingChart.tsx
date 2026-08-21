import { useMemo, useState, useEffect, useRef } from 'react';
import seatingData from '../data/seating.json';
import politiciansData from '../data/politicians.json';
import rolesMap from '../data/roles.json';

interface MP {
  name: string;
  url: string;
  image?: string;
  email?: string;
  voice?: string;
  twitter?: string;
  role?: string;
  current_party: { short_name: { en: string } };
  current_riding: { province: string; name: { en: string } };
}

interface Seat {
  x: number;
  y: number;
  /** null on a desk the floorplan marks unoccupied. */
  name: string | null;
  party: string;
  color: string;
  seatNumber?: number;
  benchRow: number;
  chairCol: number;
  cabinet: boolean;
  pm: boolean;
}

const politicians = politiciansData.objects as MP[];
const seats = seatingData as Seat[];
const roles = rolesMap as Record<string, string>;

/**
 * The Speaker presides from the chair at the head of the chamber, not from a bench
 * desk, so he has no row in seating.json and is drawn as his own marker.
 */
const SPEAKER_NAME = 'Francis Scarpaleggia';
const SPEAKER_MARKER_ID = 'SPEAKER';
const SPEAKER_GOLD = '#ffd700';
const VACANT_SEAT = '#c0c0c0';

// Chart geometry. Seat coords in seating.json are stored unrotated; the chamber
// is drawn rotated 90° so the Speaker is at the top. Kept in step with fetch_floorplan.py.
const CHART_WIDTH = 356;
const CHART_HEIGHT = 958;
const SEAT_WIDTH = 20;
const SEAT_HEIGHT = 21;
const SEAT_TOP_OFFSET = 50;

const seatLeft = (seat: Seat) => CHART_WIDTH - seat.y - SEAT_WIDTH;
const seatTop = (seat: Seat) => seat.x + SEAT_TOP_OFFSET;

const getPartyColor = (party: string) => {
  switch (party.toLowerCase()) {
    case 'liberal': return '#d71920';
    case 'conservative': return '#1a4782';
    case 'ndp': return '#f37021';
    case 'bloc québécois':
    case 'bloc': return '#33b2cc';
    case 'green':
    case 'green party': return '#3d9b35';
    default: return '#808080';
  }
};

const speakerMP = politicians.find((p) => p.name === SPEAKER_NAME);

/**
 * Cabinet membership comes from the floorplan itself, which flags ministers' desks.
 * Matching on the role string misses the thirteen ministers whose titles never say
 * "minister" — the President of the Treasury Board and the twelve Secretaries of State.
 */
const matchesHighlightRole = (seat: { cabinet: boolean; pm: boolean; mp: MP | null }, highlightRole: string) => {
  if (highlightRole === 'Cabinet') return seat.cabinet || seat.pm;
  if (highlightRole === 'Shadow Cabinet') {
    const role = seat.mp?.role?.toLowerCase();
    return Boolean(role && (role.includes('critic') || role.includes('shadow')));
  }
  return true;
};

export const SeatingChart = ({ selectedMP, setSelectedMP, highlightProvince, highlightRole }: { selectedMP: MP | null, setSelectedMP: (mp: MP | null) => void, highlightProvince?: string, highlightRole?: string }) => {
  // Desks the floorplan marks unoccupied have no name and render as vacant.
  const seatsWithMPs = useMemo(() => {
    const mpsByName = new Map(
      politicians.map((p) => [p.name, { ...p, role: roles[p.name] }])
    );

    return seats.map((seat, index) => ({
      ...seat,
      id: seat.seatNumber ?? index,
      mp: seat.name ? mpsByName.get(seat.name) ?? null : null,
    }));
  }, []);

  const [hoveredSeat, setHoveredSeat] = useState<number | string | null>(null);
  const hoveredSeatData = useMemo(
    () => seatsWithMPs.find((seat) => seat.id === hoveredSeat) ?? null,
    [seatsWithMPs, hoveredSeat]
  );

  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.85);

  useEffect(() => {
    const resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        const scaleX = width / 380; // Added some padding margin
        const scaleY = height / 1000;
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
          <div style={{ position: 'absolute', width: `${CHART_WIDTH}px`, height: `${CHART_HEIGHT}px`, left: `${-CHART_WIDTH / 2}px`, top: `${-CHART_HEIGHT / 2}px`, transform: `scale(${scale})`, transformOrigin: 'center', transition: 'transform 0.1s ease-out' }}>
            {/* Left/Right Side Annotations */}
            {[
              { label: 'Government', side: 'left' as const, rotation: -90 },
              { label: 'Opposition', side: 'right' as const, rotation: 90 },
            ].map(({ label, side, rotation }) => (
              <div key={label} style={{
                position: 'absolute',
                [side]: '-110px',
                top: '80px',
                bottom: '40px',
                width: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                pointerEvents: 'none',
                zIndex: 5
              }}>
                <div style={{
                  transform: `rotate(${rotation}deg)`,
                  color: 'rgba(255, 255, 255, 0.25)',
                  fontSize: '36px',
                  fontWeight: 'bold',
                  letterSpacing: '6px',
                  whiteSpace: 'nowrap',
                  textTransform: 'uppercase',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  {label}
                </div>
              </div>
            ))}

            <div style={{ position: 'absolute', width: '100%', height: '100%', filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.5))' }}>

            {/* Speaker */}
            <div style={{ position: 'absolute', top: '10px', width: '100%', display: 'flex', justifyContent: 'center', zIndex: 10, pointerEvents: 'none' }}>
              <div
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', pointerEvents: 'auto', transition: 'transform 0.2s' }}
                onClick={() => speakerMP && setSelectedMP(speakerMP)}
                onMouseOver={(e) => (e.currentTarget.style.transform = 'scale(1.2)')}
                onMouseOut={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                onMouseEnter={() => setHoveredSeat(SPEAKER_MARKER_ID)}
                onMouseLeave={() => setHoveredSeat(null)}
              >
                <div style={{ width: '20px', height: '20px', background: selectedMP?.url === speakerMP?.url ? '#fff' : SPEAKER_GOLD, borderRadius: '4px', border: '2px solid #fff', boxSizing: 'border-box', boxShadow: selectedMP?.url === speakerMP?.url ? '0 0 15px #fff' : '0 0 10px rgba(255, 215, 0, 0.4)', marginBottom: '4px' }}></div>
                <strong style={{ fontSize: '11px', opacity: 0.8, color: 'white' }}>Speaker</strong>
              </div>
            </div>

                {seatsWithMPs.map((seat) => {
                  const isSelected = selectedMP && seat.mp && selectedMP.name === seat.mp.name;
                  const isHovered = hoveredSeat === seat.id;

                  let isHighlighted = true;
                  if (highlightProvince || highlightRole) {
                    isHighlighted = Boolean(
                      seat.mp &&
                      (!highlightProvince || seat.mp.current_riding.province === highlightProvince) &&
                      (!highlightRole || matchesHighlightRole(seat, highlightRole))
                    );
                  }

                  let opacity = 0.7;
                  if (isSelected || isHovered) opacity = 1;
                  else if (highlightProvince || highlightRole) opacity = isHighlighted ? 1 : 0.1;

                  const fill = seat.mp ? getPartyColor(seat.mp.current_party.short_name.en) : VACANT_SEAT;

                  return (
                    <div
                      key={seat.id}
                      style={{
                        position: 'absolute',
                        left: seatLeft(seat),
                        top: seatTop(seat),
                        width: `${SEAT_WIDTH}px`,
                        height: `${SEAT_HEIGHT}px`,
                        backgroundColor: fill,
                        borderRadius: '4px',
                        opacity: opacity,
                        border: isSelected
                          ? '2px solid white'
                          : isHovered
                            ? '2px solid rgba(255,255,255,0.5)'
                            : seat.pm
                              ? `2px solid ${SPEAKER_GOLD}`
                              : 'none',
                        boxShadow: seat.pm && !isSelected ? '0 0 8px rgba(255, 215, 0, 0.6)' : 'none',
                        boxSizing: 'border-box',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: seat.mp ? 'pointer' : 'default',
                        transition: 'all 0.2s ease',
                        transform: isHovered ? 'scale(1.2)' : 'scale(1)',
                        zIndex: isHovered ? 10 : 1
                      }}
                      onMouseEnter={() => setHoveredSeat(seat.id)}
                      onMouseLeave={() => setHoveredSeat(null)}
                      onClick={() => {
                        if (seat.mp) {
                          setSelectedMP(seat.mp);
                        }
                      }}
                    >
                      {(seat.cabinet || seat.pm) && (
                        <div style={{
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          background: seat.pm ? SPEAKER_GOLD : 'rgba(255,255,255,0.9)',
                          pointerEvents: 'none'
                        }} />
                      )}
                    </div>
                  );
                })}
                </div>

        {/* HTML Hover Tooltip Overlay */}
        {hoveredSeat !== null && (() => {
          const isSpeaker = hoveredSeat === SPEAKER_MARKER_ID;
          if (!isSpeaker && !hoveredSeatData) return null;

          const mp = isSpeaker ? speakerMP : hoveredSeatData!.mp;
          // Anchor at the seat's top edge; flip the tooltip below it near the chamber head.
          const anchorY = isSpeaker ? SEAT_TOP_OFFSET : seatTop(hoveredSeatData!);
          const left = isSpeaker ? CHART_WIDTH / 2 : seatLeft(hoveredSeatData!) + SEAT_WIDTH / 2;
          const top = isSpeaker ? SEAT_TOP_OFFSET : anchorY - 10;
          const transform = anchorY < 150 ? 'translate(-50%, 20px)' : 'translate(-50%, -100%)';

          return (
            <div style={{
              position: 'absolute',
              left,
              top,
              transform,
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                {mp ? (
                  <>
                    <img
                      src={`https://openparliament.ca${mp.image}`}
                      alt=""
                      className="politician-photo"
                      style={{ width: '40px', borderRadius: '8px', border: `2px solid ${getPartyColor(mp.current_party.short_name.en)}` }}
                      onError={(e) => (e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(mp.name)}`)}
                    />
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                      <div style={{ fontWeight: 'bold', color: 'white' }}>{mp.name}</div>
                      <div style={{ fontSize: '12px', color: getPartyColor(mp.current_party.short_name.en), fontWeight: 'bold' }}>{mp.current_party.short_name.en}</div>
                    </div>
                  </>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                    <div style={{ fontWeight: 'bold', color: 'white' }}>Empty Seat</div>
                    <div style={{ fontSize: '12px', color: '#888' }}>Unassigned</div>
                  </div>
                )}
              </div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '6px', textAlign: 'left', display: 'flex', justifyContent: 'space-between' }}>
                <span>{mp ? mp.current_riding.name.en : 'No Riding'}</span>
                <span style={{ fontWeight: 'bold', color: 'var(--accent-color)', background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px' }}>
                  {isSpeaker ? 'Speaker' : `Seat ID: ${hoveredSeat}`}
                </span>
              </div>
            </div>
          );
        })()}
        </div>
      </div>
    </div>
  );
};
