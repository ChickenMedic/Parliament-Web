import { useState, useMemo } from 'react';
import './PageStyles.css';
import politiciansData from '../data/politicians.json';

interface Committee {
  id: string;
  name: string;
  desc: string;
  url: string;
  workUrl: string;
  chairName: string;
  viceChairs: string[];
  members: string[];
  parties: Record<string, string>;
  partySeats: Record<string, number>;
}

import committeesFull from '../data/committees_full.json';

const COMMITTEES_DATA: Committee[] = committeesFull as unknown as Committee[];

const getPartyColor = (party: string) => {
  switch (party.toLowerCase()) {
    case 'liberal': return '#d71920';
    case 'conservative': return '#1a4782';
    case 'ndp': return '#f37021';
    case 'bloc québécois':
    case 'bloc': return '#33b2cc';
    case 'green party':
    case 'green': return '#3d9b35';
    default: return '#808080';
  }
};

interface UserComment {
  id: string;
  author: string;
  date: string;
  content: string;
}

export const Committees = () => {
  const [selectedId, setSelectedId] = useState('FINA');
  const politicians = politiciansData.objects as any[];

  // Local-only comments; starts empty (no seeded content).
  const [comments, setComments] = useState<Record<string, UserComment[]>>({});

  const [newAuthor, setNewAuthor] = useState('');
  const [newText, setNewText] = useState('');

  const selectedCommittee = useMemo(() => {
    return COMMITTEES_DATA.find(c => c.id === selectedId) || COMMITTEES_DATA[0];
  }, [selectedId]);

  const activeComments = useMemo(() => {
    return comments[selectedId] || [];
  }, [comments, selectedId]);

  // Names on ourcommons.ca and openparliament.ca can differ slightly
  // ("Jasraj Hallan" vs "Jasraj Singh Hallan"), so fall back to a
  // token-subset match when the exact name misses.
  const findMP = (name: string) => {
    const target = name.toLowerCase().trim();
    const exact = politicians.find(p => p.name.toLowerCase().trim() === target);
    if (exact) return exact;
    const tokens = new Set(target.split(/\s+/));
    return politicians.find(p => {
      const ptokens = (p.name.toLowerCase() as string).split(/\s+/);
      return ptokens.every(t => tokens.has(t)) || [...tokens].every(t => ptokens.includes(t));
    }) || null;
  };

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAuthor.trim() || !newText.trim()) return;

    const newComment: UserComment = {
      id: `${selectedId}-${Date.now()}`,
      author: newAuthor.trim(),
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      content: newText.trim()
    };

    setComments(prev => ({
      ...prev,
      [selectedId]: [newComment, ...(prev[selectedId] || [])]
    }));

    setNewAuthor('');
    setNewText('');
  };

  const renderMPCard = (name: string, role: string) => {
    const mp = findMP(name);
    // The scraped roster carries the authoritative party; MP lookup is only
    // used for the photo.
    const party = selectedCommittee.parties?.[name]
      || (mp ? mp.current_party.short_name.en : 'Independent');
    const color = getPartyColor(party);
    
    return (
      <div 
        key={name}
        style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: '10px',
          padding: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '4px', background: color }} />
        
        <img 
          src={mp && mp.image ? `https://openparliament.ca${mp.image}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`} 
          alt={name} 
          style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover', objectPosition: 'center top', border: `1.5px solid ${color}` }}
          onError={(e) => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random` }}
        />
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontWeight: 'bold', color: 'white', fontSize: '13px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</div>
          <div style={{ fontSize: '11px', color: color, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{party}</div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{role}</div>
        </div>
      </div>
    );
  };

  return (
    <div className="page-container glass-panel" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div className="page-header" style={{ marginBottom: '20px' }}>
        <h1>Parliamentary Committees</h1>
        <p>Monitor standing committees, their members from the House database, and current legislative studies.</p>
      </div>

      <div style={{ display: 'flex', gap: '24px', flex: 1, minHeight: 0 }}>
        {/* Left Side: Committee List Selector */}
        <div style={{ width: '260px', display: 'flex', flexDirection: 'column', gap: '10px', flexShrink: 0, overflowY: 'auto' }}>
          {COMMITTEES_DATA.map(c => (
            <button
              key={c.id}
              onClick={() => setSelectedId(c.id)}
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: '8px',
                background: selectedId === c.id ? 'var(--accent-color)' : 'rgba(255,255,255,0.04)',
                color: 'white',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px'
              }}
              onMouseEnter={(e) => { if(selectedId !== c.id) e.currentTarget.style.background = 'rgba(255,255,255,0.08)' }}
              onMouseLeave={(e) => { if(selectedId !== c.id) e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}
            >
              <strong style={{ fontSize: '14px' }}>{c.id}</strong>
              <span style={{ fontSize: '12px', opacity: 0.8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%' }}>{c.name}</span>
            </button>
          ))}
        </div>

        {/* Right Side: Detailed Dashboard */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto', paddingRight: '8px' }}>
          
          {/* Top Panel: Header & Party representation */}
          <div className="glass-panel" style={{ padding: '20px', borderRadius: '12px', background: 'rgba(255,255,255,0.02)', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <h2 style={{ margin: 0, color: 'white', fontSize: '20px' }}>{selectedCommittee.name}</h2>
              <p style={{ margin: '8px 0 0 0', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>{selectedCommittee.desc}</p>
            </div>

            {/* Seat Distribution Visual Bar */}
            <div style={{ marginTop: '4px' }}>
              <div style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Committee Seat Distribution</div>
              <div style={{ display: 'flex', height: '18px', borderRadius: '9px', overflow: 'hidden', width: '100%', background: 'rgba(255,255,255,0.1)' }}>
                {Object.entries(selectedCommittee.partySeats).map(([party, seats]) => {
                  const total = Object.values(selectedCommittee.partySeats).reduce((a, b) => a + b, 0);
                  const percent = (seats / total) * 100;
                  return (
                    <div 
                      key={party} 
                      style={{ width: `${percent}%`, background: getPartyColor(party), height: '100%', transition: 'all 0.3s' }}
                      title={`${party}: ${seats} Seats`}
                    />
                  );
                })}
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '8px', flexWrap: 'wrap' }}>
                {Object.entries(selectedCommittee.partySeats).map(([party, seats]) => (
                  <div key={party} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px' }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: getPartyColor(party) }} />
                    <span style={{ color: 'rgba(255,255,255,0.7)' }}>{party} ({seats})</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Roster & Studies splits */}
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
            
            {/* Committee Leadership & Roster */}
            <div style={{ flex: 2, minWidth: '300px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <h3 style={{ margin: 0, fontSize: '14px', textTransform: 'uppercase', color: 'var(--text-secondary)', letterSpacing: '1px' }}>Committee Roster</h3>
              
              {/* Leadership Row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
                {renderMPCard(selectedCommittee.chairName, 'Chair')}
                {selectedCommittee.viceChairs.map(vcName => renderMPCard(vcName, 'Vice-Chair'))}
              </div>

              {/* General Members List */}
              <div style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary)', marginTop: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Regular Members</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '10px' }}>
                {selectedCommittee.members.map(mName => renderMPCard(mName, 'Committee Member'))}
              </div>
            </div>

            {/* Official resources */}
            <div style={{ flex: 1.5, minWidth: '320px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <h3 style={{ margin: 0, fontSize: '14px', textTransform: 'uppercase', color: 'var(--text-secondary)', letterSpacing: '1px' }}>Current Work</h3>
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', padding: '18px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <p style={{ margin: 0, fontSize: '13px', color: 'rgba(255,255,255,0.7)', lineHeight: '1.5' }}>
                  Studies, activities, and reports for this committee are published on the official
                  House of Commons committee site, along with meeting schedules and webcasts.
                </p>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <a href={selectedCommittee.workUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: '12px', padding: '8px 14px', background: 'var(--accent-color)', color: 'white', textDecoration: 'none', borderRadius: '6px', fontWeight: 'bold' }}>
                    Studies &amp; Reports ↗
                  </a>
                  <a href={`https://www.ourcommons.ca/committees/en/${selectedCommittee.id}/Meetings`} target="_blank" rel="noopener noreferrer" style={{ fontSize: '12px', padding: '8px 14px', background: 'rgba(255,255,255,0.08)', color: 'white', textDecoration: 'none', borderRadius: '6px', fontWeight: 'bold', border: '1px solid rgba(255,255,255,0.15)' }}>
                    Meetings ↗
                  </a>
                  <a href={selectedCommittee.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '12px', padding: '8px 14px', background: 'rgba(255,255,255,0.08)', color: 'white', textDecoration: 'none', borderRadius: '6px', fontWeight: 'bold', border: '1px solid rgba(255,255,255,0.15)' }}>
                    Committee Home ↗
                  </a>
                </div>
              </div>
            </div>

          </div>

          {/* Public Discussion Board */}
          <div className="glass-panel" style={{ padding: '20px', borderRadius: '12px', background: 'rgba(255,255,255,0.02)', display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '12px' }}>
            <h3 style={{ margin: 0, fontSize: '16px', color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
              💬 Public Consultation Board ({activeComments.length} Contributions)
            </h3>
            <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)' }}>
              Submit your testimony or opinion on active committee studies. Comments are moderated in accordance with House rules.
            </p>
            
            {/* Comment Roster */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '250px', overflowY: 'auto', background: 'rgba(0,0,0,0.15)', borderRadius: '8px', padding: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
              {activeComments.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: '13px' }}>
                  No comments posted yet. Be the first to share your input!
                </div>
              ) : (
                activeComments.map(comment => (
                  <div key={comment.id} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '10px 14px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ fontSize: '12px', color: 'white' }}>{comment.author}</strong>
                      <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)' }}>{comment.date}</span>
                    </div>
                    <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.85)', lineHeight: '1.4' }}>{comment.content}</div>
                  </div>
                ))
              )}
            </div>

            {/* Comment Form */}
            <form onSubmit={handleCommentSubmit} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <input 
                type="text" 
                placeholder="Your Name (e.g. Jean Dupont)" 
                value={newAuthor}
                onChange={(e) => setNewAuthor(e.target.value)}
                required
                style={{ flex: '1', minWidth: '150px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', padding: '10px', color: 'white', fontSize: '13px' }}
              />
              <input 
                type="text" 
                placeholder="Share your perspective on this committee's work..." 
                value={newText}
                onChange={(e) => setNewText(e.target.value)}
                required
                style={{ flex: '3', minWidth: '250px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', padding: '10px', color: 'white', fontSize: '13px' }}
              />
              <button 
                type="submit" 
                style={{ background: 'var(--accent-color)', color: 'white', border: 'none', borderRadius: '6px', padding: '10px 20px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px', transition: 'all 0.2s' }}
                onMouseOver={(e) => e.currentTarget.style.filter = 'brightness(1.2)'}
                onMouseOut={(e) => e.currentTarget.style.filter = 'none'}
              >
                Post Comment
              </button>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
};

