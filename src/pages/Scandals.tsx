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

export const Scandals = () => {
  const [scandals, setScandals] = useState(initialScandals);
  const [search, setSearch] = useState('');
  const [selectedParty, setSelectedParty] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Tip reporting state
  const [showForm, setShowForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newParty, setNewParty] = useState('Liberal');
  const [newStatus, setNewStatus] = useState('Under Investigation');
  const [newSeverity, setNewSeverity] = useState('High');
  const [newDesc, setNewDesc] = useState('');
  const [newKeyFigures, setNewKeyFigures] = useState('');
  const [newTimelineEvent, setNewTimelineEvent] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const findMP = (name: string) => {
    return (politiciansData.objects as any[]).find(p => p.name.toLowerCase().trim() === name.toLowerCase().trim()) || null;
  };

  const handleVote = (id: string) => {
    setScandals(prev => prev.map(s => {
      if (s.id === id) {
        return { ...s, votes: s.votes + 1 };
      }
      return s;
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newDesc) return;
    
    const timeline = newTimelineEvent ? [
      { date: "Current", event: newTimelineEvent }
    ] : [
      { date: "Current", event: "Ethics tip submitted by public observer." }
    ];

    const newScandal = {
      id: `SCANDAL-USER-${Date.now()}`,
      title: newTitle,
      party: newParty,
      status: newStatus,
      severity: newSeverity,
      description: newDesc,
      keyFigures: newKeyFigures.split(',').map(s => s.trim()).filter(s => s),
      timeline: timeline,
      votes: 1
    };

    setScandals(prev => [newScandal, ...prev]);
    
    // Reset form
    setNewTitle('');
    setNewDesc('');
    setNewKeyFigures('');
    setNewTimelineEvent('');
    setSuccessMsg('Ethics tip successfully registered and logged in database.');
    
    setTimeout(() => {
      setSuccessMsg('');
      setShowForm(false);
    }, 2500);
  };

  const filteredScandals = useMemo(() => {
    return scandals.filter(s => {
      const matchSearch = s.title.toLowerCase().includes(search.toLowerCase()) || 
                          s.description.toLowerCase().includes(search.toLowerCase()) ||
                          s.keyFigures.some(name => name.toLowerCase().includes(search.toLowerCase()));
      
      const matchParty = selectedParty === 'All' || s.party.toLowerCase() === selectedParty.toLowerCase();
      const matchStatus = selectedStatus === 'All' || s.status.toLowerCase() === selectedStatus.toLowerCase();
      
      return matchSearch && matchParty && matchStatus;
    });
  }, [scandals, search, selectedParty, selectedStatus]);

  return (
    <div className="page-container glass-panel" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '20px', flexShrink: 0 }}>
        <div>
          <h1 style={{ fontSize: '32px', margin: 0, color: 'white' }}>Ethics & Scandal Tracker</h1>
          <p style={{ margin: '6px 0 0 0', color: 'var(--text-secondary)' }}>
            Monitor ongoing inquiries, conflict-of-interest findings, and public concern scores across federal parties.
          </p>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)}
          style={{
            background: showForm ? 'rgba(239, 68, 68, 0.2)' : 'rgba(59, 130, 246, 0.2)',
            border: `1px solid ${showForm ? '#ef4444' : '#3b82f6'}`,
            color: showForm ? '#f87171' : '#60a5fa',
            padding: '10px 16px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 'bold',
            transition: 'all 0.2s'
          }}
        >
          {showForm ? 'Cancel Report' : 'Submit Ethics Tip'}
        </button>
      </div>

      {/* Tip Submission Form Overlay */}
      {showForm && (
        <form onSubmit={handleSubmit} className="glass-panel" style={{ padding: '20px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', marginBottom: '20px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h3 style={{ margin: 0, color: 'white', fontSize: '16px' }}>Log a New Parliamentary Ethics Concern</h3>
          {successMsg && <div style={{ padding: '10px', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10b981', color: '#34d399', borderRadius: '6px', fontSize: '13px' }}>{successMsg}</div>}
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Concern Title *</label>
              <input required type="text" value={newTitle} onChange={e=>setNewTitle(e.target.value)} style={{ padding: '8px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: 'white' }} placeholder="e.g. Procurement Conflict of Interest" />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Associated Party</label>
              <select value={newParty} onChange={e=>setNewParty(e.target.value)} style={{ padding: '8px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: 'white' }}>
                <option value="Liberal">Liberal</option>
                <option value="Conservative">Conservative</option>
                <option value="NDP">NDP</option>
                <option value="Bloc Québécois">Bloc Québécois</option>
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Audit/Inquiry Status</label>
              <select value={newStatus} onChange={e=>setNewStatus(e.target.value)} style={{ padding: '8px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: 'white' }}>
                <option value="Under Investigation">Under Investigation</option>
                <option value="Public Inquiry">Public Inquiry</option>
                <option value="Active Debate">Active Debate</option>
                <option value="Audited">Audited</option>
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Severity Level</label>
              <select value={newSeverity} onChange={e=>setNewSeverity(e.target.value)} style={{ padding: '8px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: 'white' }}>
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Summary Description *</label>
            <textarea required rows={2} value={newDesc} onChange={e=>setNewDesc(e.target.value)} style={{ padding: '8px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: 'white', resize: 'vertical' }} placeholder="Provide a concise summary of the allegations or findings..." />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Key Figures (Comma separated names)</label>
              <input type="text" value={newKeyFigures} onChange={e=>setNewKeyFigures(e.target.value)} style={{ padding: '8px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: 'white' }} placeholder="e.g. Mark Carney, Dominic LeBlanc" />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>First Timeline Event (Date + description)</label>
              <input type="text" value={newTimelineEvent} onChange={e=>setNewTimelineEvent(e.target.value)} style={{ padding: '8px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: 'white' }} placeholder="e.g. Auditor General announces audit" />
            </div>
          </div>

          <button type="submit" style={{ alignSelf: 'flex-end', background: '#3b82f6', color: 'white', border: 'none', padding: '10px 24px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
            File Report
          </button>
        </form>
      )}

      {/* Filter Bar */}
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '16px', flexShrink: 0 }}>
        
        {/* Search */}
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

      {/* Main List */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px', paddingRight: '8px' }}>
        {filteredScandals.length > 0 ? (
          filteredScandals.map(s => {
            const isExpanded = expandedId === s.id;
            const pColor = getPartyColor(s.party);
            const sevColor = getSeverityColor(s.severity);

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
                    </div>
                    <h3 style={{ margin: 0, color: 'white', fontSize: '18px' }}>{s.title}</h3>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }} onClick={e => e.stopPropagation()}>
                    {/* Votes Meter */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.05)', padding: '6px 12px', borderRadius: '8px' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Concern Level</span>
                      <span style={{ fontSize: '16px', fontWeight: 'bold', color: 'white', margin: '2px 0' }}>{s.votes}</span>
                      <button 
                        onClick={() => handleVote(s.id)}
                        style={{
                          background: 'rgba(239, 68, 68, 0.15)',
                          color: '#f87171',
                          border: 'none',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '10px',
                          fontWeight: 'bold',
                          marginTop: '2px',
                          transition: 'all 0.1s'
                        }}
                        onMouseOver={e=>e.currentTarget.style.background='rgba(239, 68, 68, 0.3)'}
                        onMouseOut={e=>e.currentTarget.style.background='rgba(239, 68, 68, 0.15)'}
                      >
                        ▲ Flag Concern
                      </button>
                    </div>
                    
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
                                        style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }}
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
