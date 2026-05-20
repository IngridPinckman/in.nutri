import { useState, useMemo, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { ArrowLeft, Loader2, Save } from 'lucide-react';
import './Pacientes.css';

interface PatientFormProps {
  userId: string;
  editPatientId?: string | null;
  onCancel: () => void;
  onSuccess: (newPatientId: string) => void;
}

const OBJETIVOS_OPCOES = ['Emagrecer', 'Ganhar massa', 'Controlar diabetes', 'Saúde geral', 'Performance esportiva', 'Reeducação alimentar'];
const NIVEIS_ATIVIDADE = ['Sedentário', 'Levemente ativo', 'Moderadamente ativo', 'Muito ativo', 'Extremamente ativo'];
const PATOLOGIAS_OPCOES = ['Diabetes', 'Hipertensão', 'Hipotireoidismo', 'Hipertireoidismo', 'Síndrome do ovário policístico', 'Doença celíaca', 'Colesterol alto'];
const RESTRICOES_OPCOES = ['Lactose', 'Glúten', 'Açúcar', 'Carne vermelha', 'Frutos do mar'];
const ALERGIAS_OPCOES = ['Amendoim', 'Leite', 'Ovo', 'Soja', 'Trigo', 'Frutos do mar'];

export default function PatientForm({ userId, editPatientId, onCancel, onSuccess }: PatientFormProps) {
  const [activeTab, setActiveTab] = useState<'pessoal' | 'clinico' | 'habitos'>('pessoal');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(!!editPatientId);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // ABA 1 - Pessoal
  const [nome, setNome] = useState('');
  const [dataNascimento, setDataNascimento] = useState('');
  const [sexo, setSexo] = useState('');
  const [telefone, setTelefone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');

  // ABA 2 - Clínico
  const [peso, setPeso] = useState('');
  const [altura, setAltura] = useState('');
  const [objetivos, setObjetivos] = useState<string[]>([]);
  const [objetivoOutro, setObjetivoOutro] = useState('');
  const [nivelAtividade, setNivelAtividade] = useState('');
  
  const [patologias, setPatologias] = useState<string[]>([]);
  const [patologiaOutro, setPatologiaOutro] = useState('');
  
  const [restricoes, setRestricoes] = useState<string[]>([]);
  const [restricaoOutro, setRestricaoOutro] = useState('');
  
  const [alergias, setAlergias] = useState<string[]>([]);
  const [alergiaOutro, setAlergiaOutro] = useState('');
  
  const [medicamentos, setMedicamentos] = useState('');
  const [suplementos, setSuplementos] = useState('');

  // ABA 3 - Hábitos
  const [refeicoesDia, setRefeicoesDia] = useState('');
  const [horarioAcorda, setHorarioAcorda] = useState('');
  const [horarioDorme, setHorarioDorme] = useState('');
  const [aguaDia, setAguaDia] = useState('');
  const [praticaAtividade, setPraticaAtividade] = useState<'sim' | 'nao' | ''>('');
  const [atividadeDetalhes, setAtividadeDetalhes] = useState('');
  const [observacoesGerais, setObservacoesGerais] = useState('');

  useEffect(() => {
    if (editPatientId) {
      loadPatientData();
    }
  }, [editPatientId]);

  const loadPatientData = async () => {
    try {
      const { data, error } = await supabase
        .from('pacientes')
        .select('*')
        .eq('id', editPatientId)
        .single();
        
      if (error) throw error;
      if (data) {
        setNome(data.nome || '');
        setDataNascimento(data.data_nascimento || '');
        setSexo(data.sexo || '');
        setTelefone(data.telefone || '');
        setWhatsapp(data.whatsapp || '');
        setEmail(data.email || '');

        const dc = data.dados_clinicos || {};
        setPeso(dc.peso?.toString() || '');
        setAltura(dc.altura?.toString() || '');
        setNivelAtividade(dc.nivel_atividade || '');
        setMedicamentos(dc.medicamentos || '');
        setSuplementos(dc.suplementos || '');
        setObservacoesGerais(dc.observacoes_gerais || '');

        // Extract predefined options and custom input for Objectives
        const objs = dc.objetivos || [];
        setObjetivos(objs.filter((o: string) => OBJETIVOS_OPCOES.includes(o)));
        const oOutro = objs.find((o: string) => !OBJETIVOS_OPCOES.includes(o));
        if (oOutro) setObjetivoOutro(oOutro);

        const pats = dc.patologias || [];
        if (pats.includes('Nenhum')) setPatologias(['Nenhum']);
        else {
          setPatologias(pats.filter((p: string) => PATOLOGIAS_OPCOES.includes(p)));
          const pOutro = pats.find((p: string) => !PATOLOGIAS_OPCOES.includes(p) && p !== 'Nenhum');
          if (pOutro) setPatologiaOutro(pOutro);
        }

        const rests = dc.restricoes || [];
        if (rests.includes('Nenhum')) setRestricoes(['Nenhum']);
        else {
          setRestricoes(rests.filter((r: string) => RESTRICOES_OPCOES.includes(r)));
          const rOutro = rests.find((r: string) => !RESTRICOES_OPCOES.includes(r) && r !== 'Nenhum');
          if (rOutro) setRestricaoOutro(rOutro);
        }

        const alergs = dc.alergias || [];
        if (alergs.includes('Nenhum')) setAlergias(['Nenhum']);
        else {
          setAlergias(alergs.filter((a: string) => ALERGIAS_OPCOES.includes(a)));
          const aOutro = alergs.find((a: string) => !ALERGIAS_OPCOES.includes(a) && a !== 'Nenhum');
          if (aOutro) setAlergiaOutro(aOutro);
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
      }
    } catch (err) {
      console.error('Erro ao carregar paciente:', err);
      setErrorMsg('Não foi possível carregar os dados do paciente.');
    } finally {
      setInitialLoading(false);
    }
  };

  // Cálculos Automáticos
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
    const a = parseFloat(altura) / 100; // cm para metros
    if (p > 0 && a > 0) {
      return (p / (a * a)).toFixed(2);
    }
    return '';
  }, [peso, altura]);

  const imcStatus = useMemo(() => {
    if (!imc) return null;
    const v = parseFloat(imc);
    if (v < 18.5) return { text: 'Abaixo do peso', color: '#D69E2E' };
    if (v >= 18.5 && v <= 24.9) return { text: 'Peso ideal', color: '#38A169' };
    if (v >= 25 && v <= 29.9) return { text: 'Acima do peso', color: '#DD6B20' };
    return { text: 'Obesidade', color: '#E53E3E' };
  }, [imc]);

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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) {
      setErrorMsg('O nome completo é obrigatório.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    // Montar o JSON com dados clínicos
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
      const payload = {
        nome,
        email: email || null,
        telefone: telefone || null,
        whatsapp: whatsapp || null,
        data_nascimento: dataNascimento || null,
        sexo: sexo || null,
        dados_clinicos: dadosClinicos,
        nutricionista_id: userId
      };

      let response;
      if (editPatientId) {
        response = await supabase
          .from('pacientes')
          .update(payload)
          .eq('id', editPatientId)
          .select()
          .single();
      } else {
        response = await supabase
          .from('pacientes')
          .insert([payload])
          .select()
          .single();
      }

      if (response.error) {
        if (response.error.message.includes('dados_clinicos')) {
          throw new Error('A coluna "dados_clinicos" (tipo JSONB) ou "whatsapp", "sexo" ainda não foram criadas no banco de dados.');
        }
        throw response.error;
      }

      onSuccess(response.data.id);
    } catch (err: any) {
      console.error('Erro ao salvar paciente:', err);
      setErrorMsg(err.message || 'Erro inesperado ao salvar paciente.');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="dashboard-loading">
        <Loader2 className="animate-spin" size={40} color="var(--primary)" />
        <p>Carregando dados para edição...</p>
      </div>
    );
  }

  return (
    <div className="card" style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <button className="btn-outline" onClick={onCancel} style={{ padding: '0.5rem', border: 'none', background: 'transparent' }}>
          <ArrowLeft size={20} color="var(--primary)" />
        </button>
        <h2 style={{ fontSize: '1.5rem', color: 'var(--text-main)', margin: 0 }}>
          {editPatientId ? 'Editar Paciente' : 'Cadastrar Novo Paciente'}
        </h2>
      </div>

      {errorMsg && (
        <div className="error-message" style={{ marginBottom: '1.5rem' }}>{errorMsg}</div>
      )}

      {/* TABS */}
      <div className="tabs-header">
        <button 
          type="button"
          className={`tab-btn ${activeTab === 'pessoal' ? 'active' : ''}`}
          onClick={() => setActiveTab('pessoal')}
        >
          1. Pessoal
        </button>
        <button 
          type="button"
          className={`tab-btn ${activeTab === 'clinico' ? 'active' : ''}`}
          onClick={() => setActiveTab('clinico')}
        >
          2. Clínico
        </button>
        <button 
          type="button"
          className={`tab-btn ${activeTab === 'habitos' ? 'active' : ''}`}
          onClick={() => setActiveTab('habitos')}
        >
          3. Hábitos
        </button>
      </div>

      <form onSubmit={handleSave} className="form-container">
        
        {/* ABA PESSOAL */}
        <div style={{ display: activeTab === 'pessoal' ? 'block' : 'none' }}>
          <div className="form-grid">
            <div className="form-group form-full-width">
              <label className="form-label">Nome Completo <span style={{ color: '#E53E3E' }}>*</span></label>
              <input type="text" className="form-input" value={nome} onChange={e => setNome(e.target.value)} placeholder="Nome do paciente" required />
            </div>

            <div className="form-group">
              <label className="form-label">Data de Nascimento</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input type="date" className="form-input" style={{ flex: 1 }} value={dataNascimento} onChange={e => setDataNascimento(e.target.value)} />
                <input type="text" className="form-input input-readonly" style={{ width: '80px', textAlign: 'center' }} value={idade ? `${idade} anos` : ''} placeholder="Idade" readOnly tabIndex={-1} />
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
              <label className="form-label">Telefone</label>
              <input type="tel" className="form-input" value={telefone} onChange={e => setTelefone(e.target.value)} placeholder="(00) 0000-0000" />
            </div>

            <div className="form-group">
              <label className="form-label">WhatsApp</label>
              <input type="tel" className="form-input" value={whatsapp} onChange={e => setWhatsapp(e.target.value)} placeholder="(00) 90000-0000" />
            </div>

            <div className="form-group form-full-width">
              <label className="form-label">E-mail</label>
              <input type="email" className="form-input" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@exemplo.com" />
            </div>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2rem' }}>
            <button type="button" className="btn-primary" onClick={() => setActiveTab('clinico')}>
              Próxima Etapa <ChevronRightIcon />
            </button>
          </div>
        </div>

        {/* ABA CLÍNICO */}
        <div style={{ display: activeTab === 'clinico' ? 'block' : 'none' }}>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Peso Atual</label>
              <div className="input-with-suffix">
                <input type="number" step="0.1" className="form-input" value={peso} onChange={e => setPeso(e.target.value)} placeholder="0.0" />
                <span className="input-suffix">kg</span>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Altura</label>
              <div className="input-with-suffix">
                <input type="number" className="form-input" value={altura} onChange={e => setAltura(e.target.value)} placeholder="170" />
                <span className="input-suffix">cm</span>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">IMC Calculado</label>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <input type="text" className="form-input input-readonly" style={{ flex: 1 }} value={imc} readOnly placeholder="Automático" tabIndex={-1} />
                {imcStatus && (
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: imcStatus.color, whiteSpace: 'nowrap' }}>
                    {imcStatus.text}
                  </span>
                )}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Nível de Atividade Física</label>
              <select className="form-input" value={nivelAtividade} onChange={e => setNivelAtividade(e.target.value)}>
                <option value="">Selecione...</option>
                {NIVEIS_ATIVIDADE.map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>

            {/* Objetivos */}
            <div className="form-group form-full-width" style={{ marginTop: '1rem' }}>
              <label className="form-label">Objetivo Principal</label>
              <div className="chips-container">
                {OBJETIVOS_OPCOES.map(obj => (
                  <div key={obj} className={`chip ${objetivos.includes(obj) ? 'selected' : ''}`} onClick={() => toggleArrayItem(setObjetivos, objetivos, obj)}>
                    {obj}
                  </div>
                ))}
                <input type="text" className="form-input" style={{ width: '100%', marginTop: '0.5rem' }} placeholder="Outro objetivo... (digite aqui)" value={objetivoOutro} onChange={e => setObjetivoOutro(e.target.value)} />
              </div>
            </div>

            {/* Patologias */}
            <div className="form-group form-full-width" style={{ marginTop: '1rem' }}>
              <label className="form-label">Patologias ou Condições de Saúde</label>
              <div className="chips-container">
                <div className={`chip ${patologias.includes('Nenhum') ? 'selected' : ''}`} onClick={() => toggleArrayItem(setPatologias, patologias, 'Nenhum')}>Nenhuma</div>
                {PATOLOGIAS_OPCOES.map(pat => (
                  <div key={pat} className={`chip ${patologias.includes(pat) ? 'selected' : ''}`} onClick={() => toggleArrayItem(setPatologias, patologias, pat)}>
                    {pat}
                  </div>
                ))}
                <input type="text" className="form-input" style={{ width: '100%', marginTop: '0.5rem' }} placeholder="Outra patologia..." value={patologiaOutro} onChange={e => setPatologiaOutro(e.target.value)} />
              </div>
            </div>

            {/* Restrições e Alergias */}
            <div className="form-group">
              <label className="form-label">Restrições Alimentares</label>
              <div className="chips-container">
                <div className={`chip ${restricoes.includes('Nenhum') ? 'selected' : ''}`} onClick={() => toggleArrayItem(setRestricoes, restricoes, 'Nenhum')}>Nenhuma</div>
                {RESTRICOES_OPCOES.map(res => (
                  <div key={res} className={`chip ${restricoes.includes(res) ? 'selected' : ''}`} onClick={() => toggleArrayItem(setRestricoes, restricoes, res)}>{res}</div>
                ))}
              </div>
              <input type="text" className="form-input" style={{ marginTop: '0.5rem' }} placeholder="Outras restrições..." value={restricaoOutro} onChange={e => setRestricaoOutro(e.target.value)} />
            </div>

            <div className="form-group">
              <label className="form-label">Alergias Alimentares</label>
              <div className="chips-container">
                <div className={`chip ${alergias.includes('Nenhum') ? 'selected' : ''}`} onClick={() => toggleArrayItem(setAlergias, alergias, 'Nenhum')}>Nenhuma</div>
                {ALERGIAS_OPCOES.map(alg => (
                  <div key={alg} className={`chip ${alergias.includes(alg) ? 'selected' : ''}`} onClick={() => toggleArrayItem(setAlergias, alergias, alg)}>{alg}</div>
                ))}
              </div>
              <input type="text" className="form-input" style={{ marginTop: '0.5rem' }} placeholder="Outras alergias..." value={alergiaOutro} onChange={e => setAlergiaOutro(e.target.value)} />
            </div>

            <div className="form-group">
              <label className="form-label">Medicamentos Contínuos</label>
              <textarea className="form-input" rows={3} value={medicamentos} onChange={e => setMedicamentos(e.target.value)} placeholder="Liste os medicamentos..."></textarea>
            </div>

            <div className="form-group">
              <label className="form-label">Suplementos em uso</label>
              <textarea className="form-input" rows={3} value={suplementos} onChange={e => setSuplementos(e.target.value)} placeholder="Whey, Creatina, Ômega 3..."></textarea>
            </div>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem' }}>
            <button type="button" className="btn-outline" onClick={() => setActiveTab('pessoal')}>Voltar</button>
            <button type="button" className="btn-primary" onClick={() => setActiveTab('habitos')}>Próxima Etapa <ChevronRightIcon /></button>
          </div>
        </div>

        {/* ABA HÁBITOS */}
        <div style={{ display: activeTab === 'habitos' ? 'block' : 'none' }}>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Refeições por dia</label>
              <input type="number" className="form-input" value={refeicoesDia} onChange={e => setRefeicoesDia(e.target.value)} placeholder="Ex: 4" />
            </div>

            <div className="form-group">
              <label className="form-label">Água por dia</label>
              <div className="input-with-suffix">
                <input type="number" step="0.1" className="form-input" value={aguaDia} onChange={e => setAguaDia(e.target.value)} placeholder="Ex: 2.5" />
                <span className="input-suffix">litros</span>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Horário que acorda</label>
              <input type="text" className="form-input" value={horarioAcorda} onChange={e => setHorarioAcorda(e.target.value)} onBlur={() => setHorarioAcorda(formatTimeInput(horarioAcorda))} placeholder="Ex: 6 ou 630" />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>O sistema formata para HH:MM</span>
            </div>

            <div className="form-group">
              <label className="form-label">Horário que dorme</label>
              <input type="text" className="form-input" value={horarioDorme} onChange={e => setHorarioDorme(e.target.value)} onBlur={() => setHorarioDorme(formatTimeInput(horarioDorme))} placeholder="Ex: 23 ou 2230" />
            </div>

            <div className="form-group form-full-width" style={{ marginTop: '1rem' }}>
              <label className="form-label">Pratica Atividade Física?</label>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input type="radio" name="praticaAtiv" checked={praticaAtividade === 'sim'} onChange={() => setPraticaAtividade('sim')} /> Sim
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input type="radio" name="praticaAtiv" checked={praticaAtividade === 'nao'} onChange={() => { setPraticaAtividade('nao'); setAtividadeDetalhes(''); }} /> Não
                </label>
              </div>
              {praticaAtividade === 'sim' && (
                <input type="text" className="form-input" style={{ marginTop: '1rem' }} placeholder="Qual atividade e qual a frequência semanal?" value={atividadeDetalhes} onChange={e => setAtividadeDetalhes(e.target.value)} />
              )}
            </div>

            <div className="form-group form-full-width">
              <label className="form-label">Observações Gerais Livres</label>
              <textarea className="form-input" rows={4} value={observacoesGerais} onChange={e => setObservacoesGerais(e.target.value)} placeholder="Informações adicionais importantes..."></textarea>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '3rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)' }}>
            <button type="button" className="btn-outline" onClick={() => setActiveTab('clinico')}>Voltar</button>
            <button type="submit" className="btn-primary" disabled={loading} style={{ padding: '0.8rem 2rem', fontSize: '1.05rem' }}>
              {loading ? <Loader2 className="animate-spin" size={20} /> : <><Save size={20} /> {editPatientId ? 'Salvar Alterações' : 'Finalizar Cadastro'}</>}
            </button>
          </div>
        </div>

      </form>
    </div>
  );
}

// Icone helper para manter os imports menores
function ChevronRightIcon() {
  return <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>;
}
