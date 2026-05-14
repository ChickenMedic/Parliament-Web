import { useState, useEffect } from 'react';
import { Sidebar } from '../components/Sidebar';
import { MapComponent } from '../components/MapComponent';

export const Dashboard = () => {
  const [selectedMP, setSelectedMP] = useState<any>(null);
  const [mobileView, setMobileView] = useState<'map' | 'list'>('map');
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 1024);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="dashboard-container">
      {(!isMobile || mobileView === 'list') && (
         <div className="sidebar-wrapper">
           <Sidebar selectedMP={selectedMP} setSelectedMP={(mp) => {
             setSelectedMP(mp);
             if (isMobile) setMobileView('map');
           }} />
         </div>
      )}
      
      {(!isMobile || mobileView === 'map') && (
         <div className="map-container glass-panel">
           <MapComponent selectedMP={selectedMP} setSelectedMP={setSelectedMP} />
         </div>
      )}

      {isMobile && (
        <div style={{ position: 'fixed', bottom: '10px', left: '10px', right: '10px', height: '56px', background: 'rgba(20, 20, 20, 0.95)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', display: 'flex', zIndex: 9999, overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
          <button 
             onClick={() => setMobileView('map')}
             style={{ flex: 1, background: mobileView === 'map' ? 'rgba(255,255,255,0.1)' : 'transparent', border: 'none', color: mobileView === 'map' ? 'white' : 'rgba(255,255,255,0.4)', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
          >
             Map
          </button>
          <button 
             onClick={() => setMobileView('list')}
             style={{ flex: 1, background: mobileView === 'list' ? 'rgba(255,255,255,0.1)' : 'transparent', border: 'none', color: mobileView === 'list' ? 'white' : 'rgba(255,255,255,0.4)', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
          >
             MPs List
          </button>
        </div>
      )}
    </div>
  );
};
