import './PageStyles.css';
import { NavLink } from 'react-router-dom';

export const OppositionLeader = () => {
  return (
    <div className="page-container glass-panel" style={{ display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
      
      <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap', marginBottom: '32px' }}>
        {/* Header Profile Section */}
        <div style={{ flex: '1', minWidth: '300px', display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '32px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', textAlign: 'center' }}>
          <img 
            src="https://openparliament.ca/media/polpics/pierre-poilievre_e9wj39K.jpg" 
            alt="Opposition Leader Pierre Poilievre" 
            style={{ width: '120px', height: '160px', borderRadius: '12px', objectFit: 'cover', border: '4px solid #1a4782', marginBottom: '16px', boxShadow: '0 8px 24px rgba(26, 71, 130, 0.4)' }} 
            onError={(e) => (e.target as any).src = "https://ui-avatars.com/api/?name=Pierre+Poilievre"}
          />
          <h1 style={{ margin: '0 0 8px 0', fontSize: '28px', color: 'white' }}>The Honourable Pierre Poilievre</h1>
          <div style={{ fontSize: '15px', color: 'var(--party-conservative)', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>
            Leader of the Official Opposition
          </div>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px', lineHeight: '1.6', margin: 0 }}>
            Serving as the Leader of the Official Opposition, responsible for holding the Government accountable and presenting an alternative government through the Shadow Cabinet.
          </p>
        </div>

        {/* Favourability Ratings */}
        <div style={{ flex: '1.5', minWidth: '400px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h2 style={{ fontSize: '20px', margin: 0, color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
            📊 Favourability Ratings
          </h2>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            {/* Nanos */}
            <div style={{ flex: 1, background: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 'bold', color: 'white' }}>Nanos Research</span>
                <a href="https://nanos.co/" target="_blank" rel="noopener noreferrer" style={{ fontSize: '12px', color: 'var(--accent-color)', textDecoration: 'none' }}>View Data ↗</a>
              </div>
              <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#10b981' }}>44%</div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>Preferred Prime Minister tracking (Week ending May 29)</div>
            </div>
            
            {/* Abacus */}
            <div style={{ flex: 1, background: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 'bold', color: 'white' }}>Abacus Data</span>
                <a href="https://abacusdata.ca/" target="_blank" rel="noopener noreferrer" style={{ fontSize: '12px', color: 'var(--accent-color)', textDecoration: 'none' }}>View Data ↗</a>
              </div>
              <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#f59e0b' }}>41%</div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>Positive Impression (Mid-May Tracker)</div>
            </div>
            
            {/* Leger */}
            <div style={{ flex: 1, background: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 'bold', color: 'white' }}>Leger</span>
                <a href="https://leger360.com/" target="_blank" rel="noopener noreferrer" style={{ fontSize: '12px', color: 'var(--accent-color)', textDecoration: 'none' }}>View Data ↗</a>
              </div>
              <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#10b981' }}>43%</div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>Best Prime Minister Index</div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap' }}>
        {/* Recent News */}
        <div style={{ flex: '1.5', minWidth: '400px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h2 style={{ fontSize: '20px', margin: 0, color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
            📰 Recent Statements & Announcements
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            
            <a href="https://www.conservative.ca/news" target="_blank" rel="noopener noreferrer" style={{ display: 'block', textDecoration: 'none', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '16px', borderRadius: '8px', transition: 'all 0.2s' }}>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', marginBottom: '4px' }}>June 1, 2026 • Press Release</div>
              <div style={{ fontSize: '15px', color: 'white', fontWeight: 'bold', marginBottom: '8px' }}>Official Opposition calls for immediate inquiry into infrastructure spending</div>
              <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', lineHeight: '1.4' }}>Pierre Poilievre addressed the media outside the House of Commons, demanding an audit of recent federal infrastructure projects.</div>
            </a>

            <a href="https://www.conservative.ca/news" target="_blank" rel="noopener noreferrer" style={{ display: 'block', textDecoration: 'none', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '16px', borderRadius: '8px', transition: 'all 0.2s' }}>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', marginBottom: '4px' }}>May 28, 2026 • Policy Announcement</div>
              <div style={{ fontSize: '15px', color: 'white', fontWeight: 'bold', marginBottom: '8px' }}>Conservative Housing Plan: "Building Homes, Not Bureaucracy"</div>
              <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', lineHeight: '1.4' }}>The Leader of the Official Opposition outlined a comprehensive strategy to tie federal infrastructure funding to municipal housing completions.</div>
            </a>

            <a href="https://www.conservative.ca/news" target="_blank" rel="noopener noreferrer" style={{ display: 'block', textDecoration: 'none', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '16px', borderRadius: '8px', transition: 'all 0.2s' }}>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', marginBottom: '4px' }}>May 25, 2026 • Question Period</div>
              <div style={{ fontSize: '15px', color: 'white', fontWeight: 'bold', marginBottom: '8px' }}>Poilievre presses the Prime Minister on cost of living</div>
              <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', lineHeight: '1.4' }}>During Question Period, the Leader of the Official Opposition highlighted rising grocery prices and called for tax relief.</div>
            </a>

          </div>
        </div>

        {/* The Shadow Cabinet Link */}
        <div style={{ flex: '1', minWidth: '300px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h2 style={{ fontSize: '20px', margin: 0, color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
            👥 The Shadow Cabinet
          </h2>
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '24px', borderRadius: '12px' }}>
            <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.8)', lineHeight: '1.6', margin: '0 0 16px 0' }}>
              The Shadow Cabinet is formed by the Official Opposition. Members act as critics for the official Cabinet portfolios, holding government ministers accountable for their departments.
            </p>
            <NavLink to="/parties" style={{ display: 'inline-block', padding: '10px 20px', background: 'var(--party-conservative)', color: 'white', textDecoration: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '14px' }}>
              View Shadow Cabinet Roster &rarr;
            </NavLink>
            <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
              <h4 style={{ margin: '0 0 8px 0', color: 'white', fontSize: '14px' }}>Key Critic Portfolios:</h4>
              <ul style={{ margin: 0, paddingLeft: '20px', color: 'rgba(255,255,255,0.7)', fontSize: '13px', lineHeight: '1.8' }}>
                <li>Shadow Minister for Finance</li>
                <li>Shadow Minister for Foreign Affairs</li>
                <li>Shadow Minister for National Defence</li>
                <li>Shadow Minister for Health</li>
                <li>Shadow Minister for Environment and Climate Change</li>
              </ul>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
