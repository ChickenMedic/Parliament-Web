import './PageStyles.css';

export const Committees = () => {
  return (
    <div className="page-container glass-panel">
      <div className="page-header">
        <h1>Parliamentary Committees</h1>
        <p>Explore committee makeups and current studies.</p>
      </div>
      <div className="placeholder-content">
        <p>Loading committees data...</p>
      </div>
    </div>
  );
};
