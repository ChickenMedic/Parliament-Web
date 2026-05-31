import { useState, useMemo } from 'react';
import './PageStyles.css';
import politiciansData from '../data/politicians.json';

interface Committee {
  id: string;
  name: string;
  desc: string;
  chairName: string;
  viceChairs: string[];
  members: string[];
  studies: string[];
  partySeats: Record<string, number>;
}

const COMMITTEES_DATA: Committee[] = [
  {
    id: 'FINA',
    name: 'Standing Committee on Finance',
    desc: 'Mandated to study and report on all matters relating to the mandate, management and operation of the Department of Finance and the Canada Revenue Agency.',
    chairName: 'Peter Fonseca',
    viceChairs: ['Jasraj Singh Hallan', 'Gabriel Ste-Marie'],
    members: ['Terry Beech', 'Yvan Baker', 'Adam Chambers', 'Kelly McCauley', 'Daniel Mazier', 'Heather McPherson', 'Sukh Dhaliwal'],
    studies: [
      'Pre-budget Consultations 2026',
      'Study of Inflationary Pressures and Interest Rates',
      'Housing Market Affordability and Credit Access'
    ],
    partySeats: { 'Liberal': 5, 'Conservative': 4, 'Bloc': 1, 'NDP': 1 }
  },
  {
    id: 'HESA',
    name: 'Standing Committee on Health',
    desc: 'Oversees the work of Health Canada, Public Health Agency of Canada, and CIHR to study issues related to healthcare systems and health regulations.',
    chairName: 'Sean Casey',
    viceChairs: ['Stephen Ellis', 'Don Davies'],
    members: ['Mark Holland', 'Todd Doherty', 'Stephen Fuhr', 'Hedy Fry', 'Robert Morrison', 'Jenna Sudds', 'Leah Gazan'],
    studies: [
      'Evaluation of the National Pharmacare Rollout',
      'Emergency Room Wait Times and Healthcare Staffing Crisis',
      'Mental Health Supports for Youth in Rural Communities'
    ],
    partySeats: { 'Liberal': 5, 'Conservative': 4, 'NDP': 1, 'Bloc': 1 }
  },
  {
    id: 'FAAE',
    name: 'Standing Committee on Foreign Affairs',
    desc: 'Studies bills, spending, and policies of Global Affairs Canada and monitors international development assistance programs.',
    chairName: 'Ali Ehsassi',
    viceChairs: ['Michael Chong', 'Simon-Pierre Savard-Tremblay'],
    members: ['Mélanie Joly', 'Garrett Genuis', 'Taleeb Noormohamed', 'Wayne Long', 'John Barlow', 'Ziad Aboultaif', 'Heather McPherson'],
    studies: [
      'Canada\'s Indo-Pacific Strategy Implementation',
      'Arctic Sovereignty, Security, and Relations with Circumpolar Nations',
      'International Aid Effectiveness in Sub-Saharan Africa'
    ],
    partySeats: { 'Liberal': 5, 'Conservative': 4, 'Bloc': 1, 'NDP': 1 }
  },
  {
    id: 'NDDN',
    name: 'Standing Committee on National Defence',
    desc: 'Focuses on the Department of National Defence and the Canadian Armed Forces, reviewing operations, defense policy, and military equipment.',
    chairName: 'John McKay',
    viceChairs: ['James Bezan', 'Christine Normandin'],
    members: ['Bill Blair', 'Alex Ruff', 'Pat Kelly', 'Terry Duguid', 'Serge Cormier', 'Marie-France Lalonde', 'Lindsay Mathyssen'],
    studies: [
      'Military Recruitment and Retention Retention Strategies',
      'Procurement of Surface Combatant and F-35 Fighter Jets',
      'Cybersecurity Capabilities of the Canadian Armed Forces'
    ],
    partySeats: { 'Liberal': 5, 'Conservative': 4, 'Bloc': 1, 'NDP': 1 }
  },
  {
    id: 'PACP',
    name: 'Standing Committee on Public Accounts',
    desc: 'The House oversight committee, chaired by an Opposition member, that reviews the reports of the Auditor General of Canada to ensure government accountability.',
    chairName: 'John Williamson',
    viceChairs: ['Jean-Yves Duclos', 'Nathalie Sinclair-Desgagné'],
    members: ['Kelly Block', 'Blake Richards', 'Kody Blois', 'Peter Fragiskatos', 'Sonia Sidhu', 'Brad Vis', 'Jenny Kwan'],
    studies: [
      'Review of the Auditor General\'s Report on the ArriveCAN App',
      'Federal Information Technology Procurement Regulations',
      'Oversight of Defense Procurement Project Costing'
    ],
    partySeats: { 'Conservative': 5, 'Liberal': 4, 'Bloc': 1, 'NDP': 1 }
  }
];

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

export const Committees = () => {
  const [selectedId, setSelectedId] = useState('FINA');
  const politicians = politiciansData.objects as any[];

  const selectedCommittee = useMemo(() => {
    return COMMITTEES_DATA.find(c => c.id === selectedId) || COMMITTEES_DATA[0];
  }, [selectedId]);

  const findMP = (name: string) => {
    return politicians.find(p => p.name.toLowerCase().trim() === name.toLowerCase().trim()) || null;
  };

  const renderMPCard = (name: string, role: string) => {
    const mp = findMP(name);
    const party = mp ? mp.current_party.short_name.en : 'Independent';
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
        <div style={{ width: '260px', display: 'flex', flexDirection: 'column', gap: '10px', flexShrink: 0 }}>
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
                  const percent = (seats / 11) * 100;
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

            {/* Current Studies Panel */}
            <div style={{ flex: 1, minWidth: '220px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <h3 style={{ margin: 0, fontSize: '14px', textTransform: 'uppercase', color: 'var(--text-secondary)', letterSpacing: '1px' }}>Current Investigations</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {selectedCommittee.studies.map((study, idx) => (
                  <div 
                    key={idx} 
                    style={{ 
                      background: 'rgba(255,255,255,0.02)', 
                      border: '1px solid rgba(255,255,255,0.05)', 
                      padding: '14px', 
                      borderRadius: '10px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '10px', fontWeight: 'bold', background: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa', padding: '2px 6px', borderRadius: '4px', textTransform: 'uppercase' }}>Active Study</span>
                      <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>#{idx + 1}</span>
                    </div>
                    <p style={{ margin: 0, fontSize: '12px', color: 'white', fontWeight: 600, lineHeight: '1.4' }}>{study}</p>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
};
