import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { HeartPulse, ShieldPlus, Sparkles } from 'lucide-react';

const Register = () => {
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', age: '', gender: 'male' });
  const [error, setError] = useState('');
  const { registerPatient } = useAuth();
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const success = registerPatient({
      name: form.name,
      email: form.email,
      password: form.password,
      phone: form.phone,
      age: parseInt(form.age),
      gender: form.gender,
    });
    if (success) navigateWithTransition('/patient');
    else setError('Email already registered');
  };

  const update = (field: string, value: string) => setForm(p => ({ ...p, [field]: value }));

  return (
    <div className="min-h-screen medical-bg app-shell bg-slate-50">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
        <section className="relative hidden lg:flex flex-col justify-between overflow-hidden border-r border-white/20 bg-gradient-to-br from-sky-600 via-cyan-500 to-teal-500 p-12 text-white">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_18%,rgba(255,255,255,0.28),transparent_38%),radial-gradient(circle_at_80%_80%,rgba(255,255,255,0.18),transparent_34%)]" />
          <div className="relative z-10">
            <p className="text-sm uppercase tracking-[0.22em] text-white/80">Patient Onboarding</p>
            <h1 className="mt-5 text-5xl font-extrabold leading-tight">Start Your Smart Care Journey.</h1>
            <p className="mt-4 max-w-md text-white/85">Create your profile once and access appointments, bills, reports, and prescriptions in one secure portal.</p>
          </div>

          <div className="relative z-10 grid gap-4">
            {[{ icon: ShieldPlus, text: 'Trusted security standards' }, { icon: HeartPulse, text: 'Seamless health tracking' }, { icon: Sparkles, text: 'Elegant modern patient UX' }].map((item, index) => (
              <div key={item.text} className="stagger-item premium-glass flex items-center gap-3 rounded-2xl px-4 py-3 text-sm" style={{ ['--delay' as string]: `${index * 100}ms` }}>
                <item.icon className="h-5 w-5" />
                <span>{item.text}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="flex items-center justify-center p-5 sm:p-10">
          <div className="premium-glass w-full max-w-xl rounded-3xl p-8 sm:p-10">
            <h2 className="text-3xl font-extrabold text-slate-900">Patient Registration</h2>
            <p className="mt-1 text-sm text-slate-500">Create your account in a few details.</p>
            {error && <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div className="floating-field">
                <input type="text" value={form.name} onChange={e => update('name', e.target.value)} required placeholder=" " className="premium-input" />
                <label>Full Name</label>
              </div>
              <div className="floating-field">
                <input type="email" value={form.email} onChange={e => update('email', e.target.value)} required placeholder=" " className="premium-input" />
                <label>Email Address</label>
              </div>
              <div className="floating-field">
                <input type="password" value={form.password} onChange={e => update('password', e.target.value)} required placeholder=" " className="premium-input" />
                <label>Password</label>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="floating-field">
                  <input type="tel" value={form.phone} onChange={e => update('phone', e.target.value)} required placeholder=" " className="premium-input" />
                  <label>Phone Number</label>
                </div>
                <div className="floating-field">
                  <input type="number" value={form.age} onChange={e => update('age', e.target.value)} required placeholder=" " className="premium-input" />
                  <label>Age</label>
                </div>
              </div>

              <div className="floating-field">
                <select value={form.gender} onChange={e => update('gender', e.target.value)} className="premium-input pt-6" required>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
                <label>Gender</label>
              </div>

              <button type="submit" className="premium-button w-full rounded-xl py-3 text-sm font-semibold text-white">
                Register
              </button>
            </form>

            <p className="mt-5 text-center text-sm text-slate-500">
              Already have an account?{' '}
              <Link
                to="/login"
                className="font-semibold text-cyan-700 transition hover:text-cyan-800"
                onClick={e => {
                  e.preventDefault();
                  navigateWithTransition('/login');
                }}
              >
                Login
              </Link>
            </p>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Register;
