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

  const [feedHandle, setFeedHandle] = useState<string | null>(PARTY_FEEDS['Liberal'].handle);
  const [feedUser, setFeedUser] = useState<string>(PARTY_FEEDS['Liberal'].user);

  const selectedMPDetails = useMemo(() => {
    if (feedUser === 'Avi Lewis') {
      return {
        image: PARTY_FEEDS['NDP'].avatar,
        riding: 'N/A (Party Leader Outside House)'
      };
    }
    const found = politicians.find(p => p.name === feedUser);
    return found ? {
      image: `https://openparliament.ca${found.image}`,
      riding: found.current_riding.name.en
    } : {
      image: `https://ui-avatars.com/api/?name=${encodeURIComponent(feedUser)}`,
      riding: ''
    };
  }, [feedUser, politicians]);

  // Sync feed with activeTab change
  useEffect(() => {
    setFeedHandle(PARTY_FEEDS[activeTab].handle);
    setFeedUser(PARTY_FEEDS[activeTab].user);
  }, [activeTab]);

  // Load and refresh Twitter widgets on feed target change
  useEffect(() => {
    if (!feedHandle) return;
    
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

    // Give DOM time to update
    const timer = setTimeout(() => {
      const twttr = (window as any).twttr;
      if (twttr && twttr.widgets) {
        twttr.widgets.load();
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [feedHandle]);

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
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '12px', flexShrink: 0 }}>
              <h3 style={{ margin: 0, color: 'white', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '15px' }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: activeColor }} />
                Social Feed ({feedUser})
              </h3>
            </div>
              
            {feedHandle ? (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px', minHeight: 0 }}>
                  <div style={{ flex: 1, overflowY: 'hidden', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }} key={feedHandle}>
                    <a 
                      className="twitter-timeline" 
                      data-theme="dark"
                      data-chrome="noheader nofooter noborders transparent"
                      href={`https://twitter.com/${feedHandle}?ref_src=twsrc%5Etfw`}
                      style={{ textDecoration: 'none', height: '100%', display: 'block' }}
                    >
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        height: '100%',
                        boxSizing: 'border-box',
                        color: 'white',
                        textAlign: 'center',
                        justifyContent: 'center',
                        alignItems: 'center',
                        gap: '16px',
                        padding: '24px'
                      }}>
                        {/* Avatar */}
                        <img 
                          src={selectedMPDetails.image} 
                          alt={feedUser}
                          style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: `3px solid ${activeColor}` }}
                          onError={(e) => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(feedUser)}` }}
                        />
                        
                        <div>
                          <h4 style={{ margin: '0 0 4px 0', fontSize: '18px', color: 'white', fontWeight: 'bold' }}>{feedUser}</h4>
                          <div style={{ fontSize: '13px', color: activeColor, fontWeight: 'bold' }}>@{feedHandle}</div>
                          {selectedMPDetails.riding && (
                            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '4px' }}>
                              {selectedMPDetails.riding}
                            </div>
                          )}
                        </div>
                        
                        <div style={{
                          background: 'rgba(255,255,255,0.03)',
                          border: '1px solid rgba(255,255,255,0.06)',
                          padding: '12px',
                          borderRadius: '8px',
                          fontSize: '11px',
                          color: 'rgba(255,255,255,0.5)',
                          lineHeight: '1.4',
                          maxWidth: '260px'
                        }}>
                          ℹ️ External timeline widgets may be blocked by your browser's default tracking protection. Click below to open profile.
                        </div>
                        
                        <span
                          style={{
                            background: activeColor,
                            color: 'white',
                            padding: '8px 16px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            display: 'inline-block'
                          }}
                        >
                          Open X Profile ↗
                        </span>
                      </div>
                    </a>
                  </div>
                <a
                  href={`https://x.com/${feedHandle}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    background: 'rgba(255,255,255,0.08)',
                    color: 'white',
                    textDecoration: 'none',
                    padding: '10px 16px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 'bold',
                    border: '1px solid rgba(255,255,255,0.1)',
                    transition: 'all 0.2s',
                    flexShrink: 0,
                    textAlign: 'center'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.15)';
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                  }}
                >
                  Open X Profile @{feedHandle} ↗
                </a>
              </div>
            ) : (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', padding: '24px', textAlign: 'center', gap: '16px' }}>
                <div style={{ fontSize: '40px', opacity: 0.5 }}>🚫</div>
                <h4 style={{ margin: 0, color: 'white' }}>No Social Feed Link Available</h4>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0, maxWidth: '280px' }}>
                  This representative ({feedUser}) does not have an X/Twitter account registered in the Parliament database.
                </p>
                <div style={{ fontSize: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', padding: '12px', borderRadius: '8px', width: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-start' }}>
                  <div style={{ color: 'rgba(255,255,255,0.4)', fontWeight: 'bold', textTransform: 'uppercase', fontSize: '9px', letterSpacing: '1px' }}>Contact Options</div>
                  {(() => {
                    const mp = politicians.find(p => p.name === feedUser);
                    if (mp) {
                      return (
                        <>
                          <div style={{ color: 'white', fontSize: '12px' }}>📧 <a href={`mailto:${mp.email}`} style={{ color: activeColor, textDecoration: 'none' }}>{mp.email}</a></div>
                          <div style={{ color: 'white', fontSize: '12px' }}>📞 {mp.voice || 'N/A'}</div>
                        </>
                      );
                    }
                    return <div style={{ color: 'rgba(255,255,255,0.5)' }}>Use the roster panel to select other members.</div>;
                  })()}
                </div>
              </div>
            )}
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
                className={`mp-card ${feedUser === 'Avi Lewis' ? 'selected' : ''}`}
                style={{ 
                  gridColumn: '1 / -1', 
                  background: feedUser === 'Avi Lewis' ? 'rgba(243, 112, 33, 0.15)' : 'rgba(243, 112, 33, 0.08)', 
                  borderLeft: `3px solid ${activeColor}`,
                  padding: '16px', 
                  borderRadius: '10px', 
                  display: 'flex', 
                  gap: '16px', 
                  alignItems: 'center',
                  marginBottom: '4px'
                }}
                onClick={() => {
                  setFeedHandle(PARTY_FEEDS['NDP'].handle);
                  setFeedUser(PARTY_FEEDS['NDP'].user);
                }}
              >
                <img 
                  src={PARTY_FEEDS['NDP'].avatar} 
                  alt="Avi Lewis" 
                  style={{ width: '50px', height: '50px', borderRadius: '50%', border: '2px solid #f37021' }} 
                />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <h4 style={{ margin: 0, color: 'white', fontSize: '15px' }}>Avi Lewis</h4>
                    <span style={{ fontSize: '10px', background: 'rgba(76, 175, 80, 0.15)', border: '1px solid rgba(76, 175, 80, 0.3)', color: '#81c784', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>
                      X Active
                    </span>
                  </div>
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
               const isSelected = p.name === feedUser;
               return (
                <div 
                  key={p.url} 
                  className={`mp-card ${isSelected ? 'selected' : ''}`}
                  style={{ 
                    borderLeft: isSelected ? `3px solid ${activeColor}` : '3px solid transparent'
                  }}
                  onClick={() => {
                    setFeedHandle(p.twitter);
                    setFeedUser(p.name);
                  }}
                >
                   <img 
                     src={`https://openparliament.ca${p.image}`} 
                     style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }} 
                     onError={(e) => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(p.name)}&background=random` }} 
                   />
                   <div style={{ minWidth: 0, flex: 1, display: 'flex', flexDirection: 'column', gap: '2px' }}>
                     <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', alignItems: 'center' }}>
                       <div style={{ fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'white', flex: 1 }}>
                         {p.name}
                       </div>
                       {p.twitter ? (
                         <span style={{ fontSize: '9px', background: 'rgba(76, 175, 80, 0.15)', border: '1px solid rgba(76, 175, 80, 0.3)', color: '#81c784', padding: '1px 4px', borderRadius: '4px', fontWeight: 'bold', flexShrink: 0 }}>
                           X Active
                         </span>
                       ) : (
                         <span style={{ fontSize: '9px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)', padding: '1px 4px', borderRadius: '4px', flexShrink: 0 }}>
                           No X
                         </span>
                       )}
                     </div>
                     <div style={{ fontSize: '12px', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                       {p.current_riding.name.en}
                     </div>
                     <div style={{ fontSize: '11px', color: activeColor, fontWeight: '500', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
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
