import './PageStyles.css';


export const PrimeMinister = () => {
  return (
    <div className="page-container glass-panel" style={{ display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
      
      <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap', marginBottom: '32px' }}>
        {/* Header Profile Section */}
        <div style={{ flex: '1', minWidth: '300px', display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '32px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', textAlign: 'center' }}>
          <img 
            src="/Mark_Carney.jpg" 
            alt="Prime Minister Mark Carney" 
            style={{ width: '160px', height: '160px', borderRadius: '50%', objectFit: 'cover', border: '4px solid #d71920', marginBottom: '16px', boxShadow: '0 8px 24px rgba(215, 25, 32, 0.4)' }} 
            onError={(e) => (e.target as any).src = "https://ui-avatars.com/api/?name=Mark+Carney"}
          />
          <h1 style={{ margin: '0 0 8px 0', fontSize: '28px', color: 'white' }}>The Right Honourable Mark Carney</h1>
          <div style={{ fontSize: '15px', color: 'var(--party-liberal)', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>
            Prime Minister of Canada
          </div>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px', lineHeight: '1.6', margin: 0 }}>
            Serving as the head of government, the Prime Minister provides leadership and direction to the government with the support of a cabinet, which the Prime Minister chooses.
          </p>
        </div>

        {/* Approval Ratings */}
        <div style={{ flex: '1.5', minWidth: '400px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h2 style={{ fontSize: '20px', margin: 0, color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
            📊 Approval Ratings
          </h2>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            {/* Nanos */}
            <div style={{ flex: 1, background: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 'bold', color: 'white' }}>Nanos Research</span>
                <a href="https://nanos.co/" target="_blank" rel="noopener noreferrer" style={{ fontSize: '12px', color: 'var(--accent-color)', textDecoration: 'none' }}>View Data ↗</a>
              </div>
              <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#10b981' }}>41%</div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>Preferred Prime Minister tracking (Week ending May 29)</div>
            </div>
            
            {/* Abacus */}
            <div style={{ flex: 1, background: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 'bold', color: 'white' }}>Abacus Data</span>
                <a href="https://abacusdata.ca/" target="_blank" rel="noopener noreferrer" style={{ fontSize: '12px', color: 'var(--accent-color)', textDecoration: 'none' }}>View Data ↗</a>
              </div>
              <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#f59e0b' }}>38%</div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>General Approval Rating (Mid-May Tracker)</div>
            </div>
            
            {/* Leger */}
            <div style={{ flex: 1, background: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 'bold', color: 'white' }}>Leger</span>
                <a href="https://leger360.com/" target="_blank" rel="noopener noreferrer" style={{ fontSize: '12px', color: 'var(--accent-color)', textDecoration: 'none' }}>View Data ↗</a>
              </div>
              <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#f59e0b' }}>39%</div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>Government Satisfaction Index</div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap' }}>
        {/* Recent News */}
        <div style={{ flex: '1.5', minWidth: '400px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h2 style={{ fontSize: '20px', margin: 0, color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
            📰 Recent News & Announcements
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            
            <a href="https://www.pm.gc.ca/en/news" target="_blank" rel="noopener noreferrer" style={{ display: 'block', textDecoration: 'none', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '16px', borderRadius: '8px', transition: 'all 0.2s' }}>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', marginBottom: '4px' }}>June 1, 2026 • Official Statement</div>
              <div style={{ fontSize: '15px', color: 'white', fontWeight: 'bold', marginBottom: '8px' }}>Prime Minister Carney outlines new economic growth targets for Q3 and Q4</div>
              <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', lineHeight: '1.4' }}>The Prime Minister addressed the Chamber of Commerce today, detailing a multi-billion dollar investment strategy for clean tech and housing.</div>
            </a>

            <a href="https://www.pm.gc.ca/en/news" target="_blank" rel="noopener noreferrer" style={{ display: 'block', textDecoration: 'none', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '16px', borderRadius: '8px', transition: 'all 0.2s' }}>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', marginBottom: '4px' }}>May 28, 2026 • Press Release</div>
              <div style={{ fontSize: '15px', color: 'white', fontWeight: 'bold', marginBottom: '8px' }}>Canada secures historic trade partnership with European Union allies</div>
              <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', lineHeight: '1.4' }}>Following the G7 summit, the Prime Minister announced enhanced trade lines for agricultural exports and critical minerals.</div>
            </a>

            <a href="https://www.pm.gc.ca/en/news" target="_blank" rel="noopener noreferrer" style={{ display: 'block', textDecoration: 'none', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '16px', borderRadius: '8px', transition: 'all 0.2s' }}>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', marginBottom: '4px' }}>May 25, 2026 • International Relations</div>
              <div style={{ fontSize: '15px', color: 'white', fontWeight: 'bold', marginBottom: '8px' }}>Bilateral meetings in Washington conclude with defense agreements</div>
              <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', lineHeight: '1.4' }}>Commitments to NORAD modernization were at the forefront of discussions between the Prime Minister and the US President.</div>
            </a>

          </div>
        </div>

        {/* The Cabinet Link */}
        <div style={{ flex: '1', minWidth: '300px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h2 style={{ fontSize: '20px', margin: 0, color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
            🏛 The Cabinet
          </h2>
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '24px', borderRadius: '12px' }}>
            <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.8)', lineHeight: '1.6', margin: '0 0 16px 0' }}>
              The Cabinet is the committee of ministers that holds executive power. Chaired by the Prime Minister, they are responsible for the administration of the government and the establishment of policy.
            </p>
            <a href="/parties" style={{ display: 'inline-block', padding: '10px 20px', background: 'var(--party-liberal)', color: 'white', textDecoration: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '14px' }}>
              View Current Cabinet Roster &rarr;
            </a>
            <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
              <h4 style={{ margin: '0 0 8px 0', color: 'white', fontSize: '14px' }}>Key Ministries:</h4>
              <ul style={{ margin: 0, paddingLeft: '20px', color: 'rgba(255,255,255,0.7)', fontSize: '13px', lineHeight: '1.8' }}>
                <li>Finance and Deputy Prime Minister</li>
                <li>Foreign Affairs</li>
                <li>National Defence</li>
                <li>Health</li>
                <li>Environment and Climate Change</li>
              </ul>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
