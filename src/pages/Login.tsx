import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false); // Added loading state
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Add 'await' to wait for the Promise to resolve
      const role = await login(email, password);
      
      if (role === 'hospital') navigate('/hospital');
      else if (role === 'doctor') navigate('/doctor');
      else if (role === 'patient') navigate('/patient');
      else setError('Invalid email or password');
    } catch (err) {
      console.error(err);
      setError('An error occurred during login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md bg-card border border-border rounded-xl p-8 shadow-lg">
        <h1 className="text-2xl font-bold text-foreground mb-2">Sign In</h1>
        <p className="text-muted-foreground mb-6 text-sm">Hospital Management System</p>
        
        {error && <p className="text-destructive text-sm mb-4 bg-destructive/10 p-3 rounded-lg">{error}</p>}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
              className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
              className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-primary text-primary-foreground py-2.5 rounded-lg font-medium hover:opacity-90 transition disabled:opacity-50"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        
        <p className="mt-4 text-sm text-muted-foreground text-center">
          Patient? <Link to="/register" className="text-primary font-medium hover:underline">Register here</Link>
        </p>
        
        
      </div>
    </div>
  );
};

export default Login;