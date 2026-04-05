import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import { useNavigate } from 'react-router-dom';
import type { Hospital } from '@/services/localStorageService';

const formatCurrency = (value: number) => `₹${value.toFixed(0)}`;
const getDateOnly = (iso: string) => iso.split('T')[0];

const HospitalDashboard = () => {
  const { user, logout } = useAuth();
  const { data, addDepartment, addDoctor } = useData();
  const navigate = useNavigate();
  const hospital = user as Hospital;

  const [tab, setTab] = useState<'overview' | 'departments' | 'doctors'>('overview');
  const [deptName, setDeptName] = useState('');
  const [docForm, setDocForm] = useState({
    name: '',
    email: '',
    password: '',
    specialization: '',
    departmentId: '',
  });

  const departments = data.departments.filter(d => d.hospitalId === hospital.id);
  const doctors = data.doctors.filter(d => d.hospitalId === hospital.id);
  const appointments = data.appointments.filter(a => a.hospitalId === hospital.id);
  const patientIds = new Set(appointments.map(a => a.patientId));

  const appointmentIds = new Set(appointments.map(a => a.id));
  const hospitalBills = data.bills.filter(b => appointmentIds.has(b.appointmentId));
  const paidHospitalBills = hospitalBills.filter(b => b.status === 'paid');
  const today = new Date().toISOString().split('T')[0];

  const todayRevenue = paidHospitalBills
    .filter(b => getDateOnly(b.paidAt || b.date) === today)
    .reduce((sum, b) => sum + (b.totalAmount || b.amount), 0);

  const totalRevenue = paidHospitalBills.reduce((sum, b) => sum + (b.totalAmount || b.amount), 0);

  const last7Days = Array.from({ length: 7 }).map((_, idx) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - idx));
    const key = date.toISOString().split('T')[0];
    const value = paidHospitalBills
      .filter(b => getDateOnly(b.paidAt || b.date) === key)
      .reduce((sum, b) => sum + (b.totalAmount || b.amount), 0);
    return { label: key.slice(5), value };
  });

  const monthlyMap = new Map<string, number>();
  paidHospitalBills.forEach(b => {
    const source = b.paidAt || b.date;
    const monthKey = source.slice(0, 7);
    monthlyMap.set(monthKey, (monthlyMap.get(monthKey) || 0) + (b.totalAmount || b.amount));
  });

  const overallSeries = Array.from(monthlyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([label, value]) => ({ label, value }));

  const todayMax = Math.max(...last7Days.map(item => item.value), 1);
  const overallMax = Math.max(...overallSeries.map(item => item.value), 1);

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

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const tabClass = (t: string) =>
    `px-4 py-2 rounded-lg text-sm font-medium transition ${tab === t ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30 -translate-y-0.5' : 'text-muted-foreground hover:bg-muted'}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-100 via-white to-blue-100">
      <header className="border-b border-white/70 px-6 py-4 flex items-center justify-between sticky top-0 z-10 bg-white/65 backdrop-blur">
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
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { label: 'Doctors', value: doctors.length },
                { label: 'Patients', value: patientIds.size },
                { label: 'Appointments', value: appointments.length },
              ].map(s => (
                <div key={s.label} className="bg-white/90 border border-white rounded-xl p-6 shadow-lg shadow-slate-200/35">
                  <p className="text-sm text-muted-foreground">{s.label}</p>
                  <p className="text-3xl font-bold text-foreground mt-1">{s.value}</p>
                </div>
              ))}
            </div>

            <div className="bg-white/90 border border-white rounded-xl p-6 shadow-xl shadow-emerald-200/30">
              <div className="flex justify-between items-end flex-wrap gap-2 mb-4">
                <h3 className="text-lg font-semibold text-foreground">Revenue Dashboard</h3>
                <div className="flex gap-4 text-sm">
                  <span className="text-emerald-700 font-medium">Today: {formatCurrency(todayRevenue)}</span>
                  <span className="text-blue-700 font-medium">Overall: {formatCurrency(totalRevenue)}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="rounded-xl border border-emerald-100 p-4 bg-emerald-50/50">
                  <p className="text-sm font-medium text-emerald-800 mb-3">Today Revenue Graph (Last 7 Days)</p>
                  <div className="h-40 flex items-end gap-2">
                    {last7Days.map(point => (
                      <div key={point.label} className="flex-1 flex flex-col items-center justify-end gap-2">
                        <div
                          className="w-full rounded-t-md bg-gradient-to-t from-emerald-500 to-teal-300 transition-all duration-500"
                          style={{ height: `${Math.max((point.value / todayMax) * 100, point.value > 0 ? 8 : 2)}%` }}
                          title={`${point.label}: ${formatCurrency(point.value)}`}
                        />
                        <span className="text-[10px] text-emerald-900">{point.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl border border-blue-100 p-4 bg-blue-50/50">
                  <p className="text-sm font-medium text-blue-800 mb-3">Overall Revenue Graph (Last 6 Months)</p>
                  <div className="h-40 flex items-end gap-2">
                    {(overallSeries.length ? overallSeries : [{ label: 'No Data', value: 0 }]).map(point => (
                      <div key={point.label} className="flex-1 flex flex-col items-center justify-end gap-2">
                        <div
                          className="w-full rounded-t-md bg-gradient-to-t from-blue-600 to-indigo-300 transition-all duration-500"
                          style={{ height: `${Math.max((point.value / overallMax) * 100, point.value > 0 ? 8 : 2)}%` }}
                          title={`${point.label}: ${formatCurrency(point.value)}`}
                        />
                        <span className="text-[10px] text-blue-900">{point.label.slice(5)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === 'departments' && (
          <div className="space-y-6">
            <form onSubmit={handleAddDept} className="flex gap-3">
              <input
                value={deptName}
                onChange={e => setDeptName(e.target.value)}
                placeholder="Department name"
                className="flex-1 px-4 py-2.5 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <button type="submit" className="bg-primary text-primary-foreground px-6 py-2.5 rounded-lg font-medium hover:opacity-90 transition">Add</button>
            </form>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {departments.map(d => (
                <div key={d.id} className="bg-white/90 border border-white rounded-xl p-4 flex justify-between items-center shadow-md shadow-slate-200/25">
                  <span className="font-medium text-foreground">{d.name}</span>
                  <span className="text-xs text-muted-foreground">{doctors.filter(doc => doc.departmentId === d.id).length} doctors</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'doctors' && (
          <div className="space-y-6">
            <form onSubmit={handleAddDoctor} className="bg-white/90 border border-white rounded-xl p-6 space-y-4 shadow-xl shadow-blue-200/20">
              <h3 className="font-semibold text-foreground">Add New Doctor</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input value={docForm.name} onChange={e => setDocForm(p => ({ ...p, name: e.target.value }))} placeholder="Doctor name" required
                  className="px-4 py-2.5 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
                <input value={docForm.email} onChange={e => setDocForm(p => ({ ...p, email: e.target.value }))} placeholder="Email" type="email" required
                  className="px-4 py-2.5 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
                <input value={docForm.password} onChange={e => setDocForm(p => ({ ...p, password: e.target.value }))} placeholder="Password" type="password" required
                  className="px-4 py-2.5 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
                <input value={docForm.specialization} onChange={e => setDocForm(p => ({ ...p, specialization: e.target.value }))} placeholder="Specialization" required
                  className="px-4 py-2.5 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
                <select value={docForm.departmentId} onChange={e => setDocForm(p => ({ ...p, departmentId: e.target.value }))} required
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
                  <div key={doc.id} className="bg-white/90 border border-white rounded-xl p-4 flex justify-between items-center shadow-md shadow-slate-200/20">
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
