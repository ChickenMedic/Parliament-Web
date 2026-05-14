import { useState } from 'react';
import { Sidebar } from '../components/Sidebar';
import { MapComponent } from '../components/MapComponent';

export const Dashboard = () => {
  const [selectedMP, setSelectedMP] = useState<any>(null);
  return (
    <div className="dashboard-container">
      <Sidebar selectedMP={selectedMP} setSelectedMP={setSelectedMP} />
      <MapComponent selectedMP={selectedMP} setSelectedMP={setSelectedMP} />
    </div>
  );
};
