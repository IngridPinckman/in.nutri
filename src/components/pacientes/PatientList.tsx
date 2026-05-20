import { useState, useEffect } from 'react';
import { Search, Plus, User, ChevronRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface PatientListProps {
  userId: string;
  onNavigateToForm: () => void;
  onNavigateToProfile: (id: string) => void;
}

interface PatientData {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  dados_clinicos: any;
  created_at: string;
}

export default function PatientList({ userId, onNavigateToForm, onNavigateToProfile }: PatientListProps) {
  const [patients, setPatients] = useState<PatientData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [consultationDates, setConsultationDates] = useState<Record<string, string>>({});

  useEffect(() => {
    loadPatientsAndConsultations();
  }, [userId]);

  const loadPatientsAndConsultations = async () => {
    setLoading(true);
    try {
      // 1. Fetch Patients
      const { data: patientsData, error: patientsError } = await supabase
        .from('pacientes')
        .select('*')
        .eq('nutricionista_id', userId)
        .order('nome', { ascending: true });

      if (patientsError) throw patientsError;
      
      const activePatients = patientsData || [];
      setPatients(activePatients);

      // 2. Fetch Latest Consultations for these patients to get "data da última consulta"
      if (activePatients.length > 0) {
        const patientIds = activePatients.map(p => p.id);
        const { data: consultsData, error: consultsError } = await supabase
          .from('consultas')
          .select('paciente_id, data_hora')
          .in('paciente_id', patientIds)
          // Na ausência da coluna data_hora por enquanto, ignoramos o erro
          .order('data_hora', { ascending: false });

        if (!consultsError && consultsData) {
          const latestDates: Record<string, string> = {};
          consultsData.forEach(c => {
            if (!latestDates[c.paciente_id]) {
              latestDates[c.paciente_id] = new Date(c.data_hora).toLocaleDateString('pt-BR');
            }
          });
          setConsultationDates(latestDates);
        }
      }
    } catch (err) {
      console.error('Erro ao buscar listagem de pacientes:', err);
    } finally {
      setLoading(false);
    }
  };

  const getObjetivo = (dados_clinicos: any) => {
    if (!dados_clinicos || !dados_clinicos.objetivo) return '-';
    if (Array.isArray(dados_clinicos.objetivo)) {
      return dados_clinicos.objetivo.join(', ');
    }
    return dados_clinicos.objetivo;
  };

  const filteredPatients = patients.filter(p => 
    p.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="animate-spin"><Search size={32} color="var(--primary)" /></div>
        <p>Carregando pacientes...</p>
      </div>
    );
  }

  return (
    <div className="patients-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div className="search-container">
          <Search className="search-icon" size={18} />
          <input 
            type="text" 
            className="search-input" 
            placeholder="Buscar paciente por nome..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="btn-primary" onClick={onNavigateToForm}>
          <Plus size={18} /> Novo Paciente
        </button>
      </div>

      {patients.length === 0 ? (
        <div className="card empty-state" style={{ padding: '4rem', textAlign: 'center' }}>
          <User size={56} style={{ color: 'var(--text-muted)', marginBottom: '1rem', opacity: 0.5 }} />
          <h3 style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '1.25rem' }}>Nenhum paciente cadastrado</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginTop: '0.5rem' }}>
            Clique no botão "Novo Paciente" para registrar seu primeiro atendimento.
          </p>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {filteredPatients.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              Nenhum paciente encontrado para "{searchTerm}"
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>Objetivo</th>
                    <th>Última Consulta</th>
                    <th style={{ width: '50px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPatients.map((patient) => (
                    <tr 
                      key={patient.id} 
                      onClick={() => onNavigateToProfile(patient.id)}
                      style={{ cursor: 'pointer' }}
                      className="hover-row"
                    >
                      <td style={{ fontWeight: 600, color: 'var(--text-main)' }}>{patient.nome}</td>
                      <td>
                        <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                          {getObjetivo(patient.dados_clinicos)}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>
                          {consultationDates[patient.id] || 'Nunca consultou'}
                        </span>
                      </td>
                      <td>
                        <ChevronRight size={18} color="var(--primary)" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
