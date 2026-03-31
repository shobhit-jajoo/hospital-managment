import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

const Register = () => {
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', age: '', gender: 'male' });
  const [error, setError] = useState('');
  const { registerPatient } = useAuth();
  const navigate = useNavigate();

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
    if (success) navigate('/patient');
    else setError('Email already registered');
  };

  const update = (field: string, value: string) => setForm(p => ({ ...p, [field]: value }));

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md bg-card border border-border rounded-xl p-8 shadow-lg">
        <h1 className="text-2xl font-bold text-foreground mb-2">Patient Registration</h1>
        <p className="text-muted-foreground mb-6 text-sm">Create your account</p>
        {error && <p className="text-destructive text-sm mb-4 bg-destructive/10 p-3 rounded-lg">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Full Name</label>
            <input type="text" value={form.name} onChange={e => update('name', e.target.value)} required
              className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Email</label>
            <input type="email" value={form.email} onChange={e => update('email', e.target.value)} required
              className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Password</label>
            <input type="password" value={form.password} onChange={e => update('password', e.target.value)} required
              className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Phone</label>
              <input type="tel" value={form.phone} onChange={e => update('phone', e.target.value)} required
                className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Age</label>
              <input type="number" value={form.age} onChange={e => update('age', e.target.value)} required
                className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Gender</label>
            <select value={form.gender} onChange={e => update('gender', e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary">
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
          <button type="submit" className="w-full bg-primary text-primary-foreground py-2.5 rounded-lg font-medium hover:opacity-90 transition">
            Register
          </button>
        </form>
        <p className="mt-4 text-sm text-muted-foreground text-center">
          Already have an account? <Link to="/login" className="text-primary font-medium hover:underline">Login</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
