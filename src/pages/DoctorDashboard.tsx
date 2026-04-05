import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import { useNavigate } from 'react-router-dom';
import { getTodayDate, formatDate, formatTime } from '@/utils/timeUtils';
import { updateAppointmentStatus } from '@/services/appointmentService';
import type { Doctor } from '@/services/localStorageService';
import { CalendarCheck2, ClipboardPlus, FileText, History, ScrollText } from 'lucide-react';

const DoctorDashboard = () => {
  const { user, logout } = useAuth();
  const { data, refresh, addPrescription, addMedicalReport } = useData();
  const navigate = useNavigate();
  const doctor = user as Doctor;

  const [tab, setTab] = useState<'today' | 'recent' | 'prescribe' | 'prescriptions' | 'reports'>('today');
  const [selectedAppt, setSelectedAppt] = useState<string | null>(null);
  const [rxForm, setRxForm] = useState({ medications: '', diagnosis: '', notes: '' });
  const [reportForm, setReportForm] = useState({ earlyDisease: '', treatmentDone: '', remarks: '' });

  const tabs = [
    { id: 'today', label: "Today's Appointments", icon: CalendarCheck2 },
    { id: 'recent', label: 'Recent', icon: History },
    { id: 'prescriptions', label: 'Prescriptions', icon: ScrollText },
    { id: 'reports', label: 'Reports', icon: FileText },
    ...(selectedAppt ? [{ id: 'prescribe', label: 'Write Prescription', icon: ClipboardPlus }] : []),
  ] as const;

  const currentTabIndex = tabs.findIndex(t => t.id === tab);

  const allAppts = data.appointments.filter(a => a.doctorId === doctor.id);
  const todayAppts = allAppts.filter(a => a.date === getTodayDate());
  const recentAppts = allAppts.filter(a => a.date < getTodayDate() || a.status === 'completed');
  const doctorPrescriptions = data.prescriptions.filter(p => p.doctorId === doctor.id);
  const doctorReports = data.medicalReports.filter(r => r.doctorId === doctor.id);

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

  const handleCreateReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAppt) return;
    const appt = allAppts.find(a => a.id === selectedAppt);
    if (!appt) return;

    addMedicalReport({
      appointmentId: selectedAppt,
      patientId: appt.patientId,
      doctorId: doctor.id,
      hospitalId: appt.hospitalId,
      earlyDisease: reportForm.earlyDisease,
      treatmentDone: reportForm.treatmentDone,
      remarks: reportForm.remarks,
      date: getTodayDate(),
    });

    setReportForm({ earlyDisease: '', treatmentDone: '', remarks: '' });
    setSelectedAppt(null);
    setTab('reports');
  };

  const navigateWithTransition = (path: string) => {
    const root = document.getElementById('root');
    if (!root) return navigate(path);

    root.classList.add('page-exit');
    setTimeout(() => {
      navigate(path);
      requestAnimationFrame(() => root.classList.remove('page-exit'));
    }, 280);
  };

  const handleLogout = () => { logout(); navigateWithTransition('/login'); };
  const tabClass = (t: string) =>
    `relative z-10 flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-300 ${tab === t ? 'text-white' : 'text-slate-600 hover:text-slate-900'}`;

  const getPatientHistory = (patientId: string) => {
    const appts = data.appointments.filter(a => a.patientId === patientId && a.status === 'completed');
    const rxs = data.prescriptions.filter(p => p.patientId === patientId);
    const reports = data.medicalReports.filter(r => r.patientId === patientId);
    return { appts, rxs, reports };
  };

  return (
    <div className="medical-bg app-shell min-h-screen bg-slate-50">
      <header className="premium-glass sticky top-0 z-20 flex items-center justify-between border-b border-white/80 px-6 py-4">
        <div>
          <h1 className="stagger-item text-xl font-bold text-slate-900" style={{ ['--delay' as string]: '20ms' }}>{doctor.name}</h1>
          <p className="stagger-item text-sm text-slate-500" style={{ ['--delay' as string]: '110ms' }}>{doctor.specialization}</p>
        </div>
        <button onClick={handleLogout} className="rounded-xl border border-slate-200 bg-white/80 px-4 py-2 text-sm font-medium text-slate-600 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary hover:text-slate-900">Logout</button>
      </header>

      <div className="mx-auto max-w-6xl p-6">
        <div className="stagger-item premium-glass relative mb-6 flex flex-wrap items-center gap-1 rounded-2xl p-1.5" style={{ ['--delay' as string]: '180ms' }}>
          <div
            className="absolute top-1.5 h-[calc(100%-12px)] rounded-xl bg-gradient-to-r from-cyan-500 to-sky-600 shadow-lg shadow-cyan-600/30 transition-all duration-300"
            style={{
              width: `${100 / tabs.length}%`,
              transform: `translateX(${currentTabIndex * 100}%)`,
            }}
          />
          {tabs.map(tabItem => (
            <button key={tabItem.id} onClick={() => setTab(tabItem.id)} className={`${tabClass(tabItem.id)} flex-1 justify-center`}>
              <tabItem.icon className="h-4 w-4" />
              <span className="hidden lg:inline">{tabItem.label}</span>
              <span className="lg:hidden">{tabItem.label.split(' ')[0]}</span>
            </button>
          ))}
        </div>

        {tab === 'today' && (
          <div className="tab-panel space-y-3">
            {todayAppts.length === 0 && (
              <div className="premium-glass mx-auto max-w-2xl rounded-3xl p-8 text-center">
                <svg viewBox="0 0 280 180" className="mx-auto h-44 w-full max-w-sm">
                  <rect x="50" y="26" width="180" height="126" rx="18" fill="#E0F2FE" stroke="#38BDF8" strokeWidth="2" />
                  <rect x="70" y="52" width="140" height="18" rx="9" fill="#BAE6FD" />
                  <rect x="70" y="80" width="94" height="12" rx="6" fill="#BFDBFE" />
                  <rect x="70" y="100" width="120" height="12" rx="6" fill="#BFDBFE" />
                  <circle cx="212" cy="112" r="21" fill="#ECFEFF" stroke="#22D3EE" strokeWidth="2" />
                  <path d="M204 112l6 6 10-12" fill="none" stroke="#0891B2" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <h3 className="mt-2 text-xl font-bold text-slate-900">No appointments today</h3>
                <p className="mt-2 text-sm text-slate-500">Your calendar is clear. Enjoy a calm day or review recent case history.</p>
              </div>
            )}
            {todayAppts.map((appt, idx) => {
              const patient = getPatient(appt.patientId);
              const history = getPatientHistory(appt.patientId);
              return (
                <div key={appt.id} className="premium-card stagger-item space-y-3 p-5" style={{ ['--delay' as string]: `${idx * 80}ms` }}>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-slate-900">{patient?.name || 'Unknown'}</p>
                      <p className="text-sm text-slate-500">{formatTime(appt.time)} · Age: {patient?.age} · {patient?.gender}</p>
                    </div>
                    <div className="flex gap-2">
                      {appt.status === 'booked' && (
                        <>
                          <button onClick={() => handleComplete(appt.id)}
                            className="rounded-lg bg-emerald-100 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition-all duration-300 hover:-translate-y-0.5 hover:bg-emerald-200">Complete</button>
                          <button onClick={() => { setSelectedAppt(appt.id); setTab('prescribe'); }}
                            className="premium-button rounded-lg px-3 py-1.5 text-xs text-white">Prescribe</button>
                          <button
                            onClick={() => {
                              setSelectedAppt(appt.id);
                              setTab('reports');
                            }}
                            className="rounded-lg bg-violet-600 px-3 py-1.5 text-xs text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-violet-700"
                          >
                            Add Report
                          </button>
                        </>
                      )}
                      <span className={`text-xs px-3 py-1.5 rounded-full ${appt.status === 'completed' ? 'bg-accent text-accent-foreground' : 'bg-muted text-muted-foreground'}`}>
                        {appt.status}
                      </span>
                    </div>
                  </div>
                  {(history.rxs.length > 0 || history.reports.length > 0) && (
                    <div className="border-t border-slate-200 pt-3">
                      <p className="mb-2 text-xs font-medium text-slate-500">Medical History</p>
                      {history.rxs.slice(-2).map(rx => (
                        <div key={rx.id} className="mb-1 text-xs text-slate-500">
                          <span className="font-medium">{formatDate(rx.date)}</span>: {rx.diagnosis} — {rx.medications}
                        </div>
                      ))}
                      {history.reports.slice(-2).map(report => (
                        <div key={report.id} className="text-xs text-violet-700 mb-1">
                          <span className="font-medium">{formatDate(report.date)}</span>: Earlier disease: {report.earlyDisease} · Treatment: {report.treatmentDone}
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
          <div className="tab-panel space-y-3">
            {recentAppts.length === 0 && <p className="py-12 text-center text-slate-500">No recent appointments</p>}
            {recentAppts.map((appt, idx) => {
              const patient = getPatient(appt.patientId);
              return (
                <div key={appt.id} className="premium-card stagger-item flex items-center justify-between p-4" style={{ ['--delay' as string]: `${idx * 80}ms` }}>
                  <div>
                    <p className="font-medium text-slate-900">{patient?.name}</p>
                    <p className="text-sm text-slate-500">{formatDate(appt.date)} · {formatTime(appt.time)}</p>
                  </div>
                  <span className={`text-xs px-3 py-1 rounded-full ${appt.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                    {appt.status}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {tab === 'prescribe' && selectedAppt && (
          <form onSubmit={handlePrescribe} className="tab-panel premium-glass space-y-4 rounded-3xl p-6">
            <h3 className="font-semibold text-slate-900">Write Prescription</h3>
            <p className="text-sm text-slate-500">Patient: {getPatient(allAppts.find(a => a.id === selectedAppt)?.patientId || '')?.name}</p>
            <div className="floating-field">
              <input value={rxForm.diagnosis} onChange={e => setRxForm(p => ({...p, diagnosis: e.target.value}))} required
                className="premium-input" placeholder=" " />
              <label>Diagnosis</label>
            </div>
            <div className="floating-field">
              <textarea value={rxForm.medications} onChange={e => setRxForm(p => ({...p, medications: e.target.value}))} required rows={3}
                className="premium-input" placeholder=" " />
              <label>Medications</label>
            </div>
            <div className="floating-field">
              <textarea value={rxForm.notes} onChange={e => setRxForm(p => ({...p, notes: e.target.value}))} rows={2}
                className="premium-input" placeholder=" " />
              <label>Notes</label>
            </div>
            <button type="submit" className="premium-button rounded-lg px-6 py-2.5 font-medium text-white">Save Prescription</button>
          </form>
        )}

        {tab === 'prescriptions' && (
          <div className="tab-panel space-y-3">
            {doctorPrescriptions.length === 0 && <p className="py-12 text-center text-slate-500">No prescriptions created yet</p>}
            {doctorPrescriptions.map((rx, idx) => {
              const patient = getPatient(rx.patientId);
              return (
                <div key={rx.id} className="premium-card stagger-item p-5" style={{ ['--delay' as string]: `${idx * 80}ms` }}>
                  <div className="flex justify-between">
                    <p className="font-semibold text-slate-900">{patient?.name || 'Unknown Patient'}</p>
                    <p className="text-xs text-slate-500">{formatDate(rx.date)}</p>
                  </div>
                  <p className="mt-1 text-sm text-slate-700"><span className="font-medium">Diagnosis:</span> {rx.diagnosis}</p>
                  <p className="text-sm text-slate-700"><span className="font-medium">Medications:</span> {rx.medications}</p>
                  {rx.notes && <p className="mt-1 text-sm text-slate-500">{rx.notes}</p>}
                </div>
              );
            })}
          </div>
        )}

        {tab === 'reports' && (
          <div className="tab-panel space-y-6">
            {selectedAppt && (
              <form onSubmit={handleCreateReport} className="premium-glass space-y-4 rounded-3xl p-6">
                <h3 className="font-semibold text-slate-900">Create Medical Report</h3>
                <p className="text-sm text-slate-500">Patient: {getPatient(allAppts.find(a => a.id === selectedAppt)?.patientId || '')?.name}</p>
                <div className="floating-field">
                  <input
                    value={reportForm.earlyDisease}
                    onChange={e => setReportForm(p => ({ ...p, earlyDisease: e.target.value }))}
                    required
                    className="premium-input"
                    placeholder=" "
                  />
                  <label>Earlier Disease</label>
                </div>
                <div className="floating-field">
                  <textarea
                    value={reportForm.treatmentDone}
                    onChange={e => setReportForm(p => ({ ...p, treatmentDone: e.target.value }))}
                    required
                    rows={3}
                    className="premium-input"
                    placeholder=" "
                  />
                  <label>Treatment Done in Hospital</label>
                </div>
                <div className="floating-field">
                  <textarea
                    value={reportForm.remarks}
                    onChange={e => setReportForm(p => ({ ...p, remarks: e.target.value }))}
                    rows={2}
                    className="premium-input"
                    placeholder=" "
                  />
                  <label>Remarks</label>
                </div>
                <button type="submit" className="rounded-lg bg-violet-600 px-6 py-2.5 font-medium text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-violet-700">Save Report</button>
              </form>
            )}

            <div className="space-y-3">
              {doctorReports.length === 0 && <p className="py-12 text-center text-slate-500">No reports created yet</p>}
              {doctorReports.map((report, idx) => {
                const patient = getPatient(report.patientId);
                return (
                  <div key={report.id} className="premium-card stagger-item p-5" style={{ ['--delay' as string]: `${idx * 80}ms` }}>
                    <div className="flex justify-between mb-2">
                      <p className="font-semibold text-slate-900">{patient?.name || 'Unknown Patient'}</p>
                      <p className="text-xs text-slate-500">{formatDate(report.date)}</p>
                    </div>
                    <p className="text-sm text-slate-700"><span className="font-medium">Earlier disease:</span> {report.earlyDisease}</p>
                    <p className="mt-1 text-sm text-slate-700"><span className="font-medium">Treatment done:</span> {report.treatmentDone}</p>
                    {report.remarks && <p className="mt-1 text-sm text-slate-500">{report.remarks}</p>}
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

export default DoctorDashboard;
