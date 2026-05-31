import { useState } from 'react';
import './PageStyles.css';
import { SeatingChart } from '../components/SeatingChart';
import { SenateChart } from '../components/SenateChart';

const getPartyColor = (party: string) => {
  switch (party.toLowerCase()) {
    case 'liberal': return '#d71920';
    case 'conservative': return '#1a4782';
    case 'ndp': return '#f37021';
    case 'bloc': return '#33b2cc';
    case 'green': return '#3d9b35';
    default: return '#808080';
  }
};

const SENATE_GROUPS = [
  { name: 'Independent Senators Group', color: '#4a90e2', count: 39 },
  { name: 'Conservative', color: '#1a4782', count: 13 },
  { name: 'Progressive Senate Group', color: '#e83e8c', count: 13 },
  { name: 'Canadian Senators Group', color: '#6f42c1', count: 17 },
  { name: 'Non-affiliated', color: '#808080', count: 11 },
  { name: 'Vacancies', color: '#222222', count: 12 },
];



export const House = () => {
  const [selectedMP, setSelectedMP] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('Commons');
  const [highlightProvince, setHighlightProvince] = useState<string>('');
  const [highlightRole, setHighlightRole] = useState<string>('');
  
  return (
    <div className="page-container glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column' }}>
      
      <div className="house-layout">
        
        {/* Left Sidebar (MP Details) */}
        <div className="house-sidebar">
          {selectedMP && activeTab === 'Commons' && (
            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '24px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', color: 'white', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '12px' }}>Member Profile</h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                <img src={`https://openparliament.ca${selectedMP.image}`} alt={selectedMP.name} style={{ width: '120px', height: '120px', borderRadius: '16px', objectFit: 'cover', objectPosition: 'center top', border: `3px solid ${getPartyColor(selectedMP.current_party.short_name.en)}`, boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }} onError={(e) => (e.target as any).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedMP.name)}`} />
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontWeight: 'bold', fontSize: '20px', color: 'white' }}>{selectedMP.name}</div>
                  <div style={{ fontSize: '14px', color: getPartyColor(selectedMP.current_party.short_name.en), fontWeight: 'bold', marginTop: '4px' }}>{selectedMP.current_party.short_name.en}</div>
                </div>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '12px' }}>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '2px' }}>Riding</div>
                  <div style={{ color: 'white', fontSize: '14px' }}>{selectedMP.current_riding.name.en}, {selectedMP.current_riding.province}</div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '2px' }}>Role</div>
                  <div style={{ color: 'white', fontSize: '14px' }}>
                    {selectedMP.role || 'Member of Parliament'}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Contact</div>
                <div style={{ fontSize: '13px', color: 'var(--accent-color)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: 'var(--text-secondary)', width: '40px' }}>Email:</span> {selectedMP.email || 'N/A'}
                </div>
                <div style={{ fontSize: '13px', color: 'var(--accent-color)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: 'var(--text-secondary)', width: '40px' }}>Phone:</span> {selectedMP.voice || 'N/A'}
                </div>
                <div style={{ fontSize: '13px', color: 'var(--accent-color)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: 'var(--text-secondary)', width: '40px' }}>X:</span> {selectedMP.twitter ? `@${selectedMP.twitter}` : 'N/A'}
                </div>
              </div>

              <button style={{ width: '100%', marginTop: '8px', padding: '12px', background: 'var(--accent-color)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>View Full Profile</button>
            </div>
          )}
        </div>

        {/* Main Chart Area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
          
          <div className="page-header" style={{ marginBottom: '16px', textAlign: 'center', flexShrink: 0 }}>
            <h1 style={{ fontSize: '24px', margin: '0 0 8px 0' }}>Parliament Seating</h1>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginTop: '16px' }}>
              <button 
                onClick={() => setActiveTab('Commons')}
                style={{ padding: '8px 16px', background: activeTab === 'Commons' ? 'var(--accent-color)' : 'rgba(255,255,255,0.1)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: activeTab === 'Commons' ? 'bold' : 'normal' }}
              >
                House of Commons
              </button>
              <button 
                onClick={() => setActiveTab('Senate')}
                style={{ padding: '8px 16px', background: activeTab === 'Senate' ? 'var(--accent-color)' : 'rgba(255,255,255,0.1)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: activeTab === 'Senate' ? 'bold' : 'normal' }}
              >
                The Senate
              </button>
            </div>
          </div>

          <div className="seating-chart-container" style={{ position: 'relative', width: '100%', flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'stretch' }}>
            
            {activeTab === 'Commons' ? <SeatingChart selectedMP={selectedMP} setSelectedMP={setSelectedMP || (() => {})} highlightProvince={highlightProvince} highlightRole={highlightRole} /> : <SenateChart />}
          </div>
        </div>

        {/* Right Sidebar (Legend) */}
        <div className="house-sidebar">
          
          <div style={{ background: 'rgba(0,0,0,0.3)', padding: '24px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)' }}>
             <h3 style={{ margin: '0 0 12px 0', fontSize: '14px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '1px' }}>Legend</h3>
             <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
               {activeTab === 'Commons' ? (
                 ['Liberal', 'Conservative', 'Bloc', 'NDP', 'Green', 'Independent'].map(party => (
                   <div key={party} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                     <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: getPartyColor(party), boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.3)' }} />
                     <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.8)' }}>{party}</span>
                   </div>
                 ))
               ) : (
                 SENATE_GROUPS.map(group => (
                   <div key={group.name} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                     <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: group.color, boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.3)' }} />
                     <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.8)' }}>{group.name}</span>
                   </div>
                 ))
               )}
              </div>
           </div>

           {activeTab === 'Commons' && (
            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '24px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)' }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '14px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '1px' }}>Highlight Seats</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <select 
                  style={{ width: '100%', padding: '12px', background: 'rgba(20,20,30,0.6)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', color: 'white', outline: 'none', cursor: 'pointer', fontSize: '14px', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)', appearance: 'none', backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23FFFFFF%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', backgroundSize: '12px auto' }}
                  value={highlightProvince}
                  onChange={(e) => setHighlightProvince(e.target.value)}
                >
                  <option value="" style={{ color: 'black' }}>Filter by Province...</option>
                  <option value="AB" style={{ color: 'black' }}>Alberta</option>
                  <option value="BC" style={{ color: 'black' }}>British Columbia</option>
                  <option value="MB" style={{ color: 'black' }}>Manitoba</option>
                  <option value="NB" style={{ color: 'black' }}>New Brunswick</option>
                  <option value="NL" style={{ color: 'black' }}>Newfoundland</option>
                  <option value="NS" style={{ color: 'black' }}>Nova Scotia</option>
                  <option value="NT" style={{ color: 'black' }}>Northwest Terr.</option>
                  <option value="NU" style={{ color: 'black' }}>Nunavut</option>
                  <option value="ON" style={{ color: 'black' }}>Ontario</option>
                  <option value="PE" style={{ color: 'black' }}>Prince Edward Isl.</option>
                  <option value="QC" style={{ color: 'black' }}>Quebec</option>
                  <option value="SK" style={{ color: 'black' }}>Saskatchewan</option>
                  <option value="YT" style={{ color: 'black' }}>Yukon</option>
                </select>
                <select 
                  style={{ width: '100%', padding: '12px', background: 'rgba(20,20,30,0.6)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', color: 'white', outline: 'none', cursor: 'pointer', fontSize: '14px', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)', appearance: 'none', backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23FFFFFF%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', backgroundSize: '12px auto' }}
                  value={highlightRole}
                  onChange={(e) => setHighlightRole(e.target.value)}
                >
                  <option value="" style={{ color: 'black' }}>Filter by Role...</option>
                  <option value="Cabinet" style={{ color: 'black' }}>Cabinet</option>
                  <option value="Shadow Cabinet" style={{ color: 'black' }}>Shadow Cabinet</option>
                </select>
                
                <button 
                  onClick={() => { setHighlightProvince(''); setHighlightRole(''); }} 
                  disabled={!highlightProvince && !highlightRole}
                  style={{ marginTop: '4px', width: '100%', padding: '10px', background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', cursor: (!highlightProvince && !highlightRole) ? 'default' : 'pointer', fontSize: '13px', transition: 'background 0.2s', fontWeight: 'bold', opacity: (!highlightProvince && !highlightRole) ? 0.5 : 1 }}
                  onMouseOver={(e) => { if (highlightProvince || highlightRole) e.currentTarget.style.background = 'rgba(255,255,255,0.2)'; }}
                  onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                >
                  Reset Filters
                </button>
              </div>
            </div>
           )}
        </div>
      </div>
    </div>
  );
};
