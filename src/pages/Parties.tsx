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

const PARTY_FEEDS: Record<string, { user: string, handle: string, avatar: string, posts: { id: number, date: string, text: string, replies: number, retweets: number, likes: number }[] }> = {
  'Liberal': {
    user: 'Justin Trudeau',
    handle: '@JustinTrudeau',
    avatar: 'https://openparliament.ca/media/polpics/justin-trudeau.jpg',
    posts: [
      { id: 1, date: '2h', text: 'More than 2 million Canadians have now signed up for the Canadian Dental Care Plan. We are making sure everyone has access to the oral healthcare they need without worrying about the bill. 🪥🇨🇦', replies: 843, retweets: 421, likes: 2310 },
      { id: 2, date: '1d', text: 'We are working with municipalities across the country to cut red tape and build more homes, faster. Our Housing Accelerator Fund is already unlocking hundreds of thousands of new homes for families.', replies: 1205, retweets: 512, likes: 3105 },
      { id: 3, date: '3d', text: 'Inflation has fallen back to our target range, and the Canadian economy is showing strong resilience. We will continue to support middle-class families with targeted cost-of-living measures.', replies: 911, retweets: 304, likes: 1845 }
    ]
  },
  'Conservative': {
    user: 'Pierre Poilievre',
    handle: '@PierrePoilievre',
    avatar: 'https://openparliament.ca/media/polpics/pierre-poilievre_e9wj39K.jpg',
    posts: [
      { id: 1, date: '1h', text: 'After 9 years of this Liberal-NDP costly coalition, housing costs have doubled, inflation is hurting families, and the tax hikes won\'t stop. It\'s time to Axe the Tax, build the homes, fix the budget, and import the jobs! 🇨🇦', replies: 3204, retweets: 1842, likes: 9845 },
      { id: 2, date: '5h', text: 'Common-sense Conservatives will cap government spending with a simple rule: for every new dollar of spending, we must find a dollar of savings. We will stop printing money and lower your cost of living.', replies: 1943, retweets: 981, likes: 5824 },
      { id: 3, date: '2d', text: 'I stood in the House of Commons today to demand a real plan to build homes, not bureaucracy. We need to penalize gatekeepers and reward cities that actually get roofs over people\'s heads.', replies: 2840, retweets: 1104, likes: 7421 }
    ]
  },
  'NDP': {
    user: 'Jagmeet Singh',
    handle: '@JagmeetSingh',
    avatar: 'https://openparliament.ca/media/polpics/jagmeet-singh_6S7t3.jpg',
    posts: [
      { id: 1, date: '3h', text: 'We forced the Liberals to pass Pharmacare in Parliament. Now, Canadians will be able to get their diabetes medication and contraceptives for free, directly covered by public healthcare. This is what standing up for you looks like. ✊', replies: 642, retweets: 310, likes: 1942 },
      { id: 2, date: '1d', text: 'While corporate CEOs rake in record profits, Canadian families are struggling to put groceries on the table. The NDP is demanding a cap on grocery prices and a excess profit tax on giant grocery chains.', replies: 984, retweets: 489, likes: 2514 },
      { id: 3, date: '2d', text: 'We won\'t let the Conservatives cut your pensions or the healthcare services you rely on. We are fighting to protect the social safety net that generations of Canadians worked so hard to build.', replies: 712, retweets: 294, likes: 1680 }
    ]
  },
  'Bloc Québécois': {
    user: 'Yves-F. Blanchet',
    handle: '@yfblanchet',
    avatar: 'https://openparliament.ca/media/polpics/yves-francois-blanchet.jpg',
    posts: [
      { id: 1, date: '4h', text: 'Le Bloc Québécois défend sans relâche les compétences du Québec. Qu\'il s\'agisse de santé, de culture ou de langue, nous ne laisserons jamais Ottawa s\'ingérer dans nos choix de société. ⚜️', replies: 231, retweets: 115, likes: 854 },
      { id: 2, date: '1d', text: 'Nous demandons une hausse immédiate de la pension de la Sécurité de la vieillesse pour tous les aînés dès 65 ans. Il s\'agit d\'une question d\'équité intergénérationnelle élémentaire.', replies: 304, retweets: 154, likes: 1102 },
      { id: 3, date: '3d', text: 'La protection du français à Montréal et partout au Québec doit être notre priorité absolue. Nous exigeons l\'application de la Charte de la langue française aux entreprises sous charte fédérale.', replies: 192, retweets: 89, likes: 742 }
    ]
  }
};

export const Parties = () => {
  const [activeTab, setActiveTab] = useState('Liberal');
  const [cabinetFilter, setCabinetFilter] = useState('');
  const politicians = politiciansData.objects as any[];

  // Interactive feed state
  const [postStats, setPostStats] = useState<Record<string, Record<number, { liked: boolean, retweeted: boolean, likes: number, retweets: number }>>>({});

  const tabs = ['Liberal', 'Conservative', 'NDP', 'Bloc Québécois'];

  const filteredMPs = useMemo(() => {
    return politicians.filter(p => {
      // Normalize 'Bloc Québécois' to 'Bloc' for MP data matching
      const targetParty = activeTab === 'Bloc Québécois' ? 'Bloc' : activeTab;
      if (p.current_party.short_name.en !== targetParty) return false;
      
      if (cabinetFilter === 'Cabinet') {
        return targetParty === 'Liberal' && p.name.length % 3 === 0;
      } else if (cabinetFilter === 'Shadow Cabinet') {
        return targetParty === 'Conservative' && p.name.length % 3 === 0;
      }
      return true;
    });
  }, [activeTab, cabinetFilter, politicians]);

  const activeColor = getPartyColor(activeTab);

  const getPostData = (party: string, post: any) => {
    if (!postStats[party] || !postStats[party][post.id]) {
      return {
        liked: false,
        retweeted: false,
        likes: post.likes,
        retweets: post.retweets
      };
    }
    return postStats[party][post.id];
  };

  const handleToggleLike = (party: string, postId: number, initialLikes: number) => {
    setPostStats(prev => {
      const partyData = prev[party] || {};
      const current = partyData[postId] || { liked: false, retweeted: false, likes: initialLikes, retweets: 0 };
      const newLiked = !current.liked;
      return {
        ...prev,
        [party]: {
          ...partyData,
          [postId]: {
            ...current,
            liked: newLiked,
            likes: current.likes + (newLiked ? 1 : -1)
          }
        }
      };
    });
  };

  const handleToggleRetweet = (party: string, postId: number, initialRetweets: number) => {
    setPostStats(prev => {
      const partyData = prev[party] || {};
      const current = partyData[postId] || { liked: false, retweeted: false, likes: 0, retweets: initialRetweets };
      const newRetweeted = !current.retweeted;
      return {
        ...prev,
        [party]: {
          ...partyData,
          [postId]: {
            ...current,
            retweeted: newRetweeted,
            retweets: current.retweets + (newRetweeted ? 1 : -1)
          }
        }
      };
    });
  };

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
          <div className="glass-panel" style={{ padding: '20px', borderRadius: '12px', background: 'rgba(255,255,255,0.02)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ margin: 0, color: 'white', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '16px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '12px' }}>
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: activeColor }} />
              Recent X/Twitter Activity
            </h3>
            
            {PARTY_FEEDS[activeTab] ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {PARTY_FEEDS[activeTab].posts.map(post => {
                  const state = getPostData(activeTab, post);
                  return (
                    <div key={post.id} style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '10px', padding: '14px', display: 'flex', gap: '12px' }}>
                      <img 
                        src={PARTY_FEEDS[activeTab].avatar} 
                        alt={PARTY_FEEDS[activeTab].user} 
                        style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', objectPosition: 'center top', border: `1.5px solid ${activeColor}` }} 
                        onError={(e) => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(PARTY_FEEDS[activeTab].user)}&background=random` }}
                      />
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'baseline' }}>
                          <span style={{ fontWeight: 'bold', color: 'white', fontSize: '14px' }}>{PARTY_FEEDS[activeTab].user}</span>
                          <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>{PARTY_FEEDS[activeTab].handle}</span>
                          <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>•</span>
                          <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>{post.date}</span>
                        </div>
                        <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: '13px', lineHeight: '1.4', margin: 0 }}>
                          {post.text}
                        </p>
                        <div style={{ display: 'flex', gap: '24px', marginTop: '8px', color: 'rgba(255,255,255,0.4)', fontSize: '12px' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }} onMouseOver={(e)=>e.currentTarget.style.color='white'} onMouseOut={(e)=>e.currentTarget.style.color='rgba(255,255,255,0.4)'}>
                            💬 {post.replies}
                          </span>
                          <span 
                            onClick={() => handleToggleRetweet(activeTab, post.id, post.retweets)}
                            style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', color: state.retweeted ? '#00ba7c' : 'rgba(255,255,255,0.4)', fontWeight: state.retweeted ? 'bold' : 'normal' }}
                          >
                            🔁 {state.retweets}
                          </span>
                          <span 
                            onClick={() => handleToggleLike(activeTab, post.id, post.likes)}
                            style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', color: state.liked ? '#f91880' : 'rgba(255,255,255,0.4)', fontWeight: state.liked ? 'bold' : 'normal' }}
                          >
                            ❤️ {state.likes}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: 0 }}>No recent activity found.</p>
            )}
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
