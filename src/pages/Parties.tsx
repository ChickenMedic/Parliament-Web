import { useState, useMemo, useEffect } from 'react';
import politiciansData from '../data/politicians.json';
import rolesData from '../data/roles.json';
import tweetsDataRaw from '../data/tweets.json';
import './PageStyles.css';

const tweetsData = tweetsDataRaw as Record<string, any[]>;

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
    user: 'Liberal Party',
    handle: 'liberal_party',
    avatar: '/Liberals.jpg'
  },
  'Conservative': {
    user: 'Conservative Party',
    handle: 'CPC_HQ',
    avatar: '/Conservatives.jpg'
  },
  'NDP': {
    user: 'Canada\'s NDP',
    handle: 'NDP',
    avatar: '/NDP.png'
  },
  'Bloc Québécois': {
    user: 'Bloc Québécois',
    handle: 'BlocQuebecois',
    avatar: '/Bloc.jpg'
  },
  'Green Party': {
    user: 'Green Party of Canada',
    handle: 'CanadianGreens',
    avatar: '/GreenParty.jpg'
  },
  'Independent': {
    user: 'House of Commons',
    handle: 'OurCommons',
    avatar: '/HouseOfCommons.jpg'
  }
};

const PARTY_LEADERS: Record<string, { name: string, title: string, xHandle: string }> = {
  'Liberal': { name: 'Mark Carney', title: 'Leader of the Liberal Party & Prime Minister', xHandle: 'MarkJCarney' },
  'Conservative': { name: 'Pierre Poilievre', title: 'Leader of the Conservative Party & Official Opposition', xHandle: 'PierrePoilievre' },
  'NDP': { name: 'Avi Lewis', title: 'Leader of the New Democratic Party', xHandle: 'avilewis' },
  'Bloc Québécois': { name: 'Yves-François Blanchet', title: 'Leader of the Bloc Québécois', xHandle: 'yfblanchet' },
  'Green Party': { name: 'Elizabeth May', title: 'Leader of the Green Party', xHandle: 'ElizabethMay' },
};


export const Parties = () => {
  const [activeTab, setActiveTab] = useState('Liberal');
  const [cabinetFilter, setCabinetFilter] = useState('');
  const [sortOrder, setSortOrder] = useState<'A-Z' | 'Z-A'>('A-Z');
  const politicians = politiciansData.objects as any[];

  const tabs = ['Bloc Québécois', 'Conservative', 'Green Party', 'Independent', 'Liberal', 'NDP'];

  const [feedHandle, setFeedHandle] = useState<string | null>(PARTY_FEEDS['Liberal'].handle);
  const [feedUser, setFeedUser] = useState<string>(PARTY_FEEDS['Liberal'].user);



  // Sync feed with activeTab change
  useEffect(() => {
    setFeedHandle(PARTY_FEEDS[activeTab].handle);
    setFeedUser(PARTY_FEEDS[activeTab].user);
  }, [activeTab]);



  const filteredMPs = useMemo(() => {
    return politicians.filter(p => {
      // Normalize 'Bloc Québécois' to 'Bloc' for MP data matching, similar for Green/Independents
      const targetParty = activeTab === 'Bloc Québécois' ? 'Bloc' : 
                          activeTab === 'Green Party' ? 'Green' : activeTab;
      
      if (targetParty === 'Independent') {
        if (p.current_party.short_name.en !== 'Independent' && p.current_party.short_name.en !== 'No Affiliation') return false;
      } else {
        if (p.current_party.short_name.en !== targetParty) return false;
      }
      
      const role = (rolesData as Record<string, string>)[p.name];
      if (cabinetFilter === 'Cabinet') {
        return targetParty === 'Liberal' && role && role !== 'Speaker of the House of Commons';
      } else if (cabinetFilter === 'Shadow Cabinet') {
        return targetParty === 'Conservative' && role && role.includes('Shadow Minister');
      }
      
      const leader = PARTY_LEADERS[activeTab];
      if (leader && p.name === leader.name) return false;

      return true;
    }).sort((a, b) => {
      const aLast = a.name.split(' ').pop() || '';
      const bLast = b.name.split(' ').pop() || '';
      return sortOrder === 'A-Z' ? aLast.localeCompare(bLast) : bLast.localeCompare(aLast);
    });
  }, [activeTab, cabinetFilter, sortOrder, politicians]);

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
                <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', background: 'rgba(0,0,0,0.15)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  {tweetsData[feedHandle] && tweetsData[feedHandle].length > 0 ? (
                    tweetsData[feedHandle].map((t: any, idx: number) => (
                      <div key={t.id || idx} style={{ padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: '12px', textAlign: 'left' }}>
                        <img 
                          src={PARTY_FEEDS[activeTab]?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(feedUser)}`} 
                          alt="" 
                          style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
                          onError={(e) => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(feedUser)}` }}
                        />
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                            <strong style={{ color: 'white', fontSize: '13px' }}>{feedUser}</strong>
                            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px' }}>@{feedHandle}</span>
                            <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px' }}>·</span>
                            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px' }}>
                              {new Date(t.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            </span>
                          </div>
                          
                          <p style={{ margin: '6px 0 10px 0', fontSize: '13px', color: 'rgba(255,255,255,0.9)', lineHeight: '1.45', whiteSpace: 'pre-line', wordBreak: 'break-word' }}>
                            {t.content.split(/\s+/).map((word: string, wIdx: number) => {
                              if (word.startsWith('http')) {
                                return <a key={wIdx} href={word} target="_blank" rel="noopener noreferrer" style={{ color: '#1d9bf0', fontWeight: 'bold', textDecoration: 'none' }}>{word} </a>;
                              }
                              if (word.startsWith('@')) {
                                const cleanWord = word.replace(/[^a-zA-Z0-9_@]/g, '');
                                return <span key={wIdx}><a href={`https://x.com/${cleanWord.substring(1)}`} target="_blank" rel="noopener noreferrer" style={{ color: '#1d9bf0', fontWeight: 'bold', textDecoration: 'none' }}>{cleanWord}</a>{word.substring(cleanWord.length)} </span>;
                              }
                              if (word.startsWith('#')) {
                                const cleanWord = word.replace(/[^a-zA-Z0-9_#]/g, '');
                                return <span key={wIdx}><a href={`https://x.com/hashtag/${cleanWord.substring(1)}`} target="_blank" rel="noopener noreferrer" style={{ color: '#1d9bf0', fontWeight: 'bold', textDecoration: 'none' }}>{cleanWord}</a>{word.substring(cleanWord.length)} </span>;
                              }
                              return word + ' ';
                            })}
                          </p>
                          
                          {t.metrics && (
                            <div style={{ display: 'flex', gap: '20px', color: 'rgba(255,255,255,0.4)', fontSize: '11px', marginTop: '8px' }}>
                              <span>💬 {t.metrics.reply_count}</span>
                              <span>🔁 {t.metrics.retweet_count}</span>
                              <span>❤️ {t.metrics.like_count}</span>
                              <span>📊 {t.metrics.impression_count}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div style={{ padding: '32px', textAlign: 'center', color: 'rgba(255,255,255,0.5)', fontSize: '13px' }}>
                      <p>Waiting for script to fetch posts for @{feedHandle}...</p>
                      <p style={{ fontSize: '11px', marginTop: '8px' }}>Run <code style={{ background: 'rgba(0,0,0,0.3)', padding: '2px 4px', borderRadius: '4px' }}>npm run fetch-tweets</code> to populate data.</p>
                    </div>
                  )}
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
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: '8px', background: 'rgba(0,0,0,0.2)', padding: '4px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
                <button 
                  onClick={() => setSortOrder('A-Z')}
                  style={{ padding: '6px 12px', background: sortOrder === 'A-Z' ? 'rgba(255,255,255,0.1)' : 'transparent', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', transition: 'all 0.2s' }}
                >
                  A-Z
                </button>
                <button 
                  onClick={() => setSortOrder('Z-A')}
                  style={{ padding: '6px 12px', background: sortOrder === 'Z-A' ? 'rgba(255,255,255,0.1)' : 'transparent', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', transition: 'all 0.2s' }}
                >
                  Z-A
                </button>
              </div>
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
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', overflowY: 'auto', paddingRight: '8px', alignContent: 'start' }}>
            {/* Generic Leader Special Card */}
            {PARTY_LEADERS[activeTab] && (() => {
              const leader = PARTY_LEADERS[activeTab];
              const leaderMpDetails = politicians.find(p => p.name === leader.name);
              
              const leaderImage = leaderMpDetails 
                ? `https://openparliament.ca${leaderMpDetails.image}` 
                : (leader.name === 'Avi Lewis' ? '/Avi_Lewis.jpg' : PARTY_FEEDS[activeTab]?.avatar);

              return (
                <div 
                  className="mp-card"
                  style={{ 
                    gridColumn: '1 / -1', 
                    background: `${activeColor}15`, 
                    borderLeft: `3px solid ${activeColor}`,
                    padding: '16px', 
                    borderRadius: '10px', 
                    display: 'flex', 
                    gap: '16px', 
                    alignItems: 'center',
                    marginBottom: '4px'
                  }}
                >
                  <img 
                    src={leaderImage} 
                    alt={leader.name} 
                    style={{ width: 45, height: 60, borderRadius: '5px', border: `2px solid ${activeColor}`, objectFit: 'cover', objectPosition: 'center 10%' }} 
                    onError={(e) => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(leader.name)}&background=random` }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <h4 style={{ margin: 0, color: 'white', fontSize: '15px' }}>{leader.name}</h4>
                      {leader.xHandle && (
                        <a 
                          href={`https://x.com/${leader.xHandle}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          style={{ textDecoration: 'none', fontSize: '10px', background: 'rgba(29, 155, 240, 0.15)', border: '1px solid rgba(29, 155, 240, 0.3)', color: '#1d9bf0', padding: '4px 8px', borderRadius: '4px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px', transition: 'all 0.2s' }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(29, 155, 240, 0.25)')}
                          onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(29, 155, 240, 0.15)')}
                        >
                          X Profile ↗
                        </a>
                      )}
                    </div>
                    <div style={{ fontSize: '12px', color: activeColor, fontWeight: 'bold', textTransform: 'uppercase', marginTop: '2px' }}>
                      {leader.title}
                    </div>
                    {!leaderMpDetails && (
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                        * Leader outside of Parliament (not an elected MP in the current session)
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

            {filteredMPs.map(p => {
               const role = (rolesData as Record<string, string>)[p.name] || 'Member of Parliament';
               return (
                <div 
                  key={p.url} 
                  className="mp-card"
                  style={{ 
                    borderLeft: '3px solid transparent'
                  }}
                >
                   <img 
                     src={`https://openparliament.ca${p.image}`} 
                     style={{ width: 45, height: 60, borderRadius: '5px', objectFit: 'cover', objectPosition: 'center 10%' }} 
                     onError={(e) => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(p.name)}&background=random` }} 
                   />
                     <div style={{ minWidth: 0, flex: 1, display: 'flex', flexDirection: 'column', gap: '2px' }}>
                       <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', alignItems: 'flex-start' }}>
                         <div style={{ fontWeight: 'bold', color: 'white', flex: 1, lineHeight: '1.2' }}>
                           {p.name}
                         </div>
                       {p.twitter ? (
                         <a 
                           href={`https://x.com/${p.twitter}`} 
                           target="_blank" 
                           rel="noopener noreferrer"
                           style={{ textDecoration: 'none', fontSize: '9px', background: 'rgba(29, 155, 240, 0.15)', border: '1px solid rgba(29, 155, 240, 0.3)', color: '#1d9bf0', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold', flexShrink: 0, transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '2px' }}
                           onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(29, 155, 240, 0.25)')}
                           onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(29, 155, 240, 0.15)')}
                         >
                           X Profile ↗
                         </a>
                       ) : (
                         <span style={{ fontSize: '9px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)', padding: '2px 6px', borderRadius: '4px', flexShrink: 0 }}>
                           No X
                         </span>
                       )}
                     </div>
                     <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                       {p.current_riding.name.en}
                     </div>
                     <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)', lineHeight: '1.3' }}>
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
