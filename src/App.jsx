import React, { useState } from 'react';
import Navbar from './components/Navbar';
import FamilyDashboard from './components/FamilyDashboard';
import ParentHomeView from './components/ParentHomeView';
import { INITIAL_FAMILY_MEMBERS, INITIAL_PRESCRIPTIONS } from './services/mockData';
import { LayoutGrid, Smartphone, Eye } from 'lucide-react';

export default function App() {
  const [activeView, setActiveView] = useState('split'); // 'split' | 'dashboard' | 'parent'
  const [members] = useState(INITIAL_FAMILY_MEMBERS);
  const [selectedMember, setSelectedMember] = useState(INITIAL_FAMILY_MEMBERS[0]);
  const [prescriptions, setPrescriptions] = useState(INITIAL_PRESCRIPTIONS);

  const handleAddPrescription = (newDoc) => {
    setPrescriptions([newDoc, ...prescriptions]);
  };

  const handleResetDemo = () => {
    setPrescriptions(INITIAL_PRESCRIPTIONS);
    setSelectedMember(INITIAL_FAMILY_MEMBERS[0]);
  };

  return (
    <div className="app-container">
      <Navbar activeRole={activeView} onToggleRole={setActiveView} onResetDemo={handleResetDemo} />

      {/* Role View Toggle Bar */}
      <div className="role-bar">
        <div className="role-toggle">
          <button
            className={`role-btn ${activeView === 'split' ? 'active' : ''}`}
            onClick={() => setActiveView('split')}
          >
            <Eye size={16} /> Xem 2 Màn hình (Split View)
          </button>

          <button
            className={`role-btn ${activeView === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveView('dashboard')}
          >
            <LayoutGrid size={16} /> Web Con gái (P1)
          </button>

          <button
            className={`role-btn ${activeView === 'parent' ? 'active' : ''}`}
            onClick={() => setActiveView('parent')}
          >
            <Smartphone size={16} /> App Ba Mười (P2)
          </button>
        </div>
      </div>

      {/* Main View Area */}
      {activeView === 'split' && (
        <div style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: 32 }}>
          <ParentHomeView selectedMember={selectedMember} prescriptions={prescriptions} />
          <FamilyDashboard
            members={members}
            selectedMember={selectedMember}
            onSelectMember={setSelectedMember}
            prescriptions={prescriptions}
            onAddPrescription={handleAddPrescription}
          />
        </div>
      )}

      {activeView === 'dashboard' && (
        <FamilyDashboard
          members={members}
          selectedMember={selectedMember}
          onSelectMember={setSelectedMember}
          prescriptions={prescriptions}
          onAddPrescription={handleAddPrescription}
        />
      )}

      {activeView === 'parent' && (
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <ParentHomeView selectedMember={selectedMember} prescriptions={prescriptions} />
        </div>
      )}

    </div>
  );
}
