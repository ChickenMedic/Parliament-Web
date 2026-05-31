import { useState, useMemo, useEffect } from 'react';
import politiciansData from '../data/politicians.json';
import rolesData from '../data/roles.json';
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

const PARTY_FEEDS: Record<string, { user: string, handle: string, avatar: string }> = {
  'Liberal': {
    user: 'Mark Carney',
    handle: 'MarkCarney',
    avatar: 'https://openparliament.ca/media/polpics/mark-carney.jpg'
  },
  'Conservative': {
    user: 'Pierre Poilievre',
    handle: 'PierrePoilievre',
    avatar: 'https://openparliament.ca/media/polpics/pierre-poilievre_e9wj39K.jpg'
  },
  'NDP': {
    user: 'Avi Lewis',
    handle: 'AviLewis',
    avatar: 'https://ui-avatars.com/api/?name=Avi+Lewis&background=f37021&color=fff'
  },
  'Bloc Québécois': {
    user: 'Yves-François Blanchet',
    handle: 'yfblanchet',
    avatar: 'https://openparliament.ca/media/polpics/yves-francois-blanchet_pf19klv.jpg'
  }
};

export const Parties = () => {
  const [activeTab, setActiveTab] = useState('Liberal');
  const [cabinetFilter, setCabinetFilter] = useState('');
  const politicians = politiciansData.objects as any[];

  const tabs = ['Liberal', 'Conservative', 'NDP', 'Bloc Québécois'];

  // Load and refresh Twitter widgets on tab switch
  useEffect(() => {
    const scriptId = 'twitter-wjs';
    let script = document.getElementById(scriptId) as HTMLScriptElement;
    
    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.setAttribute('src', 'https://platform.twitter.com/widgets.js');
      script.setAttribute('async', 'true');
      script.setAttribute('charset', 'utf-8');
      document.body.appendChild(script);
    }

    const twttr = (window as any).twttr;
    if (twttr && twttr.widgets) {
      twttr.widgets.load();
    }
  }, [activeTab]);

  const filteredMPs = useMemo(() => {
    return politicians.filter(p => {
      // Normalize 'Bloc Québécois' to 'Bloc' for MP data matching
      const targetParty = activeTab === 'Bloc Québécois' ? 'Bloc' : activeTab;
      if (p.current_party.short_name.en !== targetParty) return false;
      
      const role = (rolesData as Record<string, string>)[p.name];
      if (cabinetFilter === 'Cabinet') {
        return targetParty === 'Liberal' && role && role !== 'Speaker of the House of Commons';
      } else if (cabinetFilter === 'Shadow Cabinet') {
        return targetParty === 'Conservative' && role && role.includes('Shadow Minister');
      }
      return true;
    });
  }, [activeTab, cabinetFilter, politicians]);

  const activeColor = getPartyColor(activeTab);

  return (
    <div className="page-container glass-panel" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <div className="page-header" style={{ marginBottom: '24px' }}>
        <h1>Political Parties</h1>
        <p>Explore party platforms, leadership, live social media feeds, and their Members of Parliament.</p>
        
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
        
        {/* Left Side: Live X Feed */}
        <div style={{ flex: '1.2', display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'hidden', minWidth: '320px' }}>
          <div className="glass-panel" style={{ padding: '20px', borderRadius: '12px', background: 'rgba(255,255,255,0.02)', display: 'flex', flexDirection: 'column', gap: '16px', height: '100%' }}>
            <h3 style={{ margin: 0, color: 'white', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '16px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '12px', flexShrink: 0 }}>
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: activeColor }} />
              Live X/Twitter Timeline ({PARTY_FEEDS[activeTab].user})
            </h3>
            
            <div style={{ flex: 1, overflowY: 'auto', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }} key={activeTab}>
              <a 
                className="twitter-timeline" 
                data-theme="dark"
                data-chrome="noheader nofooter noborders transparent"
                href={`https://twitter.com/${PARTY_FEEDS[activeTab].handle}?ref_src=twsrc%5Etfw`}
              >
                Loading live feed for @{PARTY_FEEDS[activeTab].handle}...
              </a>
            </div>
          </div>
        </div>

        {/* Right Side: MPs List */}
        <div style={{ flex: '2', display: 'flex', flexDirection: 'column', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', padding: '24px', minHeight: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexShrink: 0 }}>
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

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '16px', overflowY: 'auto', paddingRight: '8px', alignContent: 'start' }}>
            {/* Avi Lewis NDP Leader Special Card */}
            {activeTab === 'NDP' && cabinetFilter === '' && (
              <div 
                style={{ 
                  gridColumn: '1 / -1', 
                  background: 'rgba(243, 112, 33, 0.08)', 
                  border: '1px solid rgba(243, 112, 33, 0.25)', 
                  padding: '16px', 
                  borderRadius: '10px', 
                  display: 'flex', 
                  gap: '16px', 
                  alignItems: 'center',
                  marginBottom: '4px'
                }}
              >
                <img 
                  src={PARTY_FEEDS['NDP'].avatar} 
                  alt="Avi Lewis" 
                  style={{ width: '50px', height: '50px', borderRadius: '50%', border: '2px solid #f37021' }} 
                />
                <div>
                  <h4 style={{ margin: 0, color: 'white', fontSize: '15px' }}>Avi Lewis</h4>
                  <div style={{ fontSize: '12px', color: '#f37021', fontWeight: 'bold', textTransform: 'uppercase', marginTop: '2px' }}>
                    Leader of the New Democratic Party
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    * Leader outside of Parliament (not an elected MP in the current session)
                  </div>
                </div>
              </div>
            )}

            {filteredMPs.map(p => {
               const role = (rolesData as Record<string, string>)[p.name] || 'Member of Parliament';
               return (
                <div key={p.url} style={{ background: 'rgba(255,255,255,0.04)', padding: '12px', borderRadius: '8px', display: 'flex', gap: '12px', alignItems: 'center' }}>
                   <img 
                     src={`https://openparliament.ca${p.image}`} 
                     style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }} 
                     onError={(e) => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(p.name)}&background=random` }} 
                   />
                   <div style={{ minWidth: 0, flex: 1 }}>
                     <div style={{ fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'white' }}>
                       {p.name}
                     </div>
                     <div style={{ fontSize: '12px', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                       {p.current_riding.name.en}
                     </div>
                     <div style={{ fontSize: '11px', color: activeColor, marginTop: '2px', fontWeight: '500', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                       {role}
                     </div>
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
