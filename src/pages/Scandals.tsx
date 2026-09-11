import { useState, useMemo } from 'react';
import initialScandals from '../data/scandals.json';
import politiciansData from '../data/politicians.json';
import './PageStyles.css';

const getPartyColor = (party: string) => {
  switch (party.toLowerCase()) {
    case 'liberal': return '#d71920';
    case 'conservative': return '#1a4782';
    case 'ndp': return '#f37021';
    case 'bloc québécois':
    case 'bloc': return '#33b2cc';
    case 'green': return '#3d9b35';
    default: return '#808080';
  }
};

const getSeverityColor = (severity: string) => {
  switch (severity.toLowerCase()) {
    case 'critical': return '#ef4444';
    case 'high': return '#f97316';
    case 'medium': return '#eab308';
    default: return '#3b82f6';
  }
};

// Timeline dates look like "Feb 2024"; undated rows ("Ongoing") don't count
// as developments, so stories only rank as fresh when something new happened.
const parseTimelineDate = (d: string): number | null => {
  const t = Date.parse(`1 ${d}`);
  return isNaN(t) ? null : t;
};

const lastDevelopmentTime = (s: { timeline: { date: string }[] }): number | null => {
  let latest: number | null = null;
  for (const step of s.timeline) {
    const t = parseTimelineDate(step.date);
    if (t !== null && (latest === null || t > latest)) latest = t;
  }
  return latest;
};

const recencyInfo = (s: { timeline: { date: string }[] }) => {
  const t = lastDevelopmentTime(s);
  if (t === null) return { label: 'No dated developments', color: 'rgba(255,255,255,0.4)' };
  const when = new Date(t).toLocaleDateString('en-CA', { month: 'short', year: 'numeric' });
  const months = (Date.now() - t) / (1000 * 60 * 60 * 24 * 30.4);
  if (months <= 3) return { label: `In the news — ${when}`, color: '#34d399' };
  if (months <= 12) return { label: `Last development ${when}`, color: '#f59e0b' };
  return { label: `Quiet since ${when}`, color: 'rgba(255,255,255,0.4)' };
};

interface Scandal {
  id: string;
  title: string;
  party: string;
  status: string;
  severity: string;
  description: string;
  keyFigures: string[];
  timeline: { date: string; event: string }[];
  votes: number;
  latestDevelopments?: string;
  developmentsAsOf?: string;
}

export const Scandals = () => {
  const scandals = initialScandals as Scandal[];
  const [search, setSearch] = useState('');
  const [selectedParty, setSelectedParty] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [expandedId, setExpandedId] = useState<string | null>(null);


  const findMP = (name: string) => {
    return (politiciansData.objects as any[]).find(p => p.name.toLowerCase().trim() === name.toLowerCase().trim()) || null;
  };

  const filteredScandals = useMemo(() => {
    return scandals.filter(s => {
      const matchSearch = s.title.toLowerCase().includes(search.toLowerCase()) || 
                          s.description.toLowerCase().includes(search.toLowerCase()) ||
                          s.keyFigures.some(name => name.toLowerCase().includes(search.toLowerCase()));
      
      const matchParty = selectedParty === 'All' || s.party.toLowerCase() === selectedParty.toLowerCase();
      const matchStatus = selectedStatus === 'All' || s.status.toLowerCase() === selectedStatus.toLowerCase();

      return matchSearch && matchParty && matchStatus;
    }).sort((a, b) => {
      // Most recently developing stories first; undated-only stories last.
      const ta = lastDevelopmentTime(a) ?? 0;
      const tb = lastDevelopmentTime(b) ?? 0;
      return tb - ta;
    });
  }, [scandals, search, selectedParty, selectedStatus]);

  return (
    <div className="page-container glass-panel" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '20px', flexShrink: 0 }}>
        <div>
          <h1 style={{ fontSize: '32px', margin: 0, color: 'white' }}>Ethics & Scandal Tracker</h1>
          <p style={{ margin: '6px 0 0 0', color: 'var(--text-secondary)' }}>
            Monitor ongoing inquiries and conflict-of-interest findings.
          </p>
        </div>
      </div>



      {/* Tab content conditional rendering */}
          {/* Filter Bar for Ethics */}
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '16px', flexShrink: 0 }}>
            <input 
              type="text" 
              value={search} 
              onChange={e=>setSearch(e.target.value)} 
              placeholder="Search by title, details, or figure..." 
              style={{
                flex: 1,
                minWidth: '200px',
                padding: '10px 14px',
                background: 'rgba(0,0,0,0.2)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                color: 'white',
                fontSize: '14px'
              }}
            />

            {/* Party Filter */}
            <div style={{ display: 'flex', gap: '6px', background: 'rgba(0,0,0,0.2)', padding: '4px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
              {['All', 'Liberal', 'Conservative', 'NDP', 'Bloc'].map(party => (
                <button
                  key={party}
                  onClick={() => setSelectedParty(party)}
                  style={{
                    padding: '6px 12px',
                    background: selectedParty === party ? getPartyColor(party) : 'transparent',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: selectedParty === party ? 'bold' : 'normal',
                    transition: 'all 0.2s'
                  }}
                >
                  {party}
                </button>
              ))}
            </div>

            {/* Status Filter */}
            <div style={{ display: 'flex', gap: '6px', background: 'rgba(0,0,0,0.2)', padding: '4px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
              {['All', 'Under Investigation', 'Public Inquiry', 'Active Debate', 'Audited'].map(status => (
                <button
                  key={status}
                  onClick={() => setSelectedStatus(status)}
                  style={{
                    padding: '6px 12px',
                    background: selectedStatus === status ? 'rgba(255,255,255,0.1)' : 'transparent',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    transition: 'all 0.2s'
                  }}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {/* Ethics Scandals List */}
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px', paddingRight: '8px' }}>
            {filteredScandals.length > 0 ? (
              filteredScandals.map(s => {
                const isExpanded = expandedId === s.id;
                const pColor = getPartyColor(s.party);
                const sevColor = getSeverityColor(s.severity);
                const recency = recencyInfo(s);

                return (
                  <div 
                    key={s.id} 
                    className="glass-panel" 
                    style={{ 
                      borderRadius: '12px', 
                      border: `1.5px solid ${isExpanded ? pColor : 'rgba(255,255,255,0.06)'}`,
                      background: 'rgba(255,255,255,0.01)',
                      transition: 'all 0.3s',
                      overflow: 'hidden'
                    }}
                  >
                    {/* Header Block */}
                    <div 
                      onClick={() => setExpandedId(isExpanded ? null : s.id)}
                      style={{ 
                        padding: '20px', 
                        cursor: 'pointer', 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center', 
                        flexWrap: 'wrap', 
                        gap: '12px' 
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1, minWidth: '300px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <span style={{ background: pColor, color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }}>
                            {s.party}
                          </span>
                          <span style={{ background: 'rgba(255,255,255,0.1)', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold' }}>
                            {s.status}
                          </span>
                          <span style={{ color: sevColor, fontSize: '11px', fontWeight: 'bold', letterSpacing: '0.5px' }}>
                            ● {s.severity} Severity
                          </span>
                          <span style={{ border: `1px solid ${recency.color}55`, color: recency.color, padding: '2px 8px', borderRadius: '10px', fontSize: '10.5px', fontWeight: 'bold' }}>
                            {recency.label}
                          </span>
                        </div>
                        <h3 style={{ margin: 0, color: 'white', fontSize: '18px' }}>{s.title}</h3>
                        <p style={{ margin: 0, fontSize: '13px', color: 'rgba(255,255,255,0.55)', lineHeight: 1.45, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {s.description}
                        </p>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }} onClick={e => e.stopPropagation()}>
                        {/* Expand Arrow */}
                        <span 
                          onClick={() => setExpandedId(isExpanded ? null : s.id)}
                          style={{ fontSize: '20px', cursor: 'pointer', color: 'var(--text-secondary)', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)', transition: 'all 0.2s' }}
                        >
                          ▼
                        </span>
                      </div>
                    </div>

                    {/* Drawer Detail */}
                    {isExpanded && (
                      <div style={{ padding: '0 20px 20px 20px', borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.15)' }}>
                        
                        <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', marginTop: '20px' }}>
                          
                          {/* Left: Desc, Figures & Severity Bar */}
                          <div style={{ flex: 1.5, minWidth: '300px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {s.latestDevelopments && (
                              <div style={{ background: 'rgba(96,165,250,0.06)', border: '1px solid rgba(96,165,250,0.2)', borderRadius: '8px', padding: '14px 16px' }}>
                                <h4 style={{ margin: '0 0 6px 0', fontSize: '13px', color: '#93c5fd', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                  What's Happening Now
                                  {s.developmentsAsOf && <span style={{ color: 'rgba(255,255,255,0.35)', fontWeight: 'normal', textTransform: 'none', letterSpacing: 0 }}> — as of {s.developmentsAsOf}</span>}
                                </h4>
                                <p style={{ margin: 0, fontSize: '13.5px', color: 'rgba(255,255,255,0.88)', lineHeight: '1.55' }}>{s.latestDevelopments}</p>
                              </div>
                            )}
                            <div>
                              <h4 style={{ margin: '0 0 6px 0', fontSize: '13px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Summary Case Description</h4>
                              <p style={{ margin: 0, fontSize: '13.5px', color: 'rgba(255,255,255,0.85)', lineHeight: '1.5' }}>{s.description}</p>
                            </div>

                            {/* Severity Bar */}
                            <div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                                <span style={{ color: 'var(--text-secondary)' }}>System Severity Level</span>
                                <span style={{ color: sevColor, fontWeight: 'bold' }}>{s.severity}</span>
                              </div>
                              <div style={{ height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                                <div 
                                  style={{ 
                                    width: s.severity.toLowerCase() === 'critical' ? '100%' : (s.severity.toLowerCase() === 'high' ? '75%' : (s.severity.toLowerCase() === 'medium' ? '50%' : '25%')), 
                                    background: sevColor, 
                                    height: '100%' 
                                  }} 
                                />
                              </div>
                            </div>

                            {/* Key Figures */}
                            <div>
                              <h4 style={{ margin: '0 0 10px 0', fontSize: '13px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Key Figures Investigated</h4>
                              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                {s.keyFigures.map(name => {
                                  const mp = findMP(name);
                                  return (
                                    <div 
                                      key={name} 
                                      style={{ 
                                        background: 'rgba(255,255,255,0.03)', 
                                        border: '1px solid rgba(255,255,255,0.05)', 
                                        borderRadius: '8px', 
                                        padding: '8px 12px', 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        gap: '10px',
                                        position: 'relative',
                                        overflow: 'hidden'
                                      }}
                                    >
                                      {mp ? (
                                        <>
                                          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '3px', background: getPartyColor(mp.current_party.short_name.en) }} />
                                          <img
                                            src={`https://openparliament.ca${mp.image}`}
                                            className="politician-photo"
                                            style={{ width: '30px', borderRadius: '6px' }}
                                            onError={e=>(e.target as HTMLImageElement).src=`https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`}
                                          />
                                          <div style={{ minWidth: 0 }}>
                                            <div style={{ fontSize: '12px', fontWeight: 'bold', color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</div>
                                            <div style={{ fontSize: '10px', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{mp.current_riding.name.en}</div>
                                          </div>
                                        </>
                                      ) : (
                                        <>
                                          <img 
                                            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`} 
                                            style={{ width: '28px', height: '28px', borderRadius: '50%' }}
                                          />
                                          <div style={{ fontSize: '12px', fontWeight: 'bold', color: 'white' }}>{name}</div>
                                        </>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>

                          </div>

                          {/* Right: Step Timeline */}
                          <div style={{ flex: 1, minWidth: '240px', borderLeft: '1px solid rgba(255,255,255,0.06)', paddingLeft: '24px' }}>
                            <h4 style={{ margin: '0 0 12px 0', fontSize: '13px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Timeline of Case Events</h4>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', position: 'relative' }}>
                              {s.timeline.map((step, idx) => (
                                <div key={idx} style={{ display: 'flex', gap: '12px', position: 'relative' }}>
                                  
                                  {/* Step circle line connection */}
                                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: pColor, flexShrink: 0, marginTop: '5px' }} />
                                    {idx < s.timeline.length - 1 && (
                                      <div style={{ width: '1px', background: 'rgba(255,255,255,0.1)', flex: 1, margin: '4px 0' }} />
                                    )}
                                  </div>

                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                                    <span style={{ fontSize: '11px', color: pColor, fontWeight: 'bold' }}>{step.date}</span>
                                    <p style={{ margin: 0, fontSize: '12px', color: 'rgba(255,255,255,0.8)', lineHeight: '1.4' }}>{step.event}</p>
                                  </div>

                                </div>
                              ))}
                            </div>

                          </div>

                        </div>

                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                No ethics concern items match the search filters.
              </div>
            )}
          </div>

    </div>
  );
};
