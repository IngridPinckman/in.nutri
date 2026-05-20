import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { User, Phone, Mail, Calendar, Loader2, ArrowLeft, Check, Droplets, Target, Activity, AlertTriangle, Edit2 } from 'lucide-react';

interface PatientProfileProps {
  patientId: string;
  onBack: () => void;
  onEdit: () => void;
}

export default function PatientProfile({ patientId, onBack, onEdit }: PatientProfileProps) {
  const [patient, setPatient] = useState<any>(null);
  const [consultations, setConsultations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [patientId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const { data: pData, error: pError } = await supabase
        .from('pacientes')
        .select('*')
        .eq('id', patientId)
        .single();
      
      if (pError) throw pError;
      setPatient(pData);

      const { data: cData, error: cError } = await supabase
        .from('consultas')
        .select('*')
        .eq('paciente_id', patientId)
        .order('data_hora', { ascending: false });
        
      if (!cError) {
        setConsultations(cData || []);
      }
    } catch (err) {
      console.error('Erro ao carregar perfil:', err);
    } finally {
      setLoading(false);
    }
  };

  const getImcStatus = (imcValue: number) => {
    if (!imcValue) return null;
    if (imcValue < 18.5) return { text: 'Abaixo do peso', color: '#D69E2E' };
    if (imcValue >= 18.5 && imcValue <= 24.9) return { text: 'Peso ideal', color: '#38A169' };
    if (imcValue >= 25 && imcValue <= 29.9) return { text: 'Acima do peso', color: '#DD6B20' };
    return { text: 'Obesidade', color: '#E53E3E' };
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <Loader2 className="animate-spin" size={40} color="var(--primary)" />
        <p>Carregando perfil do paciente...</p>
      </div>
    );
  }

  if (!patient) {
    return (
      <div>
        <button className="btn-back" onClick={onBack}><ArrowLeft size={16} /> Voltar</button>
        <div className="error-message">Paciente não encontrado.</div>
      </div>
    );
  }

  const dc = patient.dados_clinicos || {};
  const habitos = dc.habitos || {};
  const imcStatus = getImcStatus(dc.imc);

  return (
    <div className="profile-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button className="btn-back" style={{ marginBottom: 0 }} onClick={onBack}>
          <ArrowLeft size={16} /> Voltar para lista
        </button>
        
        <button className="btn-primary" onClick={onEdit} style={{ padding: '0.6rem 1rem', fontSize: '0.9rem' }}>
          <Edit2 size={16} /> Editar Paciente
        </button>
      </div>

      <div className="profile-layout" style={{ marginTop: '0.5rem' }}>
        
        {/* Lado Esquerdo - Info Pessoal e Resumo */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div className="profile-card card">
            <div className="profile-header">
              <div className="profile-avatar">
                <User size={32} />
              </div>
              <div>
                <h2>{patient.nome}</h2>
                <p className="patient-status">Paciente Ativo</p>
              </div>
            </div>

            <div className="profile-info-list" style={{ marginTop: '1.5rem' }}>
              <div className="info-item">
                <Mail size={16} className="info-icon" />
                <div>
                  <span className="info-label">E-mail</span>
                  <span className="info-value">{patient.email || 'Não informado'}</span>
                </div>
              </div>

              <div className="info-item">
                <Phone size={16} className="info-icon" />
                <div>
                  <span className="info-label">WhatsApp</span>
                  <span className="info-value">{patient.whatsapp || patient.telefone || 'Não informado'}</span>
                </div>
              </div>

              <div className="info-item">
                <Calendar size={16} className="info-icon" />
                <div>
                  <span className="info-label">Nascimento</span>
                  <span className="info-value">
                    {patient.data_nascimento
                      ? new Date(patient.data_nascimento).toLocaleDateString('pt-BR')
                      : 'Não informado'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Dados Biométricos */}
          <div className="card">
            <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>Biometria e Metas</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div style={{ padding: '0.75rem', background: '#FAF9F8', borderRadius: '12px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>PESO</span>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>{dc.peso ? `${dc.peso} kg` : '-'}</div>
              </div>
              <div style={{ padding: '0.75rem', background: '#FAF9F8', borderRadius: '12px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>ALTURA</span>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>{dc.altura ? `${dc.altura} cm` : '-'}</div>
              </div>
              <div style={{ padding: '0.75rem', background: '#FAF9F8', borderRadius: '12px', display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>IMC</span>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--primary)' }}>{dc.imc || '-'}</div>
                {imcStatus && (
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, color: imcStatus.color, marginTop: '2px' }}>
                    {imcStatus.text}
                  </span>
                )}
              </div>
              <div style={{ padding: '0.75rem', background: '#FAF9F8', borderRadius: '12px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>ATIVIDADE</span>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)' }}>{dc.nivel_atividade || '-'}</div>
              </div>
            </div>

            {dc.objetivos && dc.objetivos.length > 0 && (
              <div style={{ marginTop: '1rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <Target size={14} /> OBJETIVOS
                </span>
                <div className="chips-container" style={{ marginTop: '0.5rem' }}>
                  {dc.objetivos.map((o: string, i: number) => <div key={i} className="chip selected" style={{ fontSize: '0.75rem' }}>{o}</div>)}
                </div>
              </div>
            )}
          </div>
          
        </div>


        {/* Lado Direito - Detalhes Clínicos e Hábitos */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div className="card">
            <h3 style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>Quadro Clínico</h3>
            
            <div className="form-grid">
              <div>
                <span className="info-label"><AlertTriangle size={14} style={{ display: 'inline', marginRight: '4px' }} /> Patologias</span>
                <p style={{ fontSize: '0.9rem', marginTop: '0.25rem' }}>{dc.patologias?.join(', ') || 'Nenhuma informada'}</p>
              </div>
              <div>
                <span className="info-label">Restrições</span>
                <p style={{ fontSize: '0.9rem', marginTop: '0.25rem' }}>{dc.restricoes?.join(', ') || 'Nenhuma informada'}</p>
              </div>
              <div>
                <span className="info-label">Alergias</span>
                <p style={{ fontSize: '0.9rem', marginTop: '0.25rem', color: dc.alergias?.length ? '#C53030' : 'inherit' }}>{dc.alergias?.join(', ') || 'Nenhuma informada'}</p>
              </div>
              <div>
                <span className="info-label">Medicamentos</span>
                <p style={{ fontSize: '0.9rem', marginTop: '0.25rem' }}>{dc.medicamentos || 'Nenhum'}</p>
              </div>
              <div className="form-full-width">
                <span className="info-label">Suplementos</span>
                <p style={{ fontSize: '0.9rem', marginTop: '0.25rem' }}>{dc.suplementos || 'Nenhum'}</p>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>Hábitos Diários</h3>
            
            <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div className="icon-box straw-bg" style={{ width: '40px', height: '40px' }}><Droplets size={18} /></div>
                <div>
                  <span className="info-label">Água por dia</span>
                  <div style={{ fontWeight: 700 }}>{habitos.agua_dia_litros ? `${habitos.agua_dia_litros} L` : '-'}</div>
                </div>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div className="icon-box gold-bg" style={{ width: '40px', height: '40px' }}><Activity size={18} /></div>
                <div>
                  <span className="info-label">Treino</span>
                  <div style={{ fontWeight: 700 }}>{habitos.pratica_atividade ? 'Sim' : 'Não'}</div>
                </div>
              </div>
            </div>

            <div className="form-grid">
              <div>
                <span className="info-label">Refeições ao dia</span>
                <p style={{ fontSize: '0.9rem', fontWeight: 600 }}>{habitos.refeicoes_dia || '-'}</p>
              </div>
              <div>
                <span className="info-label">Sono</span>
                <p style={{ fontSize: '0.9rem', fontWeight: 600 }}>Dorme às {habitos.horario_dorme || '-'} | Acorda às {habitos.horario_acorda || '-'}</p>
              </div>
            </div>

            {habitos.atividade_detalhes && (
              <div style={{ marginTop: '1rem', padding: '1rem', background: '#FAF9F8', borderRadius: '12px' }}>
                <span className="info-label">Detalhes da Atividade</span>
                <p style={{ fontSize: '0.9rem', marginTop: '0.25rem' }}>{habitos.atividade_detalhes}</p>
              </div>
            )}
            
            {dc.observacoes_gerais && (
              <div style={{ marginTop: '1rem', padding: '1rem', borderLeft: '3px solid var(--primary)' }}>
                <span className="info-label">Observações Gerais</span>
                <p style={{ fontSize: '0.9rem', marginTop: '0.25rem', fontStyle: 'italic' }}>"{dc.observacoes_gerais}"</p>
              </div>
            )}
          </div>

          <div className="card consultations-card">
            <h3>Histórico de Consultas</h3>
            {consultations.length === 0 ? (
              <p className="empty-history" style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>
                Nenhuma consulta registrada para este paciente.
              </p>
            ) : (
              <div className="timeline" style={{ marginTop: '1.5rem' }}>
                {consultations.map((consult) => (
                  <div key={consult.id} className="timeline-item">
                    <div className="timeline-badge">
                      <Check size={14} />
                    </div>
                    <div className="timeline-content">
                      <div className="timeline-header">
                        <span className="timeline-date">
                          {new Date(consult.data_hora).toLocaleString('pt-BR', {
                            dateStyle: 'short',
                            timeStyle: 'short',
                          })}
                        </span>
                        <span className={`status-tag ${consult.status?.toLowerCase() || 'agendada'}`}>
                          {consult.status || 'Agendada'}
                        </span>
                      </div>
                      {consult.observacoes && (
                        <p className="timeline-desc">{consult.observacoes}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
