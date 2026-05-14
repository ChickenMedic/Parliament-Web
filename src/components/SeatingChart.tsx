import { useMemo, useState, useEffect, useRef } from 'react';
import seatingData from '../data/seating.json';
import politiciansData from '../data/politicians.json';
import rolesMap from '../data/roles.json';

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

const normalizeParty = (partyEn: string) => {
  if (partyEn.includes('Liberal')) return 'Liberal';
  if (partyEn.includes('Conservative')) return 'Conservative';
  if (partyEn.includes('NDP') || partyEn.includes('New Democratic')) return 'NDP';
  if (partyEn.includes('Bloc')) return 'Bloc';
  if (partyEn.includes('Green')) return 'Green';
  return 'Independent';
};

export const SeatingChart = ({ selectedMP, setSelectedMP, highlightProvince, highlightRole }: { selectedMP: any, setSelectedMP: (mp: any) => void, highlightProvince?: string, highlightRole?: string }) => {
  // Map MPs to seats based on party
  const seatsWithMPs = useMemo(() => {
    const mpsByParty: Record<string, any[]> = {
      'Liberal': [],
      'Conservative': [],
      'NDP': [],
      'Bloc': [],
      'Green': [],
      'Independent': [],
      'Unknown': []
    };

    const politiciansWithRoles = politiciansData.objects.map((p: any) => ({
      ...p,
      role: (rolesMap as any)[p.name] || undefined
    }));

    politiciansWithRoles.forEach(mp => {
      const party = normalizeParty(mp.current_party.short_name.en);
      if (mpsByParty[party]) {
        mpsByParty[party].push(mp);
      } else {
        mpsByParty['Independent'].push(mp);
      }
    });

    return seatingData.map((seat: any, index: number) => {
      let assignedMP = null;
      if (mpsByParty[seat.party] && mpsByParty[seat.party].length > 0) {
        assignedMP = mpsByParty[seat.party].shift();
      } else if (mpsByParty['Independent'].length > 0) {
        assignedMP = mpsByParty['Independent'].shift();
      }
      
      return {
        ...seat,
        id: index,
        mp: assignedMP
      };
    });
  }, []);

  const [hoveredSeat, setHoveredSeat] = useState<number | null>(null);
  const speakerMP = politiciansData.objects.find((p: any) => p.name === 'Francis Scarpaleggia');

  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.85);

  useEffect(() => {
    const resizeObserver = new ResizeObserver(entries => {
      for (let entry of entries) {
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
        <div style={{ position: 'absolute', width: '356px', height: '958px', left: '-178px', top: '-479px', transform: `scale(${scale})`, transformOrigin: 'center', transition: 'transform 0.1s ease-out' }}>
          <div style={{ position: 'absolute', width: '100%', height: '100%', filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.5))' }}>
          
          {/* Speaker */}
          <div style={{ position: 'absolute', top: '10px', width: '100%', display: 'flex', justifyContent: 'center', zIndex: 10, pointerEvents: 'none' }}>
            <div 
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', pointerEvents: 'auto', transition: 'transform 0.2s' }}
              onClick={() => setSelectedMP(speakerMP)}
              onMouseOver={(e) => (e.currentTarget.style.transform = 'scale(1.2)')}
              onMouseOut={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            >
              <div style={{ width: '20px', height: '20px', background: selectedMP?.url === speakerMP?.url ? '#fff' : '#ffd700', borderRadius: '4px', border: '1px solid #fff', boxShadow: selectedMP?.url === speakerMP?.url ? '0 0 15px #fff' : '0 0 10px rgba(255, 215, 0, 0.4)', marginBottom: '4px' }}></div>
              <strong style={{ fontSize: '11px', opacity: 0.8, color: 'white' }}>Speaker</strong>
            </div>
          </div>

                {seatsWithMPs.map((seat) => {
                  const isSelected = selectedMP && seat.mp && selectedMP.name === seat.mp.name;
                  const isHovered = hoveredSeat === seat.id;
                  
                  let isHighlighted = true;
                  if (highlightProvince || highlightRole) {
                    if (seat.mp) {
                      let matchesProv = true;
                      let matchesRole = true;
                      if (highlightProvince) {
                        matchesProv = seat.mp.current_riding.province === highlightProvince;
                      }
                      if (highlightRole) {
                        if (highlightRole === 'Cabinet') {
                           matchesRole = seat.mp.role && seat.mp.role.toLowerCase().includes('minister') && !seat.mp.role.toLowerCase().includes('shadow') && !seat.mp.role.toLowerCase().includes('critic');
                        } else if (highlightRole === 'Shadow Cabinet') {
                           matchesRole = seat.mp.role && (seat.mp.role.toLowerCase().includes('critic') || seat.mp.role.toLowerCase().includes('shadow'));
                        }
                      }
                      isHighlighted = matchesProv && matchesRole;
                    } else {
                      isHighlighted = false;
                    }
                  }

                  let opacity = 0.7;
                  if (isSelected || isHovered) opacity = 1;
                  else if (highlightProvince || highlightRole) opacity = isHighlighted ? 1 : 0.1;
                  
                  const fill = seat.mp ? getPartyColor(seat.mp.current_party.short_name.en) : '#444';
                  
                  // Apply 90-degree mathematical rotation natively to coords
                  const rotatedX = 356 - seat.y - 20;
                  const rotatedY = seat.x + 50;

                  return (
                    <div
                      key={seat.id}
                      style={{
                        position: 'absolute',
                        left: rotatedX,
                        top: rotatedY,
                        width: '20px',
                        height: '21px',
                        backgroundColor: fill,
                        borderRadius: '4px',
                        opacity: opacity,
                        border: isSelected ? '2px solid white' : (isHovered ? '2px solid rgba(255,255,255,0.5)' : 'none'),
                        boxSizing: 'border-box',
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
                    />
                  );
                })}
                </div>

        {/* HTML Hover Tooltip Overlay */}
        {hoveredSeat !== null && seatsWithMPs[hoveredSeat]?.mp && (
          <div style={{
            position: 'absolute',
            left: (356 - seatingData[hoveredSeat].y - 20) + 10, // rotatedX + 10
            top: seatingData[hoveredSeat].x + 50 - 10,               // rotatedY - 10
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <img 
                src={`https://openparliament.ca${seatsWithMPs[hoveredSeat].mp.image}`} 
                alt="" 
                style={{ width: '44px', height: '44px', borderRadius: '8px', objectFit: 'cover', objectPosition: 'center 10%', border: `2px solid ${getPartyColor(seatsWithMPs[hoveredSeat].mp.current_party.short_name.en)}` }} 
                onError={(e) => (e.target as any).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(seatsWithMPs[hoveredSeat].mp.name)}`} 
              />
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                <div style={{ fontWeight: 'bold', color: 'white' }}>{seatsWithMPs[hoveredSeat].mp.name}</div>
                <div style={{ fontSize: '12px', color: getPartyColor(seatsWithMPs[hoveredSeat].mp.current_party.short_name.en), fontWeight: 'bold' }}>{seatsWithMPs[hoveredSeat].mp.current_party.short_name.en}</div>
              </div>
            </div>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '6px', textAlign: 'left' }}>
              {seatsWithMPs[hoveredSeat].mp.current_riding.name.en}
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
};
