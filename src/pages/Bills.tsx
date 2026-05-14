import './PageStyles.css';
import { useState } from 'react';

const MOCK_BILLS = [
  { id: 'C-11', title: 'Online Streaming Act', desc: 'A bill to amend the Broadcasting Act to bring online streaming services under the regulatory authority of the CRTC.', lib: 'Strongly Support: Levels playing field, protects culture.', con: 'Strongly Oppose: Concerns over censorship and regulation.', ndp: 'Support with Amendments: Demanded protection for small creators.' },
  { id: 'C-21', title: 'Firearms Act', desc: 'Legislation introducing a national freeze on handguns, increasing maximum penalties, and "red flag" laws.', lib: 'Strongly Support: Action against urban gun violence.', con: 'Strongly Oppose: Penalizes lawful owners instead of gangs.', ndp: 'Support with Caution: Required Indigenous hunting protections.' },
  { id: 'C-69', title: 'Budget Implementation Act', desc: 'Enacts measures announced in the 2024 Budget, including changes to capital gains tax and housing initiatives.', lib: 'Support: Ensures fairness and funds critical housing programs.', con: 'Oppose: Job-killing tax hikes that hurt small businesses.', ndp: 'Support: Agrees with making the wealthy pay their fair share.' }
];

export const Bills = () => {
  const [aiEngine, setAiEngine] = useState('Gemini Advanced');
  const [selectedBill, setSelectedBill] = useState<any>(null);

  if (selectedBill) {
    return (
      <div className="page-container glass-panel">
        <button onClick={() => setSelectedBill(null)} style={{ background: 'transparent', color: 'var(--accent-color)', border: 'none', cursor: 'pointer', marginBottom: '24px', textAlign: 'left', fontWeight: 'bold' }}>
          &larr; Back to all Bills
        </button>
        <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1>{selectedBill.id}: {selectedBill.title}</h1>
            <p style={{ color: 'var(--text-secondary)' }}>Status: Second Reading in the House of Commons</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>AI Distiller:</span>
            <select 
              value={aiEngine} 
              onChange={(e) => setAiEngine(e.target.value)}
              className="custom-select"
              style={{ padding: '8px 12px', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', borderRadius: '8px', cursor: 'pointer', outline: 'none', appearance: 'none' }}
            >
              <option>Gemini Advanced</option>
              <option>ChatGPT 4o</option>
              <option>Claude 3.5 Sonnet</option>
            </select>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '32px', marginTop: '24px' }}>
          <div style={{ flex: 2, background: 'rgba(255,255,255,0.03)', padding: '24px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <h3 style={{ marginBottom: '16px', color: 'var(--accent-color)' }}>AI Summary ({aiEngine})</h3>
            <p style={{ lineHeight: '1.7', color: 'rgba(255,255,255,0.9)', fontSize: '15px' }}>
              Based on the analysis by {aiEngine}, {selectedBill.id} proposes significant legislative changes. {selectedBill.desc} The bill aims to modernize existing frameworks, but has drawn varying reactions. Supporters argue it is a necessary update for the digital age, closing regulatory loopholes. Critics, however, suggest it may overreach and stifle innovation or lawful ownership. 
              <br/><br/>
              <strong>Key Provisions:</strong>
              <ul style={{ paddingLeft: '20px', marginTop: '12px' }}>
                <li style={{ marginBottom: '8px' }}>Establishes new regulatory oversight parameters.</li>
                <li style={{ marginBottom: '8px' }}>Introduces compliance mechanisms and potential penalties.</li>
                <li style={{ marginBottom: '8px' }}>Mandates reporting structures for relevant entities.</li>
              </ul>
            </p>
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ marginBottom: '8px' }}>Party Positions</h3>
            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '16px', borderRadius: '8px', borderLeft: '4px solid var(--party-liberal)' }}>
              <strong style={{ color: 'var(--party-liberal)', display: 'block', marginBottom: '4px' }}>Liberal</strong>
              <span style={{ fontSize: '14px' }}>{selectedBill.lib}</span>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '16px', borderRadius: '8px', borderLeft: '4px solid var(--party-conservative)' }}>
              <strong style={{ color: 'var(--party-conservative)', display: 'block', marginBottom: '4px' }}>Conservative</strong>
              <span style={{ fontSize: '14px' }}>{selectedBill.con}</span>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '16px', borderRadius: '8px', borderLeft: '4px solid var(--party-ndp)' }}>
              <strong style={{ color: 'var(--party-ndp)', display: 'block', marginBottom: '4px' }}>NDP</strong>
              <span style={{ fontSize: '14px' }}>{selectedBill.ndp}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container glass-panel">
      <div className="page-header">
        <h1>Legislative Bills</h1>
        <p>Track bills currently moving through Parliament, read high-level summaries, and see party opinions.</p>
      </div>
      
      <div className="placeholder-content">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
          {MOCK_BILLS.map(bill => (
            <div key={bill.id} className="bill-card" style={{ display: 'flex', flexDirection: 'column', padding: '24px' }}>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: '20px', marginBottom: '8px' }}>{bill.id}: {bill.title}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.5', marginBottom: '20px' }}>
                  {bill.desc}
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ background: 'rgba(255,255,255,0.05)', padding: '12px', borderRadius: '8px' }}>
                    <strong style={{ color: 'var(--party-liberal)', display: 'block', marginBottom: '4px' }}>Liberal</strong>
                    <span style={{ fontSize: '13px' }}>{bill.lib}</span>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.05)', padding: '12px', borderRadius: '8px' }}>
                    <strong style={{ color: 'var(--party-conservative)', display: 'block', marginBottom: '4px' }}>Conservative</strong>
                    <span style={{ fontSize: '13px' }}>{bill.con}</span>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.05)', padding: '12px', borderRadius: '8px' }}>
                    <strong style={{ color: 'var(--party-ndp)', display: 'block', marginBottom: '4px' }}>NDP</strong>
                    <span style={{ fontSize: '13px' }}>{bill.ndp}</span>
                  </div>
                </div>
              </div>
              <button className="vote-btn" onClick={() => setSelectedBill(bill)} style={{ width: '100%', marginTop: '24px', padding: '10px' }}>Learn More</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
