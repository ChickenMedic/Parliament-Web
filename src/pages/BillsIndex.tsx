import React from 'react';
import billsData from '../data/bills.json';

export const BillsIndex: React.FC = () => {
  return (
    <div className="page-container glass-panel" style={{ overflowY: 'auto', padding: '24px' }}>
      <h1 style={{ color: 'white', marginBottom: '24px' }}>Bills Text Availability Index (Debug)</h1>
      <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '32px' }}>
        This page provides a quick cross-reference of all parsed bills and their local XML text availability.
      </p>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
        {billsData.map((bill: any) => (
          <div key={bill.id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', padding: '16px', borderRadius: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontWeight: 'bold', color: 'white', fontSize: '18px' }}>{bill.id}</span>
              <span style={{ fontSize: '12px', background: 'var(--party-liberal)', padding: '2px 8px', borderRadius: '4px', color: 'white' }}>
                {bill.status}
              </span>
            </div>
            <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.8)', marginBottom: '16px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {bill.title}
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <a 
                href={`/src/data/bills_text/${bill.id}.xml`} 
                target="_blank" 
                rel="noreferrer"
                style={{ fontSize: '12px', padding: '6px 12px', background: 'rgba(255,255,255,0.1)', color: 'white', textDecoration: 'none', borderRadius: '4px', flex: 1, textAlign: 'center' }}
              >
                View Local XML
              </a>
              <a 
                href={bill.link} 
                target="_blank" 
                rel="noreferrer"
                style={{ fontSize: '12px', padding: '6px 12px', background: 'rgba(255,255,255,0.1)', color: 'var(--accent-color)', textDecoration: 'none', borderRadius: '4px', flex: 1, textAlign: 'center' }}
              >
                LegisInfo ↗
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
