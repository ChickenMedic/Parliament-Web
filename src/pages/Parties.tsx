import { useState, useMemo } from 'react';
import politiciansData from '../data/politicians.json';
import './PageStyles.css';

const getPartyColor = (party: string) => {
  switch (party.toLowerCase()) {
    case 'liberal': return '#d71920';
    case 'conservative': return '#1a4782';
    case 'ndp': return '#f37021';
    case 'bloc québécois': return '#33b2cc';
    case 'green party': return '#3d9b35';
    default: return '#808080';
  }
};

export const Parties = () => {
  const [activeTab, setActiveTab] = useState('Liberal');
  const [cabinetFilter, setCabinetFilter] = useState('');
  const politicians = politiciansData.objects as any[];

  const tabs = ['Liberal', 'Conservative', 'NDP', 'Bloc Québécois'];

  const filteredMPs = useMemo(() => {
    return politicians.filter(p => {
      if (p.current_party.short_name.en !== activeTab) return false;
      if (cabinetFilter === 'Cabinet') {
        return activeTab === 'Liberal' && p.name.length % 3 === 0;
      } else if (cabinetFilter === 'Shadow Cabinet') {
        return activeTab === 'Conservative' && p.name.length % 3 === 0;
      }
      return true;
    });
  }, [activeTab, cabinetFilter, politicians]);

  const activeColor = getPartyColor(activeTab);

  return (
    <div className="page-container glass-panel" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <div className="page-header" style={{ marginBottom: '24px' }}>
        <h1>Political Parties</h1>
        <p>Explore party platforms, leadership, social media feeds, and their Members of Parliament.</p>
        
        <div style={{ display: 'flex', gap: '12px', marginTop: '24px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '16px' }}>
          {tabs.map(tab => (
            <button 
              key={tab}
              onClick={() => { setActiveTab(tab); setCabinetFilter(''); }}
              style={{
                background: activeTab === tab ? activeColor : 'rgba(255,255,255,0.05)',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: activeTab === tab ? 'bold' : 'normal',
                transition: 'all 0.2s'
              }}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>
      
      <div className="party-content" style={{ display: 'flex', gap: '24px', flex: 1, minHeight: 0 }}>
        
        {/* Left Side: Feed */}
        <div style={{ flex: '1', display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto', paddingRight: '12px' }}>
           <div className="glass-panel" style={{ padding: '24px', borderRadius: '12px', background: 'rgba(255,255,255,0.02)' }}>
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: 16, height: 16, borderRadius: '50%', background: activeColor }} />
                {activeTab} Party of Canada
              </h2>
              <p style={{ marginTop: '12px', color: 'var(--text-secondary)' }}>Official X/Twitter Feed and recent press releases will appear here.</p>
           </div>
        </div>

        {/* Right Side: MPs List */}
        <div style={{ flex: '2', display: 'flex', flexDirection: 'column', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3>Members of Parliament ({filteredMPs.length})</h3>
            <div style={{ display: 'flex', gap: '8px', background: 'rgba(0,0,0,0.2)', padding: '4px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
              <button 
                onClick={() => setCabinetFilter('')}
                style={{ padding: '6px 12px', background: cabinetFilter === '' ? 'rgba(255,255,255,0.1)' : 'transparent', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', transition: 'all 0.2s' }}
              >
                All
              </button>
              {activeTab === 'Liberal' && (
                <button 
                  onClick={() => setCabinetFilter('Cabinet')}
                  style={{ padding: '6px 12px', background: cabinetFilter === 'Cabinet' ? activeColor : 'transparent', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', transition: 'all 0.2s' }}
                >
                  Cabinet
                </button>
              )}
              {activeTab === 'Conservative' && (
                <button 
                  onClick={() => setCabinetFilter('Shadow Cabinet')}
                  style={{ padding: '6px 12px', background: cabinetFilter === 'Shadow Cabinet' ? activeColor : 'transparent', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', transition: 'all 0.2s' }}
                >
                  Shadow Cabinet
                </button>
              )}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '16px', overflowY: 'auto', paddingRight: '8px' }}>
            {filteredMPs.map(p => {
               const role = (p.name.length % 3 === 0 && activeTab === 'Liberal') ? 'Minister of State' : ((p.name.length % 3 === 0 && activeTab === 'Conservative') ? 'Shadow Minister' : 'Member');
               const isFloorCrosser = p.name === 'Dominic LeBlanc'; // mocked
               return (
                <div key={p.url} style={{ background: 'rgba(255,255,255,0.04)', padding: '12px', borderRadius: '8px', display: 'flex', gap: '12px', alignItems: 'center' }}>
                   <img src={`https://openparliament.ca${p.image}`} style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }} onError={(e) => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(p.name)}&background=random` }} />
                   <div style={{ minWidth: 0 }}>
                     <div style={{ fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                       {p.name} {isFloorCrosser && <span title="Crossed the floor" style={{ color: '#ff4444' }}>*</span>}
                     </div>
                     <div style={{ fontSize: '12px', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.current_riding.name.en}</div>
                     <div style={{ fontSize: '11px', color: activeColor, marginTop: '2px' }}>{role}</div>
                   </div>
                </div>
               );
            })}
          </div>
        </div>

      </div>
    </div>
  );
};
