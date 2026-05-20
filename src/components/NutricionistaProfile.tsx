import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Loader2, Save, User, X } from 'lucide-react';

interface NutricionistaProfileProps {
  userData: any;
  onClose: () => void;
  onUpdate: () => void;
}

export default function NutricionistaProfile({ userData, onClose, onUpdate }: NutricionistaProfileProps) {
  const [nome, setNome] = useState(userData?.nome || '');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'error' | 'success', text: string } | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const { error } = await supabase
        .from('nutricionistas')
        .update({ nome })
        .eq('id', userData.id);

      if (error) throw error;

      setMessage({ type: 'success', text: 'Perfil atualizado com sucesso!' });
      onUpdate();
      
      // Fecha o modal após 1.5s
      setTimeout(() => {
        onClose();
      }, 1500);
      
    } catch (error: any) {
      console.error('Erro ao atualizar perfil:', error);
      setMessage({ type: 'error', text: 'Erro ao atualizar. Tente novamente.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-card" style={{ maxWidth: '400px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.25rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <User size={20} color="var(--primary)" /> Meu Perfil
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {message && (
            <div className={message.type === 'error' ? 'error-message' : 'success-message'} style={{ marginBottom: 0 }}>
              {message.text}
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Nome de Exibição</label>
            <input 
              type="text" 
              className="form-input" 
              value={nome} 
              onChange={e => setNome(e.target.value)} 
              required 
            />
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              Este é o nome que aparece no cabeçalho do painel.
            </span>
          </div>

          <div className="form-group">
            <label className="form-label">E-mail de Login</label>
            <input 
              type="email" 
              className="form-input input-readonly" 
              value={userData?.email || ''} 
              readOnly 
              tabIndex={-1}
            />
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              Por segurança, o e-mail não pode ser alterado por aqui.
            </span>
          </div>

          <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: '1rem', justifyContent: 'center' }}>
            {loading ? <Loader2 className="animate-spin" size={20} /> : <><Save size={20} /> Salvar Alterações</>}
          </button>
        </form>
      </div>
    </div>
  );
}
