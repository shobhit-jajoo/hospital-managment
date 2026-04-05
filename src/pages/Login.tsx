import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Activity, CheckCircle2, HeartPulse, Loader2, ShieldCheck, Stethoscope } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loginStage, setLoginStage] = useState<'idle' | 'loading' | 'success'>('idle');
  const [panelExit, setPanelExit] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const navigateWithTransition = (path: string) => {
    const root = document.getElementById('root');
    if (!root) return navigate(path);

    root.classList.add('page-exit');
    setTimeout(() => {
      navigate(path);
      requestAnimationFrame(() => root.classList.remove('page-exit'));
    }, 280);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setLoginStage('loading');

    try {
      const minLoadingDelay = new Promise(resolve => setTimeout(resolve, 1500));
      const role = await login(email, password);
      await minLoadingDelay;

      const destination = role === 'hospital' ? '/hospital' : role === 'doctor' ? '/doctor' : role === 'patient' ? '/patient' : null;
      
      if (!destination) {
        setError('Invalid email or password');
        setLoginStage('idle');
        setLoading(false);
        return;
      }

      setLoginStage('success');
      setTimeout(() => setPanelExit(true), 180);
      setTimeout(() => navigateWithTransition(destination), 760);
    } catch (err) {
      console.error(err);
      setError('An error occurred during login');
      setLoginStage('idle');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen medical-bg app-shell bg-slate-50">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
        <section className="relative hidden lg:flex flex-col justify-between overflow-hidden border-r border-white/20 bg-gradient-to-br from-teal-500 via-sky-500 to-cyan-400 p-12 text-white">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.28),transparent_38%),radial-gradient(circle_at_78%_76%,rgba(255,255,255,0.18),transparent_35%)]" />
          <div className="relative z-10">
            <p className="text-sm uppercase tracking-[0.22em] text-white/80">Hospital Management</p>
            <h1 className="mt-5 text-5xl font-extrabold leading-tight">Compassionate Care, Digitally Refined.</h1>
            <p className="mt-4 max-w-md text-white/85">A premium patient experience with secure access, fast appointment workflows, and modern care visibility.</p>
          </div>

          <div className="relative z-10 grid gap-4">
            {[{ icon: ShieldCheck, text: 'Encrypted patient records' }, { icon: Activity, text: 'Real-time care operations' }, { icon: Stethoscope, text: 'Doctor-ready clinical view' }].map((item, index) => (
              <div key={item.text} className="stagger-item premium-glass flex items-center gap-3 rounded-2xl px-4 py-3 text-sm" style={{ ['--delay' as string]: `${index * 90}ms` }}>
                <item.icon className="h-5 w-5" />
                <span>{item.text}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="flex items-center justify-center p-5 sm:p-10">
          <div className={`auth-panel premium-glass w-full max-w-md rounded-3xl p-8 sm:p-10 ${panelExit ? 'auth-panel-exit' : ''}`}>
            <div className="mb-6 flex items-center gap-3 rounded-2xl border border-cyan-100 bg-cyan-50/70 px-4 py-3">
              <div className="rounded-xl bg-white p-2 text-cyan-700 shadow-sm">
                <HeartPulse className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-700/70">MedCore</p>
                <p className="text-base font-bold text-slate-900">MedCore Health</p>
              </div>
            </div>

            <h2 className="text-3xl font-extrabold text-slate-900">Sign In</h2>
            <p className="mt-1 text-sm text-slate-500">Welcome back to your medical workspace.</p>

            {error && <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div className="floating-field">
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder=" " className="premium-input" />
                <label>Email Address</label>
              </div>
              <div className="floating-field">
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder=" " className="premium-input" />
                <label>Password</label>
              </div>

              <button type="submit" disabled={loading} className="premium-button mt-1 w-full rounded-xl py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-80">
                <span className="login-button-content">
                  {loginStage === 'idle' && 'Login'}
                  {loginStage === 'loading' && (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Authenticating
                    </>
                  )}
                  {loginStage === 'success' && (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      Success
                    </>
                  )}
                </span>
              </button>
            </form>

            <p className="mt-5 text-center text-sm text-slate-500">
              Patient?{' '}
              <Link
                to="/register"
                className="font-semibold text-cyan-700 transition hover:text-cyan-800"
                onClick={e => {
                  e.preventDefault();
                  navigateWithTransition('/register');
                }}
              >
                Register here
              </Link>
            </p>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Login;