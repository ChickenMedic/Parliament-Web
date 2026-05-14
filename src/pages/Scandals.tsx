import './PageStyles.css';

export const Scandals = () => {
  return (
    <div className="page-container glass-panel">
      <div className="page-header">
        <h1>Ongoing Trackers & Scandals</h1>
        <p>A timeline of major ongoing political events, inquiries, and ethics investigations.</p>
      </div>
      <div className="placeholder-content">
        <div className="scandal-card">
          <h3>Foreign Interference Inquiry</h3>
          <p>Status: Ongoing hearings</p>
        </div>
      </div>
    </div>
  );
};
