import { useEffect, useState } from 'react';
import { 
  Loader2, 
  LayoutDashboard, 
  Users, 
  LogOut, 
  User,
  Mail,
  Lock
} from 'lucide-react';
import { supabase } from './lib/supabase';
import Dashboard from './components/Dashboard';
import Pacientes from './components/Pacientes';
import NutricionistaProfile from './components/NutricionistaProfile';
import './App.css';

function App() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Auth Form State
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'error' | 'success', text: string } | null>(null);

  // Layout Navigation State
  const [activeTab, setActiveTab] = useState<'dashboard' | 'pacientes'>('dashboard');
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [showProfileEditor, setShowProfileEditor] = useState(false);

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        fetchUserProfile(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('nutricionistas')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (data) setUserData(data);
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setMessage(null);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        if (password !== confirmPassword) throw new Error('As senhas não coincidem.');
        if (password.length < 6) throw new Error('A senha deve ter no mínimo 6 caracteres.');

        const { data: { user }, error: signUpError } = await supabase.auth.signUp({ email, password });
        if (signUpError) throw signUpError;

        if (user) {
          const { error: dbError } = await supabase
            .from('nutricionistas')
            .insert([{ id: user.id, nome: fullName, email: email }]);
          if (dbError) throw dbError;
          
          setMessage({ type: 'success', text: 'Cadastro realizado! Verifique seu e-mail para confirmar.' });
        }
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUserData(null);
    setActiveTab('dashboard');
    setSelectedPatientId(null);
  };

  const handleNavigateToPatient = (patientId: string) => {
    setSelectedPatientId(patientId);
    setActiveTab('pacientes');
  };

  if (loading) {
    return (
      <div className="auth-container">
        <Loader2 className="animate-spin" size={48} color="var(--primary)" />
      </div>
    );
  }

  // Auth View
  if (!session) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <div className="auth-logo" style={{ marginBottom: '1.5rem', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
              <img src="/logo.png?v=2" alt="In.Nutri" style={{ width: '420px', height: 'auto', backgroundColor: '#ffffff', borderRadius: '16px', padding: '1rem' }} />
            </div>
            <p className="auth-subtitle">{isLogin ? 'Bem vindo' : 'Crie sua conta profissional'}</p>
          </div>

          <form className="auth-form" onSubmit={handleAuth}>
            {message && <div className={message.type === 'error' ? 'error-message' : 'success-message'}>{message.text}</div>}
            
            {!isLogin && (
              <div className="form-group">
                <label className="form-label">Nome Completo</label>
                <div style={{ position: 'relative' }}>
                  <User size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                  <input type="text" className="form-input" placeholder="Seu nome" value={fullName} onChange={(e) => setFullName(e.target.value)} style={{ paddingLeft: '40px' }} required />
                </div>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">E-mail</label>
              <div style={{ position: 'relative' }}>
                <Mail size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                <input type="email" className="form-input" placeholder="exemplo@email.com" value={email} onChange={(e) => setEmail(e.target.value)} style={{ paddingLeft: '40px' }} required />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Senha</label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                <input type="password" className="form-input" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} style={{ paddingLeft: '40px' }} required />
              </div>
            </div>

            {!isLogin && (
              <div className="form-group">
                <label className="form-label">Confirmar Senha</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                  <input type="password" className="form-input" placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} style={{ paddingLeft: '40px' }} required />
                </div>
              </div>
            )}

            <button className="btn-auth" type="submit" disabled={authLoading}>
              {authLoading ? <Loader2 className="animate-spin" size={20} /> : (isLogin ? 'Entrar' : 'Criar conta')}
            </button>
          </form>

          <div className="auth-footer">
            {isLogin ? (
              <>Não tem conta?<span className="auth-link" onClick={() => setIsLogin(false)}>Cadastre-se</span></>
            ) : (
              <>Já tem conta?<span className="auth-link" onClick={() => setIsLogin(true)}>Faça login</span></>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Dashboard View
  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="logo-area" style={{ flexDirection: 'column', alignItems: 'center', gap: '0.25rem', marginBottom: '2rem' }}>
          <img src="/logo.png?v=2" alt="In.Nutri" style={{ width: '100%', maxWidth: '280px', height: 'auto', backgroundColor: '#ffffff', borderRadius: '12px', padding: '0.5rem' }} />
        </div>
        <nav className="nav-links">
          <button 
            onClick={() => { setActiveTab('dashboard'); setSelectedPatientId(null); }} 
            className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
          >
            <LayoutDashboard size={20} /> Dashboard
          </button>
          <button 
            onClick={() => { setActiveTab('pacientes'); setSelectedPatientId(null); }} 
            className={`nav-item ${activeTab === 'pacientes' ? 'active' : ''}`}
          >
            <Users size={20} /> Pacientes
          </button>
        </nav>
        <div className="nav-links" style={{ marginTop: 'auto', borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
          <button onClick={handleLogout} className="nav-item" style={{ color: '#c53030' }}>
            <LogOut size={20} /> Sair
          </button>
        </div>
      </aside>

      <main className="main-content">
        <header className="header">
          <div>
            <h1>Olá, {userData?.nome || 'Nutricionista'}</h1>
            <p style={{ color: 'var(--text-muted)' }}>
              {activeTab === 'dashboard' ? 'Bem vinda' : 'Gerenciamento de pacientes.'}
            </p>
          </div>
          <button className="btn-outline" onClick={() => setShowProfileEditor(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
            <User size={20} color="var(--primary)" />
            <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{userData?.nome || 'Perfil'}</span>
          </button>
        </header>

        {activeTab === 'dashboard' ? (
          <Dashboard 
            userId={session.user.id} 
            onNavigateToPatient={handleNavigateToPatient} 
          />
        ) : (
          <Pacientes 
            userId={session.user.id} 
            initialSelectedPatientId={selectedPatientId}
            onClearSelection={() => setSelectedPatientId(null)}
          />
        )}

        {showProfileEditor && (
          <NutricionistaProfile 
            userData={userData}
            onClose={() => setShowProfileEditor(false)}
            onUpdate={() => fetchUserProfile(session.user.id)}
          />
        )}
      </main>
    </div>
  );
}

export default App;
