import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import { useNavigate } from 'react-router-dom';
import type { Hospital } from '@/services/localStorageService';

const HospitalDashboard = () => {
  const { user, logout } = useAuth();
  const { data, refresh, addDepartment, addDoctor } = useData();
  const navigate = useNavigate();
  const hospital = user as Hospital;

  const [tab, setTab] = useState<'overview' | 'departments' | 'doctors'>('overview');
  const [deptName, setDeptName] = useState('');
  const [docForm, setDocForm] = useState({ name: '', email: '', password: '', specialization: '', departmentId: '' });

  const departments = data.departments.filter(d => d.hospitalId === hospital.id);
  const doctors = data.doctors.filter(d => d.hospitalId === hospital.id);
  const appointments = data.appointments.filter(a => a.hospitalId === hospital.id);
  const patientIds = new Set(appointments.map(a => a.patientId));

  const handleAddDept = (e: React.FormEvent) => {
    e.preventDefault();
    if (!deptName.trim()) return;
    addDepartment({ hospitalId: hospital.id, name: deptName.trim() });
    setDeptName('');
  };

  const handleAddDoctor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!docForm.departmentId) return;
    addDoctor({ ...docForm, hospitalId: hospital.id });
    setDocForm({ name: '', email: '', password: '', specialization: '', departmentId: '' });
  };

  const handleLogout = () => { logout(); navigate('/login'); };

  const tabClass = (t: string) =>
    `px-4 py-2 rounded-lg text-sm font-medium transition ${tab === t ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}`;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">{hospital.name}</h1>
          <p className="text-sm text-muted-foreground">Hospital Dashboard</p>
        </div>
        <button onClick={handleLogout} className="text-sm text-muted-foreground hover:text-foreground transition">Logout</button>
      </header>

      <div className="max-w-5xl mx-auto p-6">
        <div className="flex gap-2 mb-6">
          <button onClick={() => setTab('overview')} className={tabClass('overview')}>Overview</button>
          <button onClick={() => setTab('departments')} className={tabClass('departments')}>Departments</button>
          <button onClick={() => setTab('doctors')} className={tabClass('doctors')}>Doctors</button>
        </div>

        {tab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { label: 'Doctors', value: doctors.length },
              { label: 'Patients', value: patientIds.size },
              { label: 'Appointments', value: appointments.length },
            ].map(s => (
              <div key={s.label} className="bg-card border border-border rounded-xl p-6">
                <p className="text-sm text-muted-foreground">{s.label}</p>
                <p className="text-3xl font-bold text-foreground mt-1">{s.value}</p>
              </div>
            ))}
          </div>
        )}

        {tab === 'departments' && (
          <div className="space-y-6">
            <form onSubmit={handleAddDept} className="flex gap-3">
              <input value={deptName} onChange={e => setDeptName(e.target.value)} placeholder="Department name"
                className="flex-1 px-4 py-2.5 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
              <button type="submit" className="bg-primary text-primary-foreground px-6 py-2.5 rounded-lg font-medium hover:opacity-90 transition">Add</button>
            </form>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {departments.map(d => (
                <div key={d.id} className="bg-card border border-border rounded-xl p-4 flex justify-between items-center">
                  <span className="font-medium text-foreground">{d.name}</span>
                  <span className="text-xs text-muted-foreground">{doctors.filter(doc => doc.departmentId === d.id).length} doctors</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'doctors' && (
          <div className="space-y-6">
            <form onSubmit={handleAddDoctor} className="bg-card border border-border rounded-xl p-6 space-y-4">
              <h3 className="font-semibold text-foreground">Add New Doctor</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input value={docForm.name} onChange={e => setDocForm(p => ({...p, name: e.target.value}))} placeholder="Doctor name" required
                  className="px-4 py-2.5 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
                <input value={docForm.email} onChange={e => setDocForm(p => ({...p, email: e.target.value}))} placeholder="Email" type="email" required
                  className="px-4 py-2.5 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
                <input value={docForm.password} onChange={e => setDocForm(p => ({...p, password: e.target.value}))} placeholder="Password" type="password" required
                  className="px-4 py-2.5 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
                <input value={docForm.specialization} onChange={e => setDocForm(p => ({...p, specialization: e.target.value}))} placeholder="Specialization" required
                  className="px-4 py-2.5 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
                <select value={docForm.departmentId} onChange={e => setDocForm(p => ({...p, departmentId: e.target.value}))} required
                  className="px-4 py-2.5 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary">
                  <option value="">Select Department</option>
                  {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <button type="submit" className="bg-primary text-primary-foreground px-6 py-2.5 rounded-lg font-medium hover:opacity-90 transition">Add Doctor</button>
            </form>
            <div className="space-y-3">
              {doctors.map(doc => {
                const dept = departments.find(d => d.id === doc.departmentId);
                return (
                  <div key={doc.id} className="bg-card border border-border rounded-xl p-4 flex justify-between items-center">
                    <div>
                      <p className="font-medium text-foreground">{doc.name}</p>
                      <p className="text-sm text-muted-foreground">{doc.specialization}</p>
                    </div>
                    <span className="text-xs bg-muted text-muted-foreground px-3 py-1 rounded-full">{dept?.name}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HospitalDashboard;
