import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Users, Calendar, AlertTriangle, Loader2, ChevronRight } from 'lucide-react';

interface DashboardProps {
  userId: string;
  onNavigateToPatient: (patientId: string) => void;
}

interface Patient {
  id: string;
  nome: string;
}

interface Consultation {
  id: string;
  paciente_id: string;
  data_hora: string;
  status: string;
}

export default function Dashboard({ userId, onNavigateToPatient }: DashboardProps) {
  const [loading, setLoading] = useState(true);
  const [totalPatients, setTotalPatients] = useState(0);
  const [weeklyAppointments, setWeeklyAppointments] = useState(0);
  const [noReturnPatients, setNoReturnPatients] = useState<Patient[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (userId) {
      loadDashboardData();
    }
  }, [userId]);

  const loadDashboardData = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      // 1. Calcular datas da semana atual (Segunda a Domingo)
      const today = new Date();
      const dayOfWeek = today.getDay(); // 0 = Domingo, 1 = Segunda...
      const monday = new Date(today);
      const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
      monday.setDate(diff);
      monday.setHours(0, 0, 0, 0);

      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      sunday.setHours(23, 59, 59, 999);

      // 2. Buscar Pacientes da Nutricionista
      const { data: patients, error: patientsError } = await supabase
        .from('pacientes')
        .select('id, nome')
        .eq('nutricionista_id', userId);

      if (patientsError) throw patientsError;

      const activePatients = patients || [];
      setTotalPatients(activePatients.length);

      if (activePatients.length === 0) {
        setWeeklyAppointments(0);
        setNoReturnPatients([]);
        setLoading(false);
        return;
      }

      const patientIds = activePatients.map((p) => p.id);

      // 3. Buscar Consultas da Semana Atual
      // Usaremos RLS ou join seguro para consultas. 
      // Primeiro tentamos direto em consultas onde paciente_id pertence ao nutricionista
      let weeklyCount = 0;
      const { data: weeklyData, error: weeklyError } = await supabase
        .from('consultas')
        .select('id, data_hora')
        .in('paciente_id', patientIds)
        .gte('data_hora', monday.toISOString())
        .lte('data_hora', sunday.toISOString());

      if (weeklyError) {
        console.warn('Erro ao buscar consultas semanais direto:', weeklyError);
      } else {
        weeklyCount = weeklyData?.length || 0;
      }
      setWeeklyAppointments(weeklyCount);

      // 4. Buscar TODAS as consultas dos pacientes desta nutricionista para calcular sem retorno
      const { data: allConsultations, error: consultError } = await supabase
        .from('consultas')
        .select('id, paciente_id, data_hora, status')
        .in('paciente_id', patientIds);

      if (consultError) throw consultError;

      const consultations: Consultation[] = allConsultations || [];
      const now = new Date();
      const limitDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 dias atrás

      const eligiblePatients: Patient[] = [];

      for (const patient of activePatients) {
        const patientConsults = consultations.filter((c) => c.paciente_id === patient.id);

        // Separar em passadas e futuras
        const pastConsults = patientConsults.filter((c) => {
          const date = new Date(c.data_hora);
          return date < now && c.status !== 'Cancelada';
        });

        const futureConsults = patientConsults.filter((c) => {
          const date = new Date(c.data_hora);
          return date >= now && c.status !== 'Cancelada' && c.status !== 'Cancelado';
        });

        // Se tem consulta futura agendada, NÃO é paciente sem retorno
        if (futureConsults.length > 0) {
          continue;
        }

        // Se não tem consulta futura e tem alguma consulta no passado, verificar se a última foi há mais de 30 dias
        if (pastConsults.length > 0) {
          // Ordenar passadas para encontrar a mais recente
          pastConsults.sort((a, b) => new Date(b.data_hora).getTime() - new Date(a.data_hora).getTime());
          const lastConsultDate = new Date(pastConsults[0].data_hora);

          if (lastConsultDate < limitDate) {
            eligiblePatients.push(patient);
          }
        }
      }

      setNoReturnPatients(eligiblePatients);
    } catch (err: any) {
      console.error('Erro geral ao carregar dados do dashboard:', err);
      setErrorMsg(err.message || 'Ocorreu um erro ao carregar os dados.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <Loader2 className="animate-spin" size={40} color="var(--primary)" />
        <p>Carregando dados do painel...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {errorMsg && <div className="error-message">{errorMsg}</div>}

      <div className="stats-grid">
        {/* Card 1 — Total de pacientes ativos */}
        <div className="stat-card premium-card">
          <div className="icon-box straw-bg">
            <Users size={24} />
          </div>
          <div className="stat-content">
            <p className="stat-label">Total de Pacientes Ativos</p>
            <h2 className="stat-value">{totalPatients}</h2>
          </div>
        </div>

        {/* Card 2 — Consultas da semana */}
        <div className="stat-card premium-card">
          <div className="icon-box gold-bg">
            <Calendar size={24} />
          </div>
          <div className="stat-content">
            <p className="stat-label">Consultas da Semana</p>
            <h2 className="stat-value">{weeklyAppointments}</h2>
          </div>
        </div>
      </div>

      {/* Card 3 — Pacientes sem retorno */}
      <div className="card list-card premium-card" style={{ marginTop: '1.5rem' }}>
        <div className="card-header-icon">
          <div className="icon-box warning-bg">
            <AlertTriangle size={24} />
          </div>
          <div>
            <h3 className="card-title">Pacientes Sem Retorno</h3>
            <p className="card-subtitle">
              Última consulta há mais de 30 dias e sem retorno agendado
            </p>
          </div>
        </div>

        <div className="card-body">
          {noReturnPatients.length === 0 ? (
            <div className="empty-state">
              <p>Nenhum paciente sem retorno no momento</p>
            </div>
          ) : (
            <ul className="patient-list">
              {noReturnPatients.map((patient) => (
                <li 
                  key={patient.id} 
                  className="patient-list-item"
                  onClick={() => onNavigateToPatient(patient.id)}
                >
                  <span className="patient-name">{patient.nome}</span>
                  <div className="action-hint">
                    <span>Ver perfil</span>
                    <ChevronRight size={16} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
