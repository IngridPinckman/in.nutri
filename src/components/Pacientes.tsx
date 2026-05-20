import { useState, useEffect } from 'react';
import PatientList from './pacientes/PatientList';
import PatientForm from './pacientes/PatientForm';
import PatientProfile from './pacientes/PatientProfile';
import './pacientes/Pacientes.css';

interface PacientesProps {
  userId: string;
  initialSelectedPatientId?: string | null;
  onClearSelection?: () => void;
}

type ViewState = 'list' | 'form' | 'profile';

export default function Pacientes({ userId, initialSelectedPatientId, onClearSelection }: PacientesProps) {
  const [view, setView] = useState<ViewState>('list');
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [editPatientId, setEditPatientId] = useState<string | null>(null);

  useEffect(() => {
    if (initialSelectedPatientId) {
      setSelectedPatientId(initialSelectedPatientId);
      setView('profile');
    }
  }, [initialSelectedPatientId]);

  const handleNavigateToForm = () => {
    setEditPatientId(null);
    setView('form');
  };

  const handleNavigateToProfile = (id: string) => {
    setSelectedPatientId(id);
    setView('profile');
  };

  const handleBackToList = () => {
    setSelectedPatientId(null);
    setEditPatientId(null);
    setView('list');
    if (onClearSelection) {
      onClearSelection();
    }
  };

  const handleFormSuccess = (newId: string) => {
    setEditPatientId(null);
    handleNavigateToProfile(newId);
  };

  const handleEditPatient = () => {
    setEditPatientId(selectedPatientId);
    setView('form');
  };

  return (
    <div style={{ animation: 'modalEnter 0.3s ease-out' }}>
      {view === 'list' && (
        <PatientList 
          userId={userId} 
          onNavigateToForm={handleNavigateToForm} 
          onNavigateToProfile={handleNavigateToProfile} 
        />
      )}

      {view === 'form' && (
        <PatientForm 
          userId={userId} 
          editPatientId={editPatientId}
          onCancel={handleBackToList}
          onSuccess={handleFormSuccess}
        />
      )}

      {view === 'profile' && selectedPatientId && (
        <PatientProfile 
          patientId={selectedPatientId} 
          onBack={handleBackToList}
          onEdit={handleEditPatient}
        />
      )}
    </div>
  );
}
