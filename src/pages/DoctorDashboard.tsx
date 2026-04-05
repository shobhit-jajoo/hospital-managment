import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import { useNavigate } from 'react-router-dom';
import { getTodayDate, formatDate, formatTime } from '@/utils/timeUtils';
import { updateAppointmentStatus } from '@/services/appointmentService';
import type { Doctor } from '@/services/localStorageService';

const DoctorDashboard = () => {
  const { user, logout } = useAuth();
  const { data, refresh, addPrescription } = useData();
  const navigate = useNavigate();
  const doctor = user as Doctor;

  const [tab, setTab] = useState<'today' | 'recent' | 'prescribe'>('today');
  const [selectedAppt, setSelectedAppt] = useState<string | null>(null);
  const [rxForm, setRxForm] = useState({ medications: '', diagnosis: '', notes: '' });

  const allAppts = data.appointments.filter(a => a.doctorId === doctor.id);
  const todayAppts = allAppts.filter(a => a.date === getTodayDate());
  const recentAppts = allAppts.filter(a => a.date < getTodayDate() || a.status === 'completed');

  const getPatient = (id: string) => data.patients.find(p => p.id === id);

  const handleComplete = (apptId: string) => {
    updateAppointmentStatus(apptId, 'completed');
    refresh();
  };

  const handlePrescribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAppt) return;
    const appt = allAppts.find(a => a.id === selectedAppt);
    if (!appt) return;
    addPrescription({
      appointmentId: selectedAppt,
      patientId: appt.patientId,
      doctorId: doctor.id,
      medications: rxForm.medications,
      diagnosis: rxForm.diagnosis,
      notes: rxForm.notes,
      date: getTodayDate(),
    });
    setRxForm({ medications: '', diagnosis: '', notes: '' });
    setSelectedAppt(null);
    setTab('today');
  };

  const handleLogout = () => { logout(); navigate('/login'); };
  const tabClass = (t: string) =>
    `px-4 py-2 rounded-lg text-sm font-medium transition ${tab === t ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}`;

  const getPatientHistory = (patientId: string) => {
    const appts = data.appointments.filter(a => a.patientId === patientId && a.status === 'completed');
    const rxs = data.prescriptions.filter(p => p.patientId === patientId);
    return { appts, rxs };
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">{doctor.name}</h1>
          <p className="text-sm text-muted-foreground">{doctor.specialization}</p>
        </div>
        <button onClick={handleLogout} className="text-sm text-muted-foreground hover:text-foreground transition">Logout</button>
      </header>

      <div className="max-w-4xl mx-auto p-6">
        <div className="flex gap-2 mb-6">
          <button onClick={() => setTab('today')} className={tabClass('today')}>Today's Appointments</button>
          <button onClick={() => setTab('recent')} className={tabClass('recent')}>Recent</button>
          {selectedAppt && <button onClick={() => setTab('prescribe')} className={tabClass('prescribe')}>Write Prescription</button>}
        </div>

        {tab === 'today' && (
          <div className="space-y-3">
            {todayAppts.length === 0 && <p className="text-muted-foreground text-center py-12">No appointments today</p>}
            {todayAppts.map(appt => {
              const patient = getPatient(appt.patientId);
              const history = getPatientHistory(appt.patientId);
              return (
                <div key={appt.id} className="bg-card border border-border rounded-xl p-5 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-foreground">{patient?.name || 'Unknown'}</p>
                      <p className="text-sm text-muted-foreground">{formatTime(appt.time)} · Age: {patient?.age} · {patient?.gender}</p>
                    </div>
                    <div className="flex gap-2">
                      {appt.status === 'booked' && (
                        <>
                          <button onClick={() => handleComplete(appt.id)}
                            className="text-xs bg-accent text-accent-foreground px-3 py-1.5 rounded-lg hover:opacity-80 transition">Complete</button>
                          <button onClick={() => { setSelectedAppt(appt.id); setTab('prescribe'); }}
                            className="text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded-lg hover:opacity-80 transition">Prescribe</button>
                        </>
                      )}
                      <span className={`text-xs px-3 py-1.5 rounded-full ${appt.status === 'completed' ? 'bg-accent text-accent-foreground' : 'bg-muted text-muted-foreground'}`}>
                        {appt.status}
                      </span>
                    </div>
                  </div>
                  {history.rxs.length > 0 && (
                    <div className="border-t border-border pt-3">
                      <p className="text-xs font-medium text-muted-foreground mb-2">Medical History ({history.rxs.length} records)</p>
                      {history.rxs.slice(-2).map(rx => (
                        <div key={rx.id} className="text-xs text-muted-foreground mb-1">
                          <span className="font-medium">{formatDate(rx.date)}</span>: {rx.diagnosis} — {rx.medications}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {tab === 'recent' && (
          <div className="space-y-3">
            {recentAppts.length === 0 && <p className="text-muted-foreground text-center py-12">No recent appointments</p>}
            {recentAppts.map(appt => {
              const patient = getPatient(appt.patientId);
              return (
                <div key={appt.id} className="bg-card border border-border rounded-xl p-4 flex justify-between items-center">
                  <div>
                    <p className="font-medium text-foreground">{patient?.name}</p>
                    <p className="text-sm text-muted-foreground">{formatDate(appt.date)} · {formatTime(appt.time)}</p>
                  </div>
                  <span className={`text-xs px-3 py-1 rounded-full ${appt.status === 'completed' ? 'bg-accent text-accent-foreground' : 'bg-muted text-muted-foreground'}`}>
                    {appt.status}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {tab === 'prescribe' && selectedAppt && (
          <form onSubmit={handlePrescribe} className="bg-card border border-border rounded-xl p-6 space-y-4">
            <h3 className="font-semibold text-foreground">Write Prescription</h3>
            <p className="text-sm text-muted-foreground">Patient: {getPatient(allAppts.find(a => a.id === selectedAppt)?.patientId || '')?.name}</p>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Diagnosis</label>
              <input value={rxForm.diagnosis} onChange={e => setRxForm(p => ({...p, diagnosis: e.target.value}))} required
                className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Medications</label>
              <textarea value={rxForm.medications} onChange={e => setRxForm(p => ({...p, medications: e.target.value}))} required rows={3}
                className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Notes</label>
              <textarea value={rxForm.notes} onChange={e => setRxForm(p => ({...p, notes: e.target.value}))} rows={2}
                className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <button type="submit" className="bg-primary text-primary-foreground px-6 py-2.5 rounded-lg font-medium hover:opacity-90 transition">Save Prescription</button>
          </form>
        )}
      </div>
    </div>
  );
};

export default DoctorDashboard;
