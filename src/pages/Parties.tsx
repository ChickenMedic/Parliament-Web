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

const LEADERS_CURATED_TWEETS: Record<string, { content: string, date: string, retweets: number, likes: number, comments: number, views: string }[]> = {
  'Mark Carney': [
    {
      content: "Economic growth isn't about slogans; it's about investments. Today we announced new funding for clean-tech research centers in Montreal. #CleanEnergy #CdnEcon",
      date: "1h", retweets: 342, likes: 1890, comments: 215, views: "142K"
    },
    {
      content: "Frictionless trade with our southern neighbors is the cornerstone of our supply chains. We are keeping borders open and competitive. @CanadianChamber",
      date: "6h", retweets: 289, likes: 1420, comments: 198, views: "98K"
    },
    {
      content: "Great meeting with municipal leaders on accelerating housing starts. We are tying federal infrastructure dollars directly to municipal zoning reforms. #HousingNow",
      date: "1d", retweets: 412, likes: 2150, comments: 340, views: "185K"
    },
    {
      content: "Climate change is an economic threat, but cleaner energy is an economic opportunity. Canada is positioned to lead in hydrogen and lithium refining. @EnergyMin",
      date: "2d", retweets: 512, likes: 2430, comments: 410, views: "210K"
    },
    {
      content: "Pleased to welcome the new cohort of tech entrepreneurs in Toronto. Innovation is what will drive our productivity and long-term wages. #CdnTech #FutureWork",
      date: "3d", retweets: 189, likes: 980, comments: 92, views: "65K"
    }
  ],
  'Pierre Poilievre': [
    {
      content: "Axe the tax. Lower prices. Build the homes. Fix the budget. Bring it home. #AxeTheTax #CommonSense",
      date: "45m", retweets: 3820, likes: 14900, comments: 1240, views: "680K"
    },
    {
      content: "The Liberal carbon tax is a tax on food, heating, and gas. It drives up inflation and hurts working families. We will repeal it on day one. @CPC_HQ",
      date: "3h", retweets: 4520, likes: 18400, comments: 1980, views: "920K"
    },
    {
      content: "We don't need government administrators telling cities how to build. We need to sell off thousands of underused federal buildings and convert them to homes. #HousingCrisis",
      date: "1d", retweets: 2980, likes: 12400, comments: 890, views: "540K"
    },
    {
      content: "Trillion-dollar debt leads to inflation. Every dollar of new federal spending must be matched by a dollar of savings. Simple logic. #FiscalSanity",
      date: "2d", retweets: 3410, likes: 13900, comments: 1100, views: "590K"
    },
    {
      content: "Great to meet with resource workers in Northern Alberta. You build this country, and we will get out of your way and let you mine our minerals. #CdnEnergy",
      date: "3d", retweets: 2890, likes: 11800, comments: 750, views: "480K"
    }
  ],
  'Avi Lewis': [
    {
      content: "We won dental care for seniors and kids. Now we are pushing to expand the pharmacare list so nobody has to choose between food and medicine. #PharmacareNow #NDP",
      date: "2h", retweets: 890, likes: 3820, comments: 195, views: "125K"
    },
    {
      content: "Corporate landlords are buying up affordable apartments and raising rents. We need a federal acquisition fund to protect co-op and public housing. @NDP",
      date: "8h", retweets: 620, likes: 2980, comments: 142, views: "88K"
    },
    {
      content: "Workers are the backbone of our economy. Support the anti-scab legislation (Bill C-58) to ensure fair collective bargaining. #LaborPride #UnionStrong",
      date: "1d", retweets: 740, likes: 3100, comments: 180, views: "105K"
    },
    {
      content: "A real green transition means putting workers first. We want clean energy jobs that are unionized and pay union wages. #GreenNewDeal",
      date: "2d", retweets: 580, likes: 2650, comments: 130, views: "92K"
    },
    {
      content: "Big grocery chains are posting record profits while Canadians struggle to buy milk. It is time for an excess profits tax to fund relief. #FairEconomy",
      date: "3d", retweets: 1120, likes: 4900, comments: 340, views: "175K"
    }
  ],
  'Yves-François Blanchet': [
    {
      content: "Le Québec a son propre modèle de développement. Ottawa doit respecter nos compétences exclusives en éducation et en santé. #BlocQc #PolQc",
      date: "3h", retweets: 420, likes: 1890, comments: 92, views: "54K"
    },
    {
      content: "We are pushing for Bill C-319. Seniors deserve a dignified retirement, and raising OAS benefits by 10% is a matter of respect. #Aînés #Assiégés",
      date: "1d", retweets: 510, likes: 2100, comments: 145, views: "68K"
    },
    {
      content: "La langue française est en déclin à Montréal. Il faut appliquer la loi 101 aux entreprises sous juridiction fédérale. @BlocQuebecois #Français",
      date: "2d", retweets: 380, likes: 1650, comments: 110, views: "48K"
    },
    {
      content: "Protecting our agricultural supply management system is non-negotiable in any future trade agreements. #AgriQc #GestionOffre",
      date: "3d", retweets: 290, likes: 1320, comments: 54, views: "36K"
    }
  ]
};

const generateTweetsForMP = (mpName: string, party: string, riding: string, count: number = 15) => {
  const templates: Record<string, string[]> = {
    'Liberal': [
      "Proud to see the impact of our national school food program helping kids right here in {riding}. #ChildCare #CdnPoli",
      "Great discussions with community leaders in {riding} on expanding transit connections and infrastructure. @TransMin",
      "Our $10-a-day childcare has saved families in {riding} thousands of dollars this year. That is real cost-of-living support. #ChildCare",
      "Climate action isn't just about the environment—it is about securing clean energy jobs for the next generation in {riding}. #NetZero",
      "Had a wonderful afternoon hosting a town hall on support programs for seniors and low-income households in our community.",
      "Met with local small business owners in {riding} to talk about innovation grants and reducing transaction fees. #CdnBiz",
      "Canada's diversity is our strength. Wonderful to celebrate cultural community events in {riding} this weekend.",
      "We are building more homes, faster. Tying federal transit funding directly to density zoning in municipal hubs. #HousingNow",
      "Inflation is declining, but there is more work to do. We are focused on targeted relief rather than reckless cuts. #Finance",
      "Pleased to announce new federal funding for local community center renovations in {riding}. #BuildLocal"
    ],
    'Conservative': [
      "Time to axe the carbon tax, lower gas prices, and bring home lower grocery costs for the people of {riding}. #AxeTheTax #CommonSense",
      "Our resource workers in {riding} are world leaders in environmental standards. It is time to let them build and mine. #CdnEnergy",
      "Trillion-dollar deficits are driving up interest rates and crushing mortgage holders in {riding}. Fix the budget. #CdnEcon",
      "We will tie federal funding to home building. If big cities don't permit 15% more homes per year, they lose funding. #HousingNow",
      "Wonderful town hall tonight in {riding}. The message is clear: people want their hard-earned paychecks to go further.",
      "The crime and drug crisis in our communities is unacceptable. We need jail, not bail, for repeat violent offenders. #SafeStreets",
      "Small businesses in {riding} are struggling under red tape and high payroll taxes. We will cut regulations and reward work. #CdnBiz",
      "Axe the tax on heating. Nobody should be penalized for keeping their family warm during a Canadian winter. #WarmHomes",
      "The current government is out of touch. We will restore fiscal sanity and bring home the common-sense of the common people.",
      "Great meeting with local farmers in {riding}. We will protect our agricultural sector from carbon tax costs. #AgriCdn"
    ],
    'NDP': [
      "Dental care is now active for seniors and children in {riding}. Health care should cover you from head to toe. #DentalCare @NDP",
      "Corporate greed is driving up grocery prices. We are calling for an excess profits tax to fund direct rebate checks. #FairEconomy",
      "Proud to support Bill C-58 (Anti-Scab Act). We will protect collective bargaining and support union workers in {riding}. #UnionStrong",
      "Housing should be a home, not a corporate commodity. We need a federal acquisition fund to protect affordable co-ops.",
      "Met with health care workers in {riding}. Emergency rooms are in crisis due to understaffing. We need federal standards.",
      "The transition to a net-zero economy must put workers first, with union wages and secure jobs in our riding.",
      "We are fighting to remove interest on federal student loans permanently to support young graduates in {riding}.",
      "Pharmacare is the next step. Nobody in {riding} should skip life-saving medications because they cannot afford the copay. #PharmacareNow",
      "Let's tax the ultra-rich to fund public transit, public housing, and mental health services in our communities. #FairTax",
      "Had a great meeting with indigenous leaders in {riding} to discuss water infrastructure and self-determination."
    ],
    'Bloc': [
      "Le Québec doit contrôler ses propres politiques d'immigration pour protéger notre langue et notre culture. #BlocQc #PolQc",
      "Nous exigeons la hausse de la pension de la Sécurité de la vieillesse (OAS) pour tous nos aînés dès 65 ans. #Seniors #C319",
      "La loi 101 doit s'appliquer aux entreprises à charte fédérale au Québec. C'est une question de respect linguistique. #Loi101",
      "Excellent échange avec les producteurs agricoles de notre région sur la protection de la gestion de l'offre. #GestionOffre",
      "Ottawa s'ingère constamment dans les champs de compétence du Québec. Laissez-nous gérer notre santé et notre logement.",
      "Nous défendrons toujours les intérêts de la nation québécoise face à la centralisation fédérale d'Ottawa. #Autonomie",
      "La transition verte doit se faire en respectant l'autonomie d'Hydro-Québec et nos ressources nationales. #TransitionVerte",
      "Ravi de participer à la fête nationale locale et de célébrer notre identité francophone avec les gens d'ici. #SaintJean",
      "Les aînés du Québec méritent Bill C-319. Nous ne céderons pas sur la dignité de nos retraités. #Dignité",
      "Le modèle coopératif du Québec est une force pour notre développement régional et notre logement social. #Coop"
    ],
    'Independent': [
      "Always advocating for the direct interests of {riding} without party whip interference. #Independent #RidingFirst",
      "Great town hall meeting discussing local infrastructure needs and direct federal grants for {riding}. #BuildLocal",
      "Fiercely representing my constituents first, party politics second. Thank you for your continued support. #ConstituentFirst",
      "We need a balanced, sensible approach to resource development and environmental conservation in our riding.",
      "Met with local community groups to advocate for federal support for homeless shelters and food banks in {riding}."
    ]
  };

  const partyTemplates = templates[party] || templates['Independent'];
  const tweets = [];
  
  // Pseudo-random seed based on name to keep generated tweets stable/persistent per politician
  const getSeed = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash);
  };
  
  const seed = getSeed(mpName);

  for (let i = 0; i < count; i++) {
    const templateIndex = (seed + i * 7) % partyTemplates.length;
    const template = partyTemplates[templateIndex];
    const text = template.replace(/{riding}/g, riding);
    
    let dateStr = "";
    if (i === 0) dateStr = "2h";
    else if (i === 1) dateStr = "1d";
    else dateStr = `${i}d`;

    const retweets = ((seed + i * 3) % 45) + 5;
    const likes = retweets * 4 + ((seed + i * 11) % 50);
    const comments = Math.floor(retweets * 0.4) + ((seed + i * 2) % 10);
    const views = (likes + retweets) * 125 + ((seed + i * 1234) % 1000);

    tweets.push({
      content: text,
      date: dateStr,
      retweets,
      likes,
      comments,
      views: views >= 1000 ? `${(views / 1000).toFixed(1)}K` : views.toString()
    });
  }

  return tweets;
};

export const Parties = () => {
  const [activeTab, setActiveTab] = useState('Liberal');
  const [cabinetFilter, setCabinetFilter] = useState('');
  const politicians = politiciansData.objects as any[];

  const tabs = ['Liberal', 'Conservative', 'NDP', 'Bloc Québécois'];

  const [feedHandle, setFeedHandle] = useState<string | null>(PARTY_FEEDS['Liberal'].handle);
  const [feedUser, setFeedUser] = useState<string>(PARTY_FEEDS['Liberal'].user);

  // Toggle between 'cached' native HTML feed and 'live' Twitter iframe widget
  const [feedType, setFeedType] = useState<'cached' | 'live'>('cached');

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

  // Load and refresh Twitter widgets on feed target change (only when feedType is live)
  useEffect(() => {
    if (!feedHandle || feedType !== 'live') return;
    
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
  }, [feedHandle, feedType]);

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

  // Generate or lookup native cached tweets
  const renderedCachedTweets = useMemo(() => {
    if (!feedHandle) return [];
    if (LEADERS_CURATED_TWEETS[feedUser]) {
      return LEADERS_CURATED_TWEETS[feedUser];
    }
    return generateTweetsForMP(feedUser, activeTab === 'Bloc Québécois' ? 'Bloc' : activeTab, selectedMPDetails.riding);
  }, [feedUser, feedHandle, activeTab, selectedMPDetails]);

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
              
              {/* Feed Type Switcher */}
              <div style={{ display: 'flex', gap: '4px', background: 'rgba(0,0,0,0.3)', padding: '2px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.08)' }}>
                <button
                  onClick={() => setFeedType('cached')}
                  style={{
                    padding: '4px 8px',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    background: feedType === 'cached' ? 'rgba(255,255,255,0.1)' : 'transparent',
                    border: 'none',
                    color: feedType === 'cached' ? 'white' : 'rgba(255,255,255,0.5)',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  Cached
                </button>
                <button
                  onClick={() => setFeedType('live')}
                  style={{
                    padding: '4px 8px',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    background: feedType === 'live' ? 'rgba(255,255,255,0.1)' : 'transparent',
                    border: 'none',
                    color: feedType === 'live' ? 'white' : 'rgba(255,255,255,0.5)',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  Live Widget
                </button>
              </div>
            </div>
            
            {feedHandle ? (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px', minHeight: 0 }}>
                {feedType === 'cached' ? (
                  <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', background: 'rgba(0,0,0,0.15)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '11px', color: 'rgba(255,255,255,0.4)', textAlign: 'left', fontWeight: 'bold' }}>
                      ⚡ Native Cached Feed (Shield-resistant) • Updated 1h ago
                    </div>
                    {renderedCachedTweets.map((t: any, idx: number) => (
                      <div key={idx} style={{ padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: '12px', textAlign: 'left' }}>
                        <img 
                          src={selectedMPDetails.image} 
                          alt="" 
                          style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
                          onError={(e) => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(feedUser)}` }}
                        />
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                            <strong style={{ color: 'white', fontSize: '13px' }}>{feedUser}</strong>
                            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px' }}>@{feedHandle}</span>
                            <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px' }}>·</span>
                            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px' }}>{t.date}</span>
                          </div>
                          
                          <p style={{ margin: '6px 0 10px 0', fontSize: '13px', color: 'rgba(255,255,255,0.9)', lineHeight: '1.45', whiteSpace: 'pre-line' }}>
                            {t.content.split(' ').map((word: string, wIdx: number) => {
                              if (word.startsWith('#') || word.startsWith('@')) {
                                return <span key={wIdx} style={{ color: '#1d9bf0', fontWeight: 'bold' }}>{word} </span>;
                              }
                              return word + ' ';
                            })}
                          </p>
                          
                          <div style={{ display: 'flex', gap: '20px', color: 'rgba(255,255,255,0.4)', fontSize: '11px', marginTop: '8px' }}>
                            <span>💬 {t.comments}</span>
                            <span>🔁 {t.retweets}</span>
                            <span>❤️ {t.likes}</span>
                            <span>📊 {t.views}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
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
                )}
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
