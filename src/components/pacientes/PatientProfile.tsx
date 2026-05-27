import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  User, Calendar, Loader2, ArrowLeft, Check, 
  Activity, Plus, FileText, Save, X, Eye, Scale
} from 'lucide-react';

interface PatientProfileProps {
  patientId: string;
  onBack: () => void;
  onEdit: () => void;
}

interface WeightPoint {
  data: string;
  peso: number;
}

// Opções predefinidas idênticas às do formulário
const OBJETIVOS_OPCOES = ['Emagrecer', 'Ganhar massa', 'Controlar diabetes', 'Saúde geral', 'Performance esportiva', 'Reeducação alimentar'];
const NIVEIS_ATIVIDADE = ['Sedentário', 'Levemente ativo', 'Moderadamente ativo', 'Muito ativo', 'Extremamente ativo'];
const PATOLOGIAS_OPCOES = ['Diabetes', 'Hipertensão', 'Hipotireoidismo', 'Hipertireoidismo', 'Síndrome do ovário policístico', 'Doença celíaca', 'Colesterol alto'];
const RESTRICOES_OPCOES = ['Lactose', 'Glúten', 'Açúcar', 'Carne vermelha', 'Frutos do mar'];
const ALERGIAS_OPCOES = ['Amendoim', 'Leite', 'Ovo', 'Soja', 'Trigo', 'Frutos do mar'];

// Componente Interno do Gráfico de Evolução de Peso em SVG Nativo
function WeightChart({ data }: { data: WeightPoint[] }) {
  if (data.length === 0) {
    return (
      <div style={{ 
        height: '200px', 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center', 
        background: '#FAF9F8', 
        borderRadius: '16px', 
        border: '1px dashed var(--border)',
        padding: '1.5rem',
        textAlign: 'center'
      }}>
        <Scale size={32} style={{ color: 'var(--text-muted)', marginBottom: '0.5rem', opacity: 0.5 }} />
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 600 }}>Nenhuma consulta registrada ainda</p>
      </div>
    );
  }

  // Ordenar pela data de forma crescente para plotar da esquerda para a direita
  const sortedData = [...data].sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());

  // Definir dimensões
  const width = 500;
  const height = 240;
  const paddingLeft = 45;
  const paddingRight = 25;
  const paddingTop = 25;
  const paddingBottom = 35;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  // Extrair valores de peso
  const weights = sortedData.map(d => d.peso);
  const minWeight = Math.min(...weights);
  const maxWeight = Math.max(...weights);
  const weightRange = maxWeight - minWeight;

  // Escalar Y (ajustar limites para não colar nos cantos superior e inferior)
  const yMin = weightRange === 0 ? minWeight - 5 : minWeight - (weightRange * 0.15 || 2);
  const yMax = weightRange === 0 ? maxWeight + 5 : maxWeight + (weightRange * 0.15 || 2);
  const yRange = yMax - yMin;

  // Função para obter coordenadas X, Y de cada ponto
  const getCoords = (index: number, weight: number) => {
    const x = paddingLeft + (index / Math.max(1, sortedData.length - 1)) * chartWidth;
    const y = paddingTop + chartHeight - ((weight - yMin) / yRange) * chartHeight;
    return { x, y };
  };

  // Construir a string do path da linha e preenchimento da área
  let linePath = '';
  let areaPath = '';
  
  if (sortedData.length === 1) {
    const { y } = getCoords(0, sortedData[0].peso);
    linePath = `M ${paddingLeft} ${y} L ${width - paddingRight} ${y}`;
    areaPath = `M ${paddingLeft} ${y} L ${width - paddingRight} ${y} L ${width - paddingRight} ${height - paddingBottom} L ${paddingLeft} ${height - paddingBottom} Z`;
  } else {
    sortedData.forEach((d, index) => {
      const { x, y } = getCoords(index, d.peso);
      if (index === 0) {
        linePath = `M ${x} ${y}`;
        areaPath = `M ${x} ${y}`;
      } else {
        linePath += ` L ${x} ${y}`;
        areaPath += ` L ${x} ${y}`;
      }
    });
    
    const firstCoords = getCoords(0, sortedData[0].peso);
    const lastCoords = getCoords(sortedData.length - 1, sortedData[sortedData.length - 1].peso);
    areaPath += ` L ${lastCoords.x} ${height - paddingBottom} L ${firstCoords.x} ${height - paddingBottom} Z`;
  }

  // Valores de referência para o eixo Y (3 linhas de grid)
  const gridLines = 3;
  const gridValues = Array.from({ length: gridLines }, (_, i) => {
    return yMin + (i / (gridLines - 1)) * yRange;
  });

  return (
    <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: '16px', padding: '1.25rem', marginBottom: '1.5rem' }}>
      <h4 style={{ margin: '0 0 1rem 0', fontSize: '1rem', color: 'var(--text-main)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Activity size={18} color="var(--primary)" /> Evolução do Peso do Paciente
      </h4>
      <div style={{ position: 'relative', width: '100%' }}>
        <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="auto" style={{ overflow: 'visible' }}>
          <defs>
            <linearGradient id="chartLineGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="var(--primary)" />
              <stop offset="100%" stopColor="var(--gold)" />
            </linearGradient>
            <linearGradient id="chartAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.18" />
              <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.01" />
            </linearGradient>
          </defs>

          {/* Grid lines horizontais e rótulos do eixo Y */}
          {gridValues.map((val, i) => {
            const y = paddingTop + chartHeight - ((val - yMin) / yRange) * chartHeight;
            return (
              <g key={i}>
                <line x1={paddingLeft} y1={y} x2={width - paddingRight} y2={y} stroke="var(--border)" strokeDasharray="3,3" strokeWidth="1" />
                <text x={paddingLeft - 8} y={y + 4} textAnchor="end" fill="var(--text-muted)" fontSize="9" fontWeight="600">{val.toFixed(1)} kg</text>
              </g>
            );
          })}

          {/* Área sombreada */}
          {areaPath && <path d={areaPath} fill="url(#chartAreaGrad)" />}

          {/* Linha do gráfico */}
          {linePath && <path d={linePath} fill="none" stroke="url(#chartLineGrad)" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />}

          {/* Círculos nos pontos de dados */}
          {sortedData.map((d, index) => {
            const { x, y } = sortedData.length === 1 ? getCoords(0, d.peso) : getCoords(index, d.peso);
            const dateObj = new Date(d.data + 'T12:00:00'); // Evita problemas de fuso horário
            const dateStr = dateObj.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
            
            return (
              <g key={index}>
                <circle cx={x} cy={y} r="5" fill="white" stroke="var(--gold)" strokeWidth="3" style={{ filter: 'drop-shadow(0px 2px 4px rgba(0,0,0,0.1))' }} />
                <circle cx={x} cy={y} r="12" fill="transparent" style={{ cursor: 'pointer' }}>
                  <title>{`Data: ${new Date(d.data + 'T12:00:00').toLocaleDateString('pt-BR')} \nPeso: ${d.peso} kg`}</title>
                </circle>
                <text x={x} y={y - 12} textAnchor="middle" fill="var(--text-main)" fontSize="9" fontWeight="700">{d.peso} kg</text>
                <text x={x} y={height - paddingBottom + 16} textAnchor="middle" fill="var(--text-muted)" fontSize="9" fontWeight="600">{dateStr}</text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

export default function PatientProfile({ patientId, onBack, onEdit }: PatientProfileProps) {
  const [patient, setPatient] = useState<any>(null);
  const [consultations, setConsultations] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados para edição (Seção 1)
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [telefone, setTelefone] = useState('');
  const [dataNascimento, setDataNascimento] = useState('');
  const [sexo, setSexo] = useState('');

  const [peso, setPeso] = useState('');
  const [altura, setAltura] = useState('');
  const [nivelAtividade, setNivelAtividade] = useState('');
  const [objetivos, setObjetivos] = useState<string[]>([]);
  const [objetivoOutro, setObjetivoOutro] = useState('');
  const [patologias, setPatologias] = useState<string[]>([]);
  const [patologiaOutro, setPatologiaOutro] = useState('');
  const [restricoes, setRestricoes] = useState<string[]>([]);
  const [restricaoOutro, setRestricaoOutro] = useState('');
  const [alergias, setAlergias] = useState<string[]>([]);
  const [alergiaOutro, setAlergiaOutro] = useState('');
  const [medicamentos, setMedicamentos] = useState('');
  const [suplementos, setSuplementos] = useState('');

  const [refeicoesDia, setRefeicoesDia] = useState('');
  const [aguaDia, setAguaDia] = useState('');
  const [horarioAcorda, setHorarioAcorda] = useState('');
  const [horarioDorme, setHorarioDorme] = useState('');
  const [praticaAtividade, setPraticaAtividade] = useState<'sim' | 'nao' | ''>('');
  const [atividadeDetalhes, setAtividadeDetalhes] = useState('');
  const [observacoesGerais, setObservacoesGerais] = useState('');

  // Controle de abas da Seção 1
  const [activeTab, setActiveTab] = useState<'pessoal' | 'clinico' | 'habitos'>('pessoal');
  
  // Estados de feedback de salvamento
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Estados para Modal de Nova Consulta (Seção 2)
  const [showConsultationModal, setShowConsultationModal] = useState(false);
  const [cData, setCData] = useState(new Date().toISOString().split('T')[0]);
  const [cPeso, setCPeso] = useState('');
  const [cCintura, setCCintura] = useState('');
  const [cQuadril, setCQuadril] = useState('');
  const [cGordura, setCGordura] = useState('');
  const [cObservacoes, setCObservacoes] = useState('');
  const [cRetorno, setCRetorno] = useState('');
  const [cSaving, setCSaving] = useState(false);

  // Estados para Modal de Visualização do Plano Alimentar (Seção 3)
  const [selectedPlan, setSelectedPlan] = useState<any>(null);

  // Estados para Geração e Edição de Planos Alimentares por IA
  const [generatingAI, setGeneratingAI] = useState(false);
  const [generationMessage, setGenerationMessage] = useState('');
  const [editingPlan, setEditingPlan] = useState<any>(null);
  const [activeEditDay, setActiveEditDay] = useState('Segunda-feira');
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [savingPlan, setSavingPlan] = useState(false);
  const [activeViewDay, setActiveViewDay] = useState('Segunda-feira');

  useEffect(() => {
    loadData();
  }, [patientId]);

  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Carregar Paciente
      const { data: pData, error: pError } = await supabase
        .from('pacientes')
        .select('*')
        .eq('id', patientId)
        .single();
      
      if (pError) throw pError;
      setPatient(pData);

      // Iniciar campos editáveis com os valores carregados
      setNome(pData.nome || '');
      setEmail(pData.email || '');
      setWhatsapp(pData.whatsapp || pData.telefone || '');
      setTelefone(pData.telefone || '');
      setDataNascimento(pData.data_nascimento || '');
      setSexo(pData.sexo || '');

      const dc = pData.dados_clinicos || {};
      setPeso(dc.peso?.toString() || '');
      setAltura(dc.altura?.toString() || '');
      setNivelAtividade(dc.nivel_atividade || '');
      setMedicamentos(dc.medicamentos || '');
      setSuplementos(dc.suplementos || '');
      setObservacoesGerais(dc.observacoes_gerais || '');

      const objs = dc.objetivos || [];
      setObjetivos(objs.filter((o: string) => OBJETIVOS_OPCOES.includes(o)));
      const oOutro = objs.find((o: string) => !OBJETIVOS_OPCOES.includes(o));
      setObjetivoOutro(oOutro || '');

      const pats = dc.patologias || [];
      if (pats.includes('Nenhum')) setPatologias(['Nenhum']);
      else {
        setPatologias(pats.filter((p: string) => PATOLOGIAS_OPCOES.includes(p)));
        const pOutro = pats.find((p: string) => !PATOLOGIAS_OPCOES.includes(p) && p !== 'Nenhum');
        setPatologiaOutro(pOutro || '');
      }

      const rests = dc.restricoes || [];
      if (rests.includes('Nenhum')) setRestricoes(['Nenhum']);
      else {
        setRestricoes(rests.filter((r: string) => RESTRICOES_OPCOES.includes(r)));
        const rOutro = rests.find((r: string) => !RESTRICOES_OPCOES.includes(r) && r !== 'Nenhum');
        setRestricaoOutro(rOutro || '');
      }

      const alergs = dc.alergias || [];
      if (alergs.includes('Nenhum')) setAlergias(['Nenhum']);
      else {
        setAlergias(alergs.filter((a: string) => ALERGIAS_OPCOES.includes(a)));
        const aOutro = alergs.find((a: string) => !ALERGIAS_OPCOES.includes(a) && a !== 'Nenhum');
        setAlergiaOutro(aOutro || '');
      }

      const hab = dc.habitos || {};
      setRefeicoesDia(hab.refeicoes_dia?.toString() || '');
      setAguaDia(hab.agua_dia_litros?.toString() || '');
      setHorarioAcorda(hab.horario_acorda || '');
      setHorarioDorme(hab.horario_dorme || '');
      if (hab.pratica_atividade !== undefined) {
        setPraticaAtividade(hab.pratica_atividade ? 'sim' : 'nao');
      }
      setAtividadeDetalhes(hab.atividade_detalhes || '');

      // 2. Carregar Consultas
      const { data: cData, error: cError } = await supabase
        .from('consultas')
        .select('*')
        .eq('paciente_id', patientId)
        .order('data_consulta', { ascending: false });
        
      if (!cError) {
        setConsultations(cData || []);
      }

      // 3. Carregar Planos Alimentares
      const { data: plData, error: plError } = await supabase
        .from('planos_alimentares')
        .select('*')
        .eq('paciente_id', patientId)
        .order('created_at', { ascending: false });
        
      if (!plError) {
        setPlans(plData || []);
      }

    } catch (err) {
      console.error('Erro ao carregar perfil:', err);
    } finally {
      setLoading(false);
    }
  };

  // Funções para Geração e Edição de Planos Alimentares por IA
  const handleGenerateAIPlan = async () => {
    setGeneratingAI(true);
    setEditingPlan(null);
    setEditingPlanId(null);
    
    const messages = [
      "Buscando dados do paciente...",
      "Analisando restrições e alergias...",
      "Calculando necessidades nutricionais...",
      "O Gemini está elaborando o cardápio semanal...",
      "Quase pronto! Organizando as refeições..."
    ];
    let msgIndex = 0;
    setGenerationMessage(messages[0]);
    
    const interval = setInterval(() => {
      msgIndex = (msgIndex + 1) % messages.length;
      setGenerationMessage(messages[msgIndex]);
    }, 2500);

    const formattedAge = idade ? `${idade} anos` : 'Não informada';
    const patientData = `
      Nome: ${nome}
      Sexo: ${sexo || 'Não informado'}
      Idade: ${formattedAge}
      Nível de Atividade: ${nivelAtividade || 'Não informado'}
      Objetivos: ${[...objetivos, objetivoOutro].filter(Boolean).join(', ')}
      Patologias: ${[...patologias, patologiaOutro].filter(Boolean).join(', ')}
      Restrições Alimentares: ${[...restricoes, restricaoOutro].filter(Boolean).join(', ')}
      Alergias: ${[...alergias, alergiaOutro].filter(Boolean).join(', ')}
      Medicamentos: ${medicamentos || 'Nenhum'}
      Suplementos: ${suplementos || 'Nenhum'}
      Água por dia: ${aguaDia || 'Não informada'} litros
      Refeições por dia: ${refeicoesDia || 'Não informadas'}
      Prática Atividade Física: ${praticaAtividade === 'sim' ? `Sim - ${atividadeDetalhes}` : 'Não'}
      Observações: ${observacoesGerais || 'Nenhuma'}
    `;

    try {
      const { data, error } = await supabase.functions.invoke('gerar-plano', {
        body: { dados_do_paciente: patientData }
      });

      if (error) throw error;

      let planJson = data;
      if (typeof planJson === 'string') {
        try {
          planJson = JSON.parse(planJson);
        } catch (e) {
          throw new Error("Erro ao interpretar a resposta da IA como JSON.");
        }
      }

      if (!planJson || !Array.isArray(planJson.plano_semanal)) {
        throw new Error("A resposta da IA não seguiu a estrutura esperada.");
      }

      setEditingPlan(planJson);
      setActiveEditDay(planJson.plano_semanal[0]?.dia || "Segunda-feira");
      
      setTimeout(() => {
        const editorEl = document.getElementById('ai-meal-plan-editor');
        if (editorEl) {
          editorEl.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } catch (err: any) {
      console.error('Erro ao gerar plano:', err);
      alert(`Não foi possível gerar o plano com IA no momento. Erro: ${err.message || err}. Deseja tentar novamente ou criar um Plano Manual?`);
    } finally {
      clearInterval(interval);
      setGeneratingAI(false);
      setGenerationMessage('');
    }
  };

  const handleMealOptionChange = (dia: string, refeicaoKey: string, optionIndex: number, newValue: string) => {
    setEditingPlan((prev: any) => {
      if (!prev) return prev;
      const updatedPlanoSemanal = prev.plano_semanal.map((d: any) => {
        if (d.dia === dia) {
          const updatedRefeicoes = { ...d.refeicoes };
          updatedRefeicoes[refeicaoKey] = [...(updatedRefeicoes[refeicaoKey] || [])];
          updatedRefeicoes[refeicaoKey][optionIndex] = newValue;
          return { ...d, refeicoes: updatedRefeicoes };
        }
        return d;
      });
      return { ...prev, plano_semanal: updatedPlanoSemanal };
    });
  };

  const handleSaveMealPlan = async () => {
    if (!editingPlan) return;
    setSavingPlan(true);
    try {
      if (editingPlanId) {
        // Atualizar plano existente
        const { error } = await supabase
          .from('planos_alimentares')
          .update({ conteudo: editingPlan })
          .eq('id', editingPlanId);

        if (error) throw error;
        alert("Plano alimentar atualizado com sucesso!");
      } else {
        // Inserir novo plano
        const { error } = await supabase
          .from('planos_alimentares')
          .insert([
            {
              paciente_id: patientId,
              conteudo: editingPlan
            }
          ]);

        if (error) throw error;
        alert("Plano alimentar criado com sucesso!");
      }

      // Primeiro recarrega os planos do paciente
      await loadData();
      // Depois limpa o editor
      setEditingPlan(null);
      setEditingPlanId(null);
    } catch (err: any) {
      console.error('Erro ao salvar plano:', err);
      alert("Erro ao salvar plano alimentar: " + err.message);
    } finally {
      setSavingPlan(false);
    }
  };

  const handleEditExistingPlan = (plan: any) => {
    let planData = plan.conteudo;
    if (typeof planData === 'string') {
      try {
        planData = JSON.parse(planData);
      } catch (e) {
        alert("Este plano antigo não está no formato estruturado editável.");
        return;
      }
    }

    if (planData && Array.isArray(planData.plano_semanal)) {
      setEditingPlan(planData);
      setEditingPlanId(plan.id);
      setActiveEditDay(planData.plano_semanal[0]?.dia || "Segunda-feira");
      setTimeout(() => {
        const editorEl = document.getElementById('ai-meal-plan-editor');
        if (editorEl) {
          editorEl.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } else {
      alert("Este plano não possui estrutura editável.");
    }
  };

  const handleDeletePlan = async (planId: string) => {
    if (!confirm("Tem certeza que deseja excluir permanentemente este plano alimentar?")) return;
    try {
      const { error } = await supabase
        .from('planos_alimentares')
        .delete()
        .eq('id', planId);
      
      if (error) throw error;
      alert("Plano alimentar excluído com sucesso.");
      await loadData();
    } catch (err: any) {
      console.error('Erro ao excluir plano:', err);
      alert("Erro ao excluir plano: " + err.message);
    }
  };

  // Cálculos Automáticos para a Biometria de Edição
  const idade = useMemo(() => {
    if (!dataNascimento) return '';
    const today = new Date();
    const birthDate = new Date(dataNascimento);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age.toString();
  }, [dataNascimento]);

  const imc = useMemo(() => {
    const p = parseFloat(peso);
    const a = parseFloat(altura) / 100;
    if (p > 0 && a > 0) {
      return (p / (a * a)).toFixed(2);
    }
    return '';
  }, [peso, altura]);

  const getImcStatus = (imcValue: string) => {
    if (!imcValue) return null;
    const v = parseFloat(imcValue);
    if (v < 18.5) return { text: 'Abaixo do peso', color: '#D69E2E' };
    if (v >= 18.5 && v <= 24.9) return { text: 'Peso ideal', color: '#38A169' };
    if (v >= 25 && v <= 29.9) return { text: 'Acima do peso', color: '#DD6B20' };
    return { text: 'Obesidade', color: '#E53E3E' };
  };

  const formatTimeInput = (val: string) => {
    const numeric = val.replace(/\D/g, '');
    if (!numeric) return '';
    if (numeric.length <= 2) {
      const h = numeric.padStart(2, '0');
      return `${h}:00`;
    }
    const h = numeric.slice(0, numeric.length - 2).padStart(2, '0');
    const m = numeric.slice(-2);
    return `${h}:${m}`;
  };

  const toggleArrayItem = (setter: React.Dispatch<React.SetStateAction<string[]>>, array: string[], item: string) => {
    if (item === 'Nenhum') {
      setter(['Nenhum']);
      return;
    }
    let newArray = array.filter(i => i !== 'Nenhum');
    if (newArray.includes(item)) {
      newArray = newArray.filter(i => i !== item);
    } else {
      newArray.push(item);
    }
    setter(newArray);
  };

  // Salvar Alterações de Dados do Paciente (Seção 1)
  const handleSavePatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) {
      setErrorMsg('O nome completo é obrigatório.');
      return;
    }

    setSaving(true);
    setErrorMsg('');
    setSuccessMsg('');

    const dadosClinicos = {
      peso: peso ? parseFloat(peso) : null,
      altura: altura ? parseFloat(altura) : null,
      imc: imc ? parseFloat(imc) : null,
      objetivos: objetivoOutro.trim() ? [...objetivos, objetivoOutro.trim()] : objetivos,
      nivel_atividade: nivelAtividade,
      patologias: patologiaOutro.trim() ? [...patologias, patologiaOutro.trim()] : patologias,
      restricoes: restricaoOutro.trim() ? [...restricoes, restricaoOutro.trim()] : restricoes,
      alergias: alergiaOutro.trim() ? [...alergias, alergiaOutro.trim()] : alergias,
      medicamentos: medicamentos,
      suplementos: suplementos,
      habitos: {
        refeicoes_dia: refeicoesDia ? parseInt(refeicoesDia, 10) : null,
        horario_acorda: formatTimeInput(horarioAcorda),
        horario_dorme: formatTimeInput(horarioDorme),
        agua_dia_litros: aguaDia ? parseFloat(aguaDia) : null,
        pratica_atividade: praticaAtividade === 'sim',
        atividade_detalhes: atividadeDetalhes,
      },
      observacoes_gerais: observacoesGerais
    };

    try {
      const { data, error } = await supabase
        .from('pacientes')
        .update({
          nome,
          email: email || null,
          telefone: whatsapp || null, // WhatsApp ou Telefone sincronizados
          whatsapp: whatsapp || null,
          data_nascimento: dataNascimento || null,
          sexo: sexo || null,
          dados_clinicos: dadosClinicos
        })
        .eq('id', patientId)
        .select()
        .single();

      if (error) throw error;
      
      setPatient(data);
      setSuccessMsg('Alterações salvas com sucesso!');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      console.error('Erro ao salvar paciente:', err);
      setErrorMsg(err.message || 'Erro inesperado ao salvar.');
    } finally {
      setSaving(false);
    }
  };

  // Salvar Nova Consulta (Seção 2)
  const handleSaveConsultation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cPeso) {
      alert('O peso atual é obrigatório.');
      return;
    }

    setCSaving(true);
    try {
      const { error } = await supabase
        .from('consultas')
        .insert([{
          paciente_id: patientId,
          data_consulta: cData,
          peso: parseFloat(cPeso),
          cintura: cCintura ? parseFloat(cCintura) : null,
          quadril: cQuadril ? parseFloat(cQuadril) : null,
          percentual_gordura: cGordura ? parseFloat(cGordura) : null,
          observacoes: cObservacoes,
          proximo_retorno: cRetorno || null,
          status: 'Realizada'
        }]);

      if (error) throw error;

      // Resetar form do modal e recarregar dados
      setShowConsultationModal(false);
      setCPeso('');
      setCCintura('');
      setCQuadril('');
      setCGordura('');
      setCObservacoes('');
      setCRetorno('');
      
      await loadData();
    } catch (err: any) {
      console.error('Erro ao salvar consulta:', err);
      alert('Erro ao salvar consulta: ' + err.message);
    } finally {
      setCSaving(false);
    }
  };

  // Mapear pontos para o gráfico de evolução de peso
  const weightHistory: WeightPoint[] = useMemo(() => {
    return consultations
      .filter(c => c.peso)
      .map(c => ({
        data: c.data_consulta,
        peso: parseFloat(c.peso)
      }));
  }, [consultations]);

  if (loading) {
    return (
      <div className="dashboard-loading">
        <Loader2 className="animate-spin" size={40} color="var(--primary)" />
        <p>Carregando perfil do paciente...</p>
      </div>
    );
  }

  return (
    <div className="profile-container" style={{ animation: 'modalEnter 0.3s ease-out' }}>
      
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
        <button className="btn-back" style={{ marginBottom: 0 }} onClick={onBack}>
          <ArrowLeft size={16} /> Voltar para lista
        </button>
        <button className="btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.5rem 1rem', fontSize: '0.875rem' }} onClick={onEdit}>
          Editar Cadastro Completo
        </button>
      </div>

      {/* Nome e Resumo */}
      <div className="card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
        <div className="profile-avatar">
          <User size={32} />
        </div>
        <div style={{ flex: 1 }}>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>{patient.nome}</h2>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '0.35rem' }}>
            <span className="patient-status">Paciente Ativo</span>
            {patient.email && <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>| {patient.email}</span>}
          </div>
        </div>
      </div>

      {/* Layout de 3 Seções */}
      <div className="profile-layout">
        
        {/* Coluna da Esquerda: Seção 1 (Dados do Paciente) + Seção 3 (Planos Alimentares) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Seção 1 — Dados do paciente */}
          <div className="card" style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>Dados do Paciente</h3>
              <button 
                type="button" 
                className="btn-primary" 
                onClick={handleSavePatient}
                disabled={saving}
                style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
              >
                {saving ? <Loader2 className="animate-spin" size={16} /> : <><Save size={16} /> Salvar Alterações</>}
              </button>
            </div>

            {successMsg && <div className="success-message">{successMsg}</div>}
            {errorMsg && <div className="error-message">{errorMsg}</div>}

            {/* Sub-abas de dados */}
            <div className="tabs-header" style={{ marginBottom: '1.5rem' }}>
              <button 
                type="button"
                className={`tab-btn ${activeTab === 'pessoal' ? 'active' : ''}`}
                onClick={() => setActiveTab('pessoal')}
                style={{ padding: '0.5rem 1rem' }}
              >
                Pessoal
              </button>
              <button 
                type="button"
                className={`tab-btn ${activeTab === 'clinico' ? 'active' : ''}`}
                onClick={() => setActiveTab('clinico')}
                style={{ padding: '0.5rem 1rem' }}
              >
                Clínico
              </button>
              <button 
                type="button"
                className={`tab-btn ${activeTab === 'habitos' ? 'active' : ''}`}
                onClick={() => setActiveTab('habitos')}
                style={{ padding: '0.5rem 1rem' }}
              >
                Hábitos
              </button>
            </div>

            {/* Formulário das Abas */}
            <form onSubmit={handleSavePatient} className="form-container">
              
              {/* Aba Pessoal */}
              <div style={{ display: activeTab === 'pessoal' ? 'block' : 'none' }}>
                <div className="form-grid">
                  <div className="form-group form-full-width">
                    <label className="form-label">Nome Completo</label>
                    <input type="text" className="form-input" value={nome} onChange={e => setNome(e.target.value)} required />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Nascimento</label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <input type="date" className="form-input" style={{ flex: 1 }} value={dataNascimento} onChange={e => setDataNascimento(e.target.value)} />
                      <input type="text" className="form-input input-readonly" style={{ width: '85px', textAlign: 'center' }} value={idade ? `${idade} anos` : ''} placeholder="Idade" readOnly tabIndex={-1} />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Sexo</label>
                    <select className="form-input" value={sexo} onChange={e => setSexo(e.target.value)}>
                      <option value="">Selecione...</option>
                      <option value="Feminino">Feminino</option>
                      <option value="Masculino">Masculino</option>
                      <option value="Outro">Outro</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">WhatsApp</label>
                    <input type="tel" className="form-input" value={whatsapp} onChange={e => setWhatsapp(e.target.value)} placeholder="(00) 90000-0000" />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Telefone Secundário</label>
                    <input type="tel" className="form-input" value={telefone} onChange={e => setTelefone(e.target.value)} placeholder="(00) 0000-0000" />
                  </div>

                  <div className="form-group form-full-width">
                    <label className="form-label">E-mail</label>
                    <input type="email" className="form-input" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@exemplo.com" />
                  </div>
                </div>
              </div>

              {/* Aba Clínico */}
              <div style={{ display: activeTab === 'clinico' ? 'block' : 'none' }}>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Peso Atual</label>
                    <div className="input-with-suffix">
                      <input type="number" step="0.1" className="form-input" value={peso} onChange={e => setPeso(e.target.value)} />
                      <span className="input-suffix">kg</span>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Altura</label>
                    <div className="input-with-suffix">
                      <input type="number" className="form-input" value={altura} onChange={e => setAltura(e.target.value)} />
                      <span className="input-suffix">cm</span>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">IMC Calculado</label>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <input type="text" className="form-input input-readonly" style={{ flex: 1 }} value={imc} readOnly placeholder="Automático" tabIndex={-1} />
                      {imc && getImcStatus(imc) && (
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: getImcStatus(imc)?.color, whiteSpace: 'nowrap' }}>
                          {getImcStatus(imc)?.text}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Nível de Atividade</label>
                    <select className="form-input" value={nivelAtividade} onChange={e => setNivelAtividade(e.target.value)}>
                      <option value="">Selecione...</option>
                      {NIVEIS_ATIVIDADE.map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </div>

                  {/* Objetivos */}
                  <div className="form-group form-full-width">
                    <label className="form-label">Objetivo Principal</label>
                    <div className="chips-container">
                      {OBJETIVOS_OPCOES.map(obj => (
                        <div key={obj} className={`chip ${objetivos.includes(obj) ? 'selected' : ''}`} onClick={() => toggleArrayItem(setObjetivos, objetivos, obj)}>
                          {obj}
                        </div>
                      ))}
                    </div>
                    <input type="text" className="form-input" style={{ width: '100%', marginTop: '0.5rem' }} placeholder="Outro objetivo..." value={objetivoOutro} onChange={e => setObjetivoOutro(e.target.value)} />
                  </div>

                  {/* Patologias */}
                  <div className="form-group form-full-width">
                    <label className="form-label">Patologias ou Saúde</label>
                    <div className="chips-container">
                      <div className={`chip ${patologias.includes('Nenhum') ? 'selected' : ''}`} onClick={() => toggleArrayItem(setPatologias, patologias, 'Nenhum')}>Nenhuma</div>
                      {PATOLOGIAS_OPCOES.map(pat => (
                        <div key={pat} className={`chip ${patologias.includes(pat) ? 'selected' : ''}`} onClick={() => toggleArrayItem(setPatologias, patologias, pat)}>
                          {pat}
                        </div>
                      ))}
                    </div>
                    <input type="text" className="form-input" style={{ width: '100%', marginTop: '0.5rem' }} placeholder="Outra patologia..." value={patologiaOutro} onChange={e => setPatologiaOutro(e.target.value)} />
                  </div>

                  {/* Restrições e Alergias */}
                  <div className="form-group">
                    <label className="form-label">Restrições</label>
                    <div className="chips-container">
                      <div className={`chip ${restricoes.includes('Nenhum') ? 'selected' : ''}`} onClick={() => toggleArrayItem(setRestricoes, restricoes, 'Nenhum')}>Nenhuma</div>
                      {RESTRICOES_OPCOES.map(res => (
                        <div key={res} className={`chip ${restricoes.includes(res) ? 'selected' : ''}`} onClick={() => toggleArrayItem(setRestricoes, restricoes, res)}>{res}</div>
                      ))}
                    </div>
                    <input type="text" className="form-input" style={{ marginTop: '0.5rem' }} placeholder="Outra restrição..." value={restricaoOutro} onChange={e => setRestricaoOutro(e.target.value)} />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Alergias</label>
                    <div className="chips-container">
                      <div className={`chip ${alergias.includes('Nenhum') ? 'selected' : ''}`} onClick={() => toggleArrayItem(setAlergias, alergias, 'Nenhum')}>Nenhuma</div>
                      {ALERGIAS_OPCOES.map(alg => (
                        <div key={alg} className={`chip ${alergias.includes(alg) ? 'selected' : ''}`} onClick={() => toggleArrayItem(setAlergias, alergias, alg)}>{alg}</div>
                      ))}
                    </div>
                    <input type="text" className="form-input" style={{ marginTop: '0.5rem' }} placeholder="Outra alergia..." value={alergiaOutro} onChange={e => setAlergiaOutro(e.target.value)} />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Medicamentos Contínuos</label>
                    <textarea className="form-input" rows={2} value={medicamentos} onChange={e => setMedicamentos(e.target.value)} placeholder="Nenhum"></textarea>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Suplementos em Uso</label>
                    <textarea className="form-input" rows={2} value={suplementos} onChange={e => setSuplementos(e.target.value)} placeholder="Nenhum"></textarea>
                  </div>
                </div>
              </div>

              {/* Aba Hábitos */}
              <div style={{ display: activeTab === 'habitos' ? 'block' : 'none' }}>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Refeições ao dia</label>
                    <input type="number" className="form-input" value={refeicoesDia} onChange={e => setRefeicoesDia(e.target.value)} placeholder="Ex: 5" />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Água ao dia (Litros)</label>
                    <div className="input-with-suffix">
                      <input type="number" step="0.1" className="form-input" value={aguaDia} onChange={e => setAguaDia(e.target.value)} />
                      <span className="input-suffix">litros</span>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Horário que acorda</label>
                    <input type="text" className="form-input" value={horarioAcorda} onChange={e => setHorarioAcorda(e.target.value)} onBlur={() => setHorarioAcorda(formatTimeInput(horarioAcorda))} placeholder="06:00" />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Horário que dorme</label>
                    <input type="text" className="form-input" value={horarioDorme} onChange={e => setHorarioDorme(e.target.value)} onBlur={() => setHorarioDorme(formatTimeInput(horarioDorme))} placeholder="22:30" />
                  </div>

                  <div className="form-group form-full-width">
                    <label className="form-label">Pratica Atividade Física?</label>
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '0.25rem' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.9rem' }}>
                        <input type="radio" name="praticaAtivProf" checked={praticaAtividade === 'sim'} onChange={() => setPraticaAtividade('sim')} /> Sim
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.9rem' }}>
                        <input type="radio" name="praticaAtivProf" checked={praticaAtividade === 'nao'} onChange={() => { setPraticaAtividade('nao'); setAtividadeDetalhes(''); }} /> Não
                      </label>
                    </div>
                    {praticaAtividade === 'sim' && (
                      <input type="text" className="form-input" style={{ marginTop: '0.75rem' }} placeholder="Frequência e tipo de treino..." value={atividadeDetalhes} onChange={e => setAtividadeDetalhes(e.target.value)} />
                    )}
                  </div>

                  <div className="form-group form-full-width">
                    <label className="form-label">Observações Gerais</label>
                    <textarea className="form-input" rows={3} value={observacoesGerais} onChange={e => setObservacoesGerais(e.target.value)} placeholder="Outras informações clínicas importantes..."></textarea>
                  </div>
                </div>
              </div>

            </form>
          </div>

          {/* Seção 3 — Planos alimentares */}
          {generatingAI && (
            <div className="card" style={{ 
              padding: '2rem', 
              textAlign: 'center', 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              gap: '1rem',
              border: '2px solid var(--primary)',
              background: 'rgba(166, 139, 106, 0.02)'
            }}>
              <Loader2 className="animate-spin" size={40} color="var(--primary)" />
              <p style={{ fontWeight: 600, color: 'var(--text-main)', margin: 0 }}>{generationMessage}</p>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
                Isso pode levar de 15 a 30 segundos enquanto a IA analisa o histórico e monta o plano ideal...
              </p>
            </div>
          )}

          {editingPlan && (
            <div id="ai-meal-plan-editor" className="card" style={{ padding: '2rem', animation: 'modalEnter 0.3s ease-out', border: '2px solid var(--primary)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                  {editingPlanId ? '✏️ Editando Plano Alimentar' : '✨ Plano Alimentar Gerado por IA'}
                </h3>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button 
                    type="button" 
                    className="btn-outline" 
                    onClick={() => { setEditingPlan(null); setEditingPlanId(null); }}
                    style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', cursor: 'pointer' }}
                  >
                    Cancelar
                  </button>
                  <button 
                    type="button" 
                    className="btn-primary" 
                    onClick={handleSaveMealPlan}
                    disabled={savingPlan}
                    style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                  >
                    {savingPlan ? <Loader2 className="animate-spin" size={16} /> : <><Check size={16} /> Salvar Plano Alimentar</>}
                  </button>
                </div>
              </div>

              {/* Abas para os dias da semana */}
              <div className="tabs-header" style={{ marginBottom: '1.5rem', display: 'flex', gap: '0.35rem', overflowX: 'auto' }}>
                {editingPlan.plano_semanal.map((diaObj: any) => (
                  <button
                    key={diaObj.dia}
                    type="button"
                    className={`tab-btn ${activeEditDay === diaObj.dia ? 'active' : ''}`}
                    onClick={() => setActiveEditDay(diaObj.dia)}
                    style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                  >
                    {diaObj.dia}
                  </button>
                ))}
              </div>

              {/* Cards de Refeições para o dia ativo */}
              {(() => {
                const diaAtivo = editingPlan.plano_semanal.find((d: any) => d.dia === activeEditDay);
                if (!diaAtivo) return null;

                return (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
                    {Object.entries(diaAtivo.refeicoes).map(([refeicaoKey, opcoes]: [string, any]) => {
                      const labelRefeicao = refeicaoKey === 'cafe_da_manha' ? '☕ Café da Manhã' :
                                           refeicaoKey === 'almoco' ? '🍽️ Almoço' :
                                           refeicaoKey === 'jantar' ? '🌙 Jantar' : refeicaoKey;

                      return (
                        <div key={refeicaoKey} style={{ background: '#FAF9F8', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
                          <h4 style={{ margin: '0 0 1rem 0', fontSize: '1rem', color: 'var(--text-main)', fontWeight: 700 }}>
                            {labelRefeicao}
                          </h4>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {opcoes.map((opcao: string, oIdx: number) => (
                              <div key={oIdx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', width: '20px' }}>
                                  #{oIdx + 1}
                                </span>
                                <input
                                  type="text"
                                  className="form-input"
                                  style={{ width: '100%', padding: '0.4rem 0.75rem', fontSize: '0.9rem' }}
                                  value={opcao}
                                  onChange={(e) => handleMealOptionChange(activeEditDay, refeicaoKey, oIdx, e.target.value)}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          )}

          <div className="card" style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>Planos Alimentares</h3>
              <button 
                type="button"
                className="btn-primary" 
                onClick={handleGenerateAIPlan}
                disabled={generatingAI}
                style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.25rem', cursor: 'pointer' }}
              >
                {generatingAI ? <Loader2 className="animate-spin" size={16} /> : '✨ Gerar Plano com IA'}
              </button>
            </div>

            {plans.length === 0 ? (
              <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)', background: '#FAF9F8', borderRadius: '16px' }}>
                <FileText size={32} style={{ color: 'var(--text-muted)', marginBottom: '0.5rem', opacity: 0.5 }} />
                <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600 }}>Nenhum plano alimentar gerado ainda</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {plans.map((plan) => (
                  <div 
                    key={plan.id}
                    onClick={() => setSelectedPlan(plan)}
                    style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center', 
                      padding: '1rem', 
                      background: '#FAF9F8', 
                      border: '1px solid var(--border)', 
                      borderRadius: '12px',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    className="hover-row-effect"
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <FileText size={18} color="var(--primary)" />
                      <div>
                        <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-main)' }}>Plano Alimentar</span>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                          Gerado em: {new Date(plan.created_at).toLocaleDateString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.35rem' }}>
                      <button 
                        type="button"
                        className="btn-outline" 
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPlan(plan);
                        }}
                        style={{ padding: '0.35rem 0.6rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.25rem', cursor: 'pointer' }}
                      >
                        <Eye size={14} /> Visualizar
                      </button>
                      <button 
                        type="button"
                        className="btn-outline" 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditExistingPlan(plan);
                        }}
                        style={{ padding: '0.35rem 0.6rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.25rem', cursor: 'pointer', color: 'var(--primary)' }}
                      >
                        Editar
                      </button>
                      <button 
                        type="button"
                        className="btn-outline" 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeletePlan(plan.id);
                        }}
                        style={{ padding: '0.35rem 0.6rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.25rem', cursor: 'pointer', color: '#c53030' }}
                      >
                        Excluir
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Coluna da Direita: Seção 2 (Acompanhamento e Consultas) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Seção 2 — Consultas */}
          <div className="card" style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>Histórico de Consultas</h3>
              <button 
                className="btn-primary" 
                onClick={() => setShowConsultationModal(true)}
                style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
              >
                <Plus size={16} /> Nova Consulta
              </button>
            </div>

            {/* Gráfico de peso (Sempre Visível) */}
            <WeightChart data={weightHistory} />

            {/* Lista de Consultas */}
            {consultations.length === 0 ? (
              <p className="empty-history" style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)' }}>
                Nenhuma consulta registrada para este paciente.
              </p>
            ) : (
              <div className="timeline" style={{ marginTop: '0.5rem', paddingLeft: '1.25rem' }}>
                {consultations.map((consult) => {
                  const dataConsultaFormatted = consult.data_consulta 
                    ? new Date(consult.data_consulta + 'T12:00:00').toLocaleDateString('pt-BR') 
                    : consult.data_hora 
                      ? new Date(consult.data_hora).toLocaleDateString('pt-BR') 
                      : 'Não informada';
                  
                  return (
                    <div key={consult.id} className="timeline-item">
                      <div className="timeline-badge" style={{ backgroundColor: 'var(--primary)' }}>
                        <Check size={10} />
                      </div>
                      <div className="timeline-content" style={{ padding: '1rem', background: '#FAF9F8' }}>
                        <div className="timeline-header" style={{ marginBottom: '0.5rem' }}>
                          <span className="timeline-date" style={{ color: 'var(--text-main)', fontWeight: 700 }}>
                            {dataConsultaFormatted}
                          </span>
                          <span className="status-tag realizada" style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem' }}>
                            {consult.status || 'Realizada'}
                          </span>
                        </div>

                        {/* Indicadores Físicos */}
                        <div style={{ 
                          display: 'grid', 
                          gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))', 
                          gap: '0.5rem',
                          background: 'white',
                          padding: '0.6rem',
                          borderRadius: '8px',
                          border: '1px solid var(--border)',
                          marginBottom: '0.5rem'
                        }}>
                          <div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>PESO</div>
                            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>{consult.peso ? `${consult.peso} kg` : '-'}</div>
                          </div>
                          <div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>CINTURA</div>
                            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>{consult.cintura ? `${consult.cintura} cm` : '-'}</div>
                          </div>
                          <div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>QUADRIL</div>
                            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>{consult.quadril ? `${consult.quadril} cm` : '-'}</div>
                          </div>
                          <div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>% GORDURA</div>
                            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>{consult.percentual_gordura ? `${consult.percentual_gordura}%` : '-'}</div>
                          </div>
                        </div>

                        {consult.observacoes && (
                          <p className="timeline-desc" style={{ margin: '0.25rem 0', fontSize: '0.85rem', fontStyle: 'italic' }}>
                            "{consult.observacoes}"
                          </p>
                        )}

                        {consult.proximo_retorno && (
                          <div style={{ 
                            marginTop: '0.5rem', 
                            fontSize: '0.75rem', 
                            color: 'var(--primary)', 
                            fontWeight: 700, 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '0.25rem' 
                          }}>
                            <Calendar size={12} /> Próximo retorno: {new Date(consult.proximo_retorno + 'T12:00:00').toLocaleDateString('pt-BR')}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Modal de Nova Consulta */}
      {showConsultationModal && (
        <div className="modal-backdrop">
          <div className="modal-card" style={{ maxWidth: '500px', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>Nova Consulta</h3>
              <button 
                className="btn-outline" 
                onClick={() => setShowConsultationModal(false)}
                style={{ padding: '0.4rem', border: 'none', background: 'transparent', cursor: 'pointer' }}
              >
                <X size={20} color="var(--text-muted)" />
              </button>
            </div>

            <form onSubmit={handleSaveConsultation} className="form-container">
              <div className="form-grid" style={{ gap: '1rem' }}>
                
                <div className="form-group form-full-width">
                  <label className="form-label">Data da Consulta</label>
                  <input 
                    type="date" 
                    className="form-input" 
                    value={cData} 
                    onChange={e => setCData(e.target.value)} 
                    required 
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Peso Atual (kg) <span style={{ color: '#E53E3E' }}>*</span></label>
                  <input 
                    type="number" 
                    step="0.1" 
                    className="form-input" 
                    value={cPeso} 
                    onChange={e => setCPeso(e.target.value)} 
                    placeholder="0.0"
                    required 
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">% de Gordura (opcional)</label>
                  <input 
                    type="number" 
                    step="0.1" 
                    className="form-input" 
                    value={cGordura} 
                    onChange={e => setCGordura(e.target.value)} 
                    placeholder="0.0"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Cintura (cm - opcional)</label>
                  <input 
                    type="number" 
                    step="0.1" 
                    className="form-input" 
                    value={cCintura} 
                    onChange={e => setCCintura(e.target.value)} 
                    placeholder="0.0"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Quadril (cm - opcional)</label>
                  <input 
                    type="number" 
                    step="0.1" 
                    className="form-input" 
                    value={cQuadril} 
                    onChange={e => setCQuadril(e.target.value)} 
                    placeholder="0.0"
                  />
                </div>

                <div className="form-group form-full-width">
                  <label className="form-label">Próximo Retorno (opcional)</label>
                  <input 
                    type="date" 
                    className="form-input" 
                    value={cRetorno} 
                    onChange={e => setCRetorno(e.target.value)} 
                  />
                </div>

                <div className="form-group form-full-width">
                  <label className="form-label">Observações</label>
                  <textarea 
                    className="form-input" 
                    rows={3} 
                    value={cObservacoes} 
                    onChange={e => setCObservacoes(e.target.value)} 
                    placeholder="Evolução, queixas, metas para o próximo retorno..."
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button 
                  type="button" 
                  className="btn-outline" 
                  onClick={() => setShowConsultationModal(false)}
                  style={{ padding: '0.6rem 1.25rem' }}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="btn-primary" 
                  disabled={cSaving}
                  style={{ padding: '0.6rem 1.5rem' }}
                >
                  {cSaving ? <Loader2 className="animate-spin" size={18} /> : 'Salvar Consulta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Visualização do Plano Alimentar */}
      {selectedPlan && (() => {
        const planData = selectedPlan.conteudo;
        const isStructured = planData && Array.isArray(planData.plano_semanal);
        return (
          <div className="modal-backdrop">
            <div className="modal-card" style={{ maxWidth: '600px', padding: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>Visualizar Plano Alimentar</h3>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Gerado em: {new Date(selectedPlan.created_at).toLocaleDateString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                  </span>
                </div>
                <button 
                  type="button"
                  className="btn-outline" 
                  onClick={() => setSelectedPlan(null)}
                  style={{ padding: '0.4rem', border: 'none', background: 'transparent', cursor: 'pointer' }}
                >
                  <X size={20} color="var(--text-muted)" />
                </button>
              </div>

              <div style={{ 
                maxHeight: '400px', 
                overflowY: 'auto', 
                background: '#FAF9F8', 
                padding: '1.25rem', 
                borderRadius: '12px', 
                border: '1px solid var(--border)',
                fontSize: '0.95rem',
                lineHeight: '1.6',
                color: 'var(--text-main)'
              }}>
                {isStructured ? (
                  <div>
                    {/* Abas internas do visualizador */}
                    <div className="tabs-header" style={{ marginBottom: '1rem', borderBottom: '1px solid #e2e8f0', display: 'flex', gap: '0.35rem', overflowX: 'auto' }}>
                      {planData.plano_semanal.map((d: any) => (
                        <button
                          key={d.dia}
                          type="button"
                          className={`tab-btn ${activeViewDay === d.dia ? 'active' : ''}`}
                          onClick={() => setActiveViewDay(d.dia)}
                          style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                        >
                          {d.dia}
                        </button>
                      ))}
                    </div>

                    {/* Refeições do dia selecionado */}
                    {(() => {
                      const diaAtivo = planData.plano_semanal.find((d: any) => d.dia === activeViewDay);
                      if (!diaAtivo) return <p>Dia não encontrado.</p>;

                      return (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                          {Object.entries(diaAtivo.refeicoes).map(([refeicaoKey, opcoes]: [string, any]) => {
                            const labelRefeicao = refeicaoKey === 'cafe_da_manha' ? '☕ Café da Manhã' :
                                                 refeicaoKey === 'almoco' ? '🍽️ Almoço' :
                                                 refeicaoKey === 'jantar' ? '🌙 Jantar' : refeicaoKey;

                            return (
                              <div key={refeicaoKey} style={{ background: 'white', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--primary)', fontSize: '0.95rem', fontWeight: 700 }}>{labelRefeicao}</h4>
                                <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.9rem' }}>
                                  {opcoes.map((op: string, idx: number) => (
                                    <li key={idx} style={{ marginBottom: '0.25rem' }}>{op}</li>
                                  ))}
                                </ul>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>
                ) : (
                  <div style={{ whiteSpace: 'pre-wrap' }}>
                    {typeof planData === 'string' 
                      ? planData 
                      : JSON.stringify(planData, null, 2)}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button 
                  type="button" 
                  className="btn-primary" 
                  onClick={() => setSelectedPlan(null)}
                  style={{ padding: '0.6rem 1.5rem' }}
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        );
      })()}

    </div>
  );
}
